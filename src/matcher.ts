import { minimatch } from "minimatch";
import type { ChangedFile, ChangeStatus } from "./types.js";

const MATCH_OPTIONS = {
  dot: true,
  nocase: false,
  nocomment: true,
  nonegate: true,
} as const;

export function normalizeRepositoryPath(input: string): string {
  const value = input.replaceAll("\\", "/");

  if (
    value.length === 0 ||
    value.startsWith("/") ||
    /^[A-Za-z]:\//.test(value) ||
    value.includes("\0") ||
    value.split("/").includes("..")
  ) {
    throw new Error(`Invalid repository-relative path: ${JSON.stringify(input)}`);
  }

  const normalized = value
    .split("/")
    .filter((segment) => segment !== "" && segment !== ".")
    .join("/");
  if (normalized.length === 0) {
    throw new Error(`Invalid repository-relative path: ${JSON.stringify(input)}`);
  }
  return normalized;
}

export function normalizeChangedFiles(files: readonly string[]): string[] {
  return [...new Set(files.map(normalizeRepositoryPath))].sort();
}

const changeStatuses = new Set<ChangeStatus>([
  "added",
  "copied",
  "deleted",
  "modified",
  "renamed",
  "type-changed",
  "unmerged",
  "unknown",
]);

export function normalizeChanges(
  changes: readonly (string | ChangedFile)[],
): ChangedFile[] {
  const byPath = new Map<string, ChangeStatus>();
  for (const change of changes) {
    const path = normalizeRepositoryPath(
      typeof change === "string" ? change : change.path,
    );
    const status = typeof change === "string" ? "modified" : change.status;
    if (!changeStatuses.has(status)) {
      throw new Error(`Invalid change status for ${path}: ${String(status)}`);
    }
    const previous = byPath.get(path);
    if (previous === undefined || status === "deleted") byPath.set(path, status);
  }
  return [...byPath]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([path, status]) => ({ path, status }));
}

export function matchesAny(file: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => minimatch(file, pattern, MATCH_OPTIONS));
}

export function filesMatching(
  files: readonly string[],
  patterns: readonly string[],
): string[] {
  return files.filter((file) => matchesAny(file, patterns));
}
