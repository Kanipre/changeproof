import { filesMatching, matchesAny, normalizeChanges } from "./matcher.js";
import type {
  ChangedFile,
  ChangeProofConfig,
  EvaluationResult,
  Policy,
  PolicyResult,
} from "./types.js";

function evaluatePolicy(
  policy: Policy,
  changedFiles: string[],
  evidenceCandidates: string[],
): PolicyResult {
  const triggeringFiles = filesMatching(changedFiles, policy.when.changed).filter(
    (file) => !matchesAny(file, policy.when.ignore ?? []),
  );

  const base = {
    id: policy.id,
    ...(policy.description === undefined
      ? {}
      : { description: policy.description }),
    severity: policy.severity,
    triggeringFiles,
  };

  if (triggeringFiles.length === 0) {
    return {
      ...base,
      status: "skipped",
      evidenceFiles: [],
      missing: [],
      message: "Policy did not match this change.",
    };
  }

  const anyPatterns = policy.require.any ?? [];
  const allPatterns = policy.require.all ?? [];
  const anyEvidence = filesMatching(evidenceCandidates, anyPatterns);
  const anySatisfied = anyPatterns.length === 0 || anyEvidence.length > 0;
  const missingAll = allPatterns.filter(
    (pattern) => !evidenceCandidates.some((file) => matchesAny(file, [pattern])),
  );
  const evidenceFiles = [
    ...new Set([
      ...anyEvidence,
      ...filesMatching(evidenceCandidates, allPatterns),
    ]),
  ].sort();
  const missing = [
    ...(anySatisfied ? [] : [`one of: ${anyPatterns.join(", ")}`]),
    ...missingAll,
  ];
  const passed = anySatisfied && missingAll.length === 0;

  return {
    ...base,
    status: passed ? "passed" : "failed",
    evidenceFiles,
    missing,
    message: passed
      ? "Required evidence is present."
      : (policy.message ?? `Missing required evidence: ${missing.join("; ")}`),
  };
}

export function evaluate(
  config: ChangeProofConfig,
  files: readonly (string | ChangedFile)[],
): EvaluationResult {
  const changes = normalizeChanges(files);
  const changedFiles = changes.map((change) => change.path);
  const evidenceCandidates = changes
    .filter((change) => change.status !== "deleted")
    .map((change) => change.path);
  const policies = config.policies.map((policy) =>
    evaluatePolicy(policy, changedFiles, evidenceCandidates),
  );
  const failed = policies.filter((policy) => policy.status === "failed");
  const errors = failed.filter((policy) => policy.severity === "error").length;
  const warnings = failed.filter(
    (policy) => policy.severity === "warning",
  ).length;

  return {
    success: errors === 0,
    changedFiles,
    policies,
    summary: {
      passed: policies.filter((policy) => policy.status === "passed").length,
      failed: failed.length,
      skipped: policies.filter((policy) => policy.status === "skipped").length,
      errors,
      warnings,
    },
  };
}
