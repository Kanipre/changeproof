export type Severity = "error" | "warning";

export type ChangeStatus =
  | "added"
  | "copied"
  | "deleted"
  | "modified"
  | "renamed"
  | "type-changed"
  | "unmerged"
  | "unknown";

export interface ChangedFile {
  path: string;
  status: ChangeStatus;
}

export interface ChangeProofConfig {
  $schema?: string;
  version: 1;
  policies: Policy[];
}

export interface Policy {
  id: string;
  description?: string;
  when: {
    changed: string[];
    ignore?: string[];
  };
  require: {
    any?: string[];
    all?: string[];
  };
  severity: Severity;
  message?: string;
}

export interface PolicyResult {
  id: string;
  description?: string;
  severity: Severity;
  status: "passed" | "failed" | "skipped";
  triggeringFiles: string[];
  evidenceFiles: string[];
  missing: string[];
  message: string;
}

export interface EvaluationResult {
  success: boolean;
  changedFiles: string[];
  policies: PolicyResult[];
  summary: {
    passed: number;
    failed: number;
    skipped: number;
    errors: number;
    warnings: number;
  };
}
