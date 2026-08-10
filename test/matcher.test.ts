import { describe, expect, it } from "vitest";
import {
  filesMatching,
  matchesAny,
  normalizeChangedFiles,
  normalizeChanges,
  normalizeRepositoryPath,
} from "../src/matcher.js";

describe("repository path matching", () => {
  it("matches dotfiles and keeps matching case-sensitive", () => {
    expect(matchesAny(".github/workflows/ci.yml", [".github/**"])).toBe(true);
    expect(matchesAny("SRC/index.ts", ["src/**"])).toBe(false);
  });

  it("returns every matching file", () => {
    expect(filesMatching(["src/a.ts", "docs/a.md"], ["src/**"])).toEqual([
      "src/a.ts",
    ]);
  });

  it("normalizes separators, duplicate slashes, and duplicates", () => {
    expect(normalizeRepositoryPath(".\\src\\\\a.ts")).toBe("src/a.ts");
    expect(normalizeRepositoryPath("./src/./a.ts")).toBe("src/a.ts");
    expect(normalizeChangedFiles(["b.ts", "a.ts", "a.ts"])).toEqual([
      "a.ts",
      "b.ts",
    ]);
  });

  it("normalizes change records and keeps deletion status", () => {
    expect(
      normalizeChanges([
        { path: "src/a.ts", status: "modified" },
        { path: "src/a.ts", status: "deleted" },
        "test/a.test.ts",
      ]),
    ).toEqual([
      { path: "src/a.ts", status: "deleted" },
      { path: "test/a.test.ts", status: "modified" },
    ]);
  });

  it("rejects unknown change statuses at runtime", () => {
    expect(() =>
      normalizeChanges([
        { path: "src/a.ts", status: "invented" as "modified" },
      ]),
    ).toThrowError(/Invalid change status/);
  });

  it.each(["", "../secret", "/absolute", "C:/absolute", "a/../b"])(
    "rejects unsafe path %j",
    (candidate) => {
      expect(() => normalizeRepositoryPath(candidate)).toThrowError(
        /Invalid repository-relative path/,
      );
    },
  );
});
