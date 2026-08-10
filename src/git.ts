import { execFileSync } from "node:child_process";
import type { ExecFileSyncOptionsWithStringEncoding } from "node:child_process";
import { normalizeChanges } from "./matcher.js";
import type { ChangedFile, ChangeStatus } from "./types.js";

export interface GitDiffOptions {
  cwd?: string;
  base?: string;
  head?: string;
}

const gitOptions = (
  cwd: string,
): ExecFileSyncOptionsWithStringEncoding => ({
  cwd,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

function validateRevision(revision: string, label: string): void {
  if (
    revision.startsWith("-") ||
    revision.length > 200 ||
    !/^[A-Za-z0-9_./@{}^~:+-]+$/.test(revision)
  ) {
    throw new Error(`Invalid ${label} Git revision: ${JSON.stringify(revision)}`);
  }
}

function nullSeparated(output: string): string[] {
  return output.split("\0").filter(Boolean);
}

function runGit(args: string[], cwd: string): string {
  try {
    return execFileSync("git", args, gitOptions(cwd));
  } catch (error) {
    const detail = (error as { stderr?: string }).stderr?.trim();
    throw new Error(`Git command failed${detail ? `: ${detail}` : "."}`);
  }
}

function statusFromGit(value: string): ChangeStatus {
  switch (value[0]) {
    case "A":
      return "added";
    case "C":
      return "copied";
    case "D":
      return "deleted";
    case "M":
      return "modified";
    case "R":
      return "renamed";
    case "T":
      return "type-changed";
    case "U":
      return "unmerged";
    default:
      return "unknown";
  }
}

function parseNameStatus(output: string): ChangedFile[] {
  const tokens = nullSeparated(output);
  const changes: ChangedFile[] = [];
  for (let index = 0; index < tokens.length; ) {
    const statusToken = tokens[index++];
    if (statusToken === undefined) break;
    const status = statusFromGit(statusToken);
    const firstPath = tokens[index++];
    if (firstPath === undefined) {
      throw new Error("Git returned an incomplete name-status record.");
    }
    if (status === "renamed" || status === "copied") {
      const secondPath = tokens[index++];
      if (secondPath === undefined) {
        throw new Error("Git returned an incomplete rename/copy record.");
      }
      if (status === "renamed") {
        changes.push({ path: firstPath, status: "deleted" });
      }
      changes.push({ path: secondPath, status });
    } else {
      changes.push({ path: firstPath, status });
    }
  }
  return changes;
}

export function getChanges(options: GitDiffOptions = {}): ChangedFile[] {
  const cwd = options.cwd ?? process.cwd();
  const head = options.head ?? "HEAD";

  if (options.base !== undefined) {
    validateRevision(options.base, "base");
    validateRevision(head, "head");
    return normalizeChanges(
      parseNameStatus(
        runGit(
          [
            "diff",
            "--name-status",
            "-z",
            "--diff-filter=ACMRTD",
            "--find-renames",
            `${options.base}...${head}`,
            "--",
          ],
          cwd,
        ),
      ),
    );
  }

  const unstaged = parseNameStatus(
    runGit(
      ["diff", "--name-status", "-z", "--diff-filter=ACMRTD", "--"],
      cwd,
    ),
  );
  const staged = parseNameStatus(
    runGit(
      [
        "diff",
        "--cached",
        "--name-status",
        "-z",
        "--diff-filter=ACMRTD",
        "--",
      ],
      cwd,
    ),
  );
  const untracked = nullSeparated(
    runGit(["ls-files", "-z", "--others", "--exclude-standard"], cwd),
  ).map((path) => ({ path, status: "added" }) satisfies ChangedFile);

  return normalizeChanges([...unstaged, ...staged, ...untracked]);
}

export function getChangedFiles(options: GitDiffOptions = {}): string[] {
  return getChanges(options).map((change) => change.path);
}
