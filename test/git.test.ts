import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { getChangedFiles, getChanges, readFileAtRevision } from "../src/git.js";

const temporaryDirectories: string[] = [];

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

async function repository(): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), "changeproof-git-"));
  temporaryDirectories.push(directory);
  git(directory, "init", "-b", "main");
  git(directory, "config", "core.autocrlf", "false");
  git(directory, "config", "user.email", "tests@example.invalid");
  git(directory, "config", "user.name", "ChangeProof Tests");
  await mkdir(path.join(directory, "src"));
  await writeFile(path.join(directory, "README.md"), "initial\n");
  git(directory, "add", ".");
  git(directory, "commit", "-m", "initial");
  return directory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("Git changed file discovery", () => {
  it("combines staged, unstaged, and untracked files", async () => {
    const cwd = await repository();
    await writeFile(path.join(cwd, "README.md"), "changed\n");
    await writeFile(path.join(cwd, "src", "staged.ts"), "export {};\n");
    git(cwd, "add", "src/staged.ts");
    await writeFile(path.join(cwd, "src", "untracked.ts"), "export {};\n");

    expect(getChangedFiles({ cwd })).toEqual([
      "README.md",
      "src/staged.ts",
      "src/untracked.ts",
    ]);
  });

  it("compares a base revision to head", async () => {
    const cwd = await repository();
    const base = git(cwd, "rev-parse", "HEAD");
    await writeFile(path.join(cwd, "src", "index.ts"), "export {};\n");
    git(cwd, "add", ".");
    git(cwd, "commit", "-m", "add source");

    expect(getChangedFiles({ cwd, base, head: "HEAD" })).toEqual([
      "src/index.ts",
    ]);
  });

  it("reports deleted files with status for evidence evaluation", async () => {
    const cwd = await repository();
    await writeFile(path.join(cwd, "src", "remove.ts"), "export {};\n");
    git(cwd, "add", ".");
    git(cwd, "commit", "-m", "add removable source");
    const base = git(cwd, "rev-parse", "HEAD");
    await rm(path.join(cwd, "src", "remove.ts"));
    git(cwd, "add", ".");
    git(cwd, "commit", "-m", "remove source");

    expect(getChanges({ cwd, base, head: "HEAD" })).toEqual([
      { path: "src/remove.ts", status: "deleted" },
    ]);
  });

  it("treats both sides of a rename correctly", async () => {
    const cwd = await repository();
    await writeFile(path.join(cwd, "src", "old.ts"), "export const value = 1;\n");
    git(cwd, "add", ".");
    git(cwd, "commit", "-m", "add old path");
    const base = git(cwd, "rev-parse", "HEAD");
    await mkdir(path.join(cwd, "lib"));
    git(cwd, "mv", "src/old.ts", "lib/new.ts");
    git(cwd, "commit", "-m", "rename source");

    expect(getChanges({ cwd, base, head: "HEAD" })).toEqual([
      { path: "lib/new.ts", status: "renamed" },
      { path: "src/old.ts", status: "deleted" },
    ]);
  });

  it("rejects revisions that could be parsed as options", async () => {
    const cwd = await repository();
    expect(() => getChangedFiles({ cwd, base: "--output=/tmp/x" })).toThrowError(
      /Invalid base Git revision/,
    );
  });

  it("reports Git failures without invoking a shell", async () => {
    const cwd = await repository();
    expect(() => getChangedFiles({ cwd, base: "missing-ref" })).toThrowError(
      /Git command failed/,
    );
  });

  it("reads committed configuration without using working-tree contents", async () => {
    const cwd = await repository();
    await writeFile(path.join(cwd, ".changeproof.yml"), "version: 1\n");
    git(cwd, "add", ".");
    git(cwd, "commit", "-m", "add trusted configuration");
    const base = git(cwd, "rev-parse", "HEAD");
    await writeFile(path.join(cwd, ".changeproof.yml"), "untrusted\n");

    expect(readFileAtRevision(base, ".changeproof.yml", cwd)).toBe("version: 1\n");
  });

  it("rejects unsafe configuration revisions and paths before reading Git", () => {
    expect(() => readFileAtRevision("--help", ".changeproof.yml")).toThrowError(
      /Invalid configuration Git revision/,
    );
    expect(() => readFileAtRevision("HEAD", "../outside.yml")).toThrowError(
      /Invalid repository-relative path/,
    );
  });
});
