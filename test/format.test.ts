import { describe, expect, it } from "vitest";
import {
  formatGitHub,
  formatJson,
  formatMarkdown,
  formatPretty,
  formatSarif,
} from "../src/format.js";
import type { EvaluationResult } from "../src/types.js";

const result: EvaluationResult = {
  success: false,
  changedFiles: ["src/index.ts"],
  policies: [
    {
      id: "api-docs",
      description: "API | docs",
      severity: "error",
      status: "failed",
      triggeringFiles: ["src/index.ts"],
      evidenceFiles: [],
      missing: ["docs/**"],
      message: "Missing docs\nnow",
    },
    {
      id: "tests",
      severity: "warning",
      status: "failed",
      triggeringFiles: ["src/index.ts"],
      evidenceFiles: [],
      missing: ["test/**"],
      message: "Missing 100% coverage",
    },
    {
      id: "changelog",
      severity: "error",
      status: "passed",
      triggeringFiles: ["src/index.ts"],
      evidenceFiles: ["CHANGELOG.md"],
      missing: [],
      message: "Required evidence is present.",
    },
  ],
  summary: {
    passed: 1,
    failed: 2,
    skipped: 0,
    errors: 1,
    warnings: 1,
  },
};

describe("output formats", () => {
  it("renders terminal, markdown, and JSON summaries", () => {
    expect(formatPretty(result)).toContain("ChangeProof failed");
    expect(formatMarkdown(result)).toContain("ChangeProof found missing evidence");
    expect(formatMarkdown(result)).toContain("Missing docs now");
    expect(JSON.parse(formatJson(result))).toMatchObject({ success: false });
  });

  it("escapes GitHub workflow commands", () => {
    const output = formatGitHub(result);
    expect(output).toContain("::error title=ChangeProof%3A api-docs::Missing docs%0Anow");
    expect(output).toContain("Missing 100%25 coverage");
  });

  it("emits SARIF with rules, levels, and locations", () => {
    const sarif = JSON.parse(formatSarif(result));
    expect(sarif.version).toBe("2.1.0");
    expect(sarif.runs[0].tool.driver.rules).toHaveLength(2);
    expect(sarif.runs[0].results[0]).toMatchObject({
      ruleId: "api-docs",
      level: "error",
    });
    expect(
      sarif.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri,
    ).toBe("src/index.ts");
  });
});
