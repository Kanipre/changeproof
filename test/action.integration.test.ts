import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const bundle = fileURLToPath(new URL("../action-dist/index.cjs", import.meta.url));
const temporaryDirectories: string[] = [];
const strictPolicy = `version: 1
policies:
  - id: source-needs-tests
    when:
      changed: ["source.ts"]
    require:
      any: ["source.test.ts"]
`;
const weakenedPolicy = strictPolicy.replace('changed: ["source.ts"]', 'changed: ["docs/**"]');

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

async function fixture(options: { evidence?: boolean; baseConfig?: boolean } = {}) {
  const cwd = await mkdtemp(path.join(tmpdir(), "changeproof-action-"));
  temporaryDirectories.push(cwd);
  git(cwd, "init", "-b", "main");
  git(cwd, "config", "core.autocrlf", "false");
  git(cwd, "config", "user.email", "tests@example.invalid");
  git(cwd, "config", "user.name", "ChangeProof Tests");
  await writeFile(path.join(cwd, "README.md"), "fixture\n");
  if (options.baseConfig !== false) {
    await writeFile(path.join(cwd, ".changeproof.yml"), strictPolicy);
  }
  git(cwd, "add", ".");
  git(cwd, "commit", "-m", "trusted policy");
  const base = git(cwd, "rev-parse", "HEAD");
  await writeFile(path.join(cwd, ".changeproof.yml"), weakenedPolicy);
  await writeFile(path.join(cwd, "source.ts"), "export const value = 1;\n");
  if (options.evidence) {
    await writeFile(path.join(cwd, "source.test.ts"), "// fixture evidence\n");
  }
  git(cwd, "add", ".");
  git(cwd, "commit", "-m", "proposed change");
  return { cwd, base, head: git(cwd, "rev-parse", "HEAD") };
}

async function runBundle(cwd: string, event: object, inputs: Record<string, string> = {}) {
  const eventPath = path.join(cwd, "event.json");
  const outputPath = path.join(cwd, "outputs.txt");
  const summaryPath = path.join(cwd, "summary.md");
  await writeFile(eventPath, JSON.stringify(event));
  await writeFile(outputPath, "");
  await writeFile(summaryPath, "");
  const execution = spawnSync(process.execPath, [bundle], {
    cwd,
    encoding: "utf8",
    timeout: 15_000,
    env: {
      ...process.env,
      INPUT_CONFIG: ".changeproof.yml",
      INPUT_BASE: "",
      INPUT_HEAD: "",
      GITHUB_EVENT_PATH: eventPath,
      GITHUB_OUTPUT: outputPath,
      GITHUB_STEP_SUMMARY: summaryPath,
      ...inputs,
    },
  });
  if (execution.error) throw execution.error;
  return {
    status: execution.status,
    stdout: execution.stdout,
    outputs: await readFile(outputPath, "utf8"),
    summary: await readFile(summaryPath, "utf8"),
  };
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true }),
  ));
});

describe("published Action trust boundaries", () => {
  it("uses the PR base policy even when the contributor weakens it", async () => {
    const { cwd, base, head } = await fixture();
    const result = await runBundle(cwd, {
      pull_request: { base: { sha: base }, head: { sha: head } },
    });
    expect(result.status).toBe(1);
    expect(result.summary).toContain("ChangeProof found missing evidence");
    expect(result.outputs).toMatch(/passed<<[^\n]+\r?\nfalse\r?\n/);
  });

  it("passes when evidence required by the PR base policy is present", async () => {
    const { cwd, base, head } = await fixture({ evidence: true });
    const result = await runBundle(cwd, {
      pull_request: { base: { sha: base }, head: { sha: head } },
    });
    expect(result.status).toBe(0);
    expect(result.summary).toContain("source-needs-tests");
    expect(result.summary).toContain("Required evidence is present");
  });

  it("uses the merge queue base policy", async () => {
    const { cwd, base, head } = await fixture();
    const result = await runBundle(cwd, { merge_group: { base_sha: base, head_sha: head } });
    expect(result.status).toBe(1);
    expect(result.summary).toContain("ChangeProof found missing evidence");
  });

  it("does not fall back to a contributor policy when the base config is absent", async () => {
    const { cwd, base, head } = await fixture({ baseConfig: false });
    const result = await runBundle(cwd, {
      pull_request: { base: { sha: base }, head: { sha: head } },
    });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("Git command failed");
    expect(result.outputs).not.toContain("passed<<");
  });

  it("fails for an incomplete PR event instead of using the working tree", async () => {
    const { cwd, head } = await fixture();
    const result = await runBundle(cwd, { pull_request: { head: { sha: head } } });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("missing base or head");
  });

  it("keeps checked-out configuration for push events", async () => {
    const { cwd, base, head } = await fixture();
    const result = await runBundle(cwd, { before: base, after: head });
    expect(result.status).toBe(0);
    expect(result.summary).toContain("No policies matched");
  });
});
