import { describe, expect, it } from "vitest";
import { evaluate } from "../src/evaluate.js";
import type { ChangeProofConfig } from "../src/types.js";

const config: ChangeProofConfig = {
  version: 1,
  policies: [
    {
      id: "source-needs-tests",
      when: { changed: ["src/**"], ignore: ["src/**/*.test.ts"] },
      require: { any: ["test/**", "**/*.test.ts"] },
      severity: "error",
    },
    {
      id: "api-needs-docs-and-changelog",
      description: "Public API evidence",
      when: { changed: ["src/index.ts"] },
      require: { all: ["docs/**", "CHANGELOG.md"] },
      severity: "warning",
      message: "Document the API and update the changelog.",
    },
  ],
};

describe("evaluate", () => {
  it("passes an any requirement when one evidence file is present", () => {
    const result = evaluate(config, ["src/parser.ts", "test/parser.test.ts"]);

    expect(result.success).toBe(true);
    expect(result.policies[0]).toMatchObject({
      status: "passed",
      triggeringFiles: ["src/parser.ts"],
      evidenceFiles: ["test/parser.test.ts"],
    });
    expect(result.summary).toEqual({
      passed: 1,
      failed: 0,
      skipped: 1,
      errors: 0,
      warnings: 0,
    });
  });

  it("fails when required evidence is missing", () => {
    const result = evaluate(config, ["src/parser.ts"]);

    expect(result.success).toBe(false);
    expect(result.policies[0]).toMatchObject({
      status: "failed",
      severity: "error",
      missing: ["one of: test/**, **/*.test.ts"],
    });
    expect(result.summary.errors).toBe(1);
  });

  it("requires every all pattern and keeps warnings non-blocking", () => {
    const result = evaluate(config, ["src/index.ts", "docs/api.md"]);

    expect(result.success).toBe(false);
    expect(result.policies[1]).toMatchObject({
      status: "failed",
      missing: ["CHANGELOG.md"],
      message: "Document the API and update the changelog.",
    });
    expect(result.summary).toMatchObject({ errors: 1, warnings: 1 });

    const warningOnly = evaluate(
      { version: 1, policies: [config.policies[1]!] },
      ["src/index.ts", "docs/api.md"],
    );
    expect(warningOnly.success).toBe(true);
    expect(warningOnly.summary.warnings).toBe(1);
  });

  it("skips ignored source test changes", () => {
    const result = evaluate(config, ["src/parser.test.ts"]);

    expect(result.success).toBe(true);
    expect(result.summary.skipped).toBe(2);
  });

  it("normalizes and deduplicates changed paths", () => {
    const result = evaluate(config, [
      ".\\src\\parser.ts",
      "src/parser.ts",
      "test/parser.test.ts",
    ]);

    expect(result.changedFiles).toEqual([
      "src/parser.ts",
      "test/parser.test.ts",
    ]);
  });

  it("lets deletions trigger policies but never count as evidence", () => {
    const result = evaluate(config, [
      { path: "src/parser.ts", status: "deleted" },
      { path: "test/parser.test.ts", status: "deleted" },
    ]);

    expect(result.success).toBe(false);
    expect(result.policies[0]).toMatchObject({
      status: "failed",
      triggeringFiles: ["src/parser.ts"],
      evidenceFiles: [],
    });
  });

  it("does not treat a different whitespace-suffixed file as exact evidence", () => {
    const result = evaluate(
      { version: 1, policies: [config.policies[1]!] },
      ["src/index.ts", "docs/api.md", "CHANGELOG.md "],
    );

    expect(result.policies[0]).toMatchObject({
      status: "failed",
      missing: ["CHANGELOG.md"],
    });
    expect(result.changedFiles).toContain("CHANGELOG.md ");
  });
});
