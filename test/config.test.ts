import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ConfigError, loadConfig, parseConfig } from "../src/config.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("configuration", () => {
  it("parses a valid policy and defaults severity to error", () => {
    const config = parseConfig(`
version: 1
policies:
  - id: source-needs-tests
    when:
      changed: ["src/**"]
    require:
      any: ["test/**"]
`);

    expect(config.policies[0]?.severity).toBe("error");
  });

  it("rejects invalid YAML", () => {
    expect(() => parseConfig("version: ["))
      .toThrowError(/Invalid YAML/);
  });

  it("rejects duplicate ids and negated globs", () => {
    expect(() =>
      parseConfig(`
version: 1
policies:
  - id: duplicate
    when: { changed: ["src/**"] }
    require: { any: ["!test/**"] }
  - id: duplicate
    when: { changed: ["lib/**"] }
    require: { all: ["docs/**"] }
`),
    ).toThrowError(/Negated globs|Duplicate policy id/);
  });

  it("rejects a policy with no requirement", () => {
    expect(() =>
      parseConfig(`
version: 1
policies:
  - id: empty
    when: { changed: ["src/**"] }
    require: {}
`),
    ).toThrowError(/At least one/);
  });

  it("loads a config from disk and reports missing files", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "changeproof-config-"));
    temporaryDirectories.push(directory);
    await writeFile(
      path.join(directory, "policy.yml"),
      "version: 1\npolicies:\n  - id: docs\n    when: { changed: ['src/**'] }\n    require: { any: ['docs/**'] }\n",
    );

    await expect(loadConfig("policy.yml", directory)).resolves.toMatchObject({
      version: 1,
    });
    await expect(loadConfig("missing.yml", directory)).rejects.toBeInstanceOf(
      ConfigError,
    );
  });
});
