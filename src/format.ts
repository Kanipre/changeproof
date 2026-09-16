import pc from "picocolors";
import type { EvaluationResult, PolicyResult } from "./types.js";

function statusIcon(policy: PolicyResult): string {
  if (policy.status === "passed") return "PASS";
  if (policy.status === "skipped") return "SKIP";
  return policy.severity === "warning" ? "WARN" : "FAIL";
}

export function formatPretty(result: EvaluationResult): string {
  const rows = result.policies.map((policy) => {
    const label = statusIcon(policy);
    const colored =
      label === "PASS"
        ? pc.green(label)
        : label === "SKIP"
          ? pc.dim(label)
          : label === "WARN"
            ? pc.yellow(label)
            : pc.red(label);
    return `${colored} ${pc.bold(policy.id)} - ${policy.message}`;
  });
  const summary = result.success
    ? pc.green(
        `ChangeProof passed (${result.summary.passed} passed, ${result.summary.skipped} skipped, ${result.summary.warnings} warnings).`,
      )
    : pc.red(
        `ChangeProof failed (${result.summary.errors} errors, ${result.summary.warnings} warnings).`,
      );
  return [...rows, "", summary].join("\n");
}

function escapeTable(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

export function formatMarkdown(result: EvaluationResult): string {
  const heading = result.success
    ? "## ChangeProof passed"
    : "## ChangeProof found missing evidence";
  const rows = result.policies
    .filter((policy) => policy.status !== "skipped")
    .map(
      (policy) =>
        `| ${statusIcon(policy)} | \`${escapeTable(policy.id)}\` | ${escapeTable(policy.message)} |`,
    );
  const table =
    rows.length === 0
      ? "No policies matched this change."
      : [
          "| Status | Policy | Result |",
          "| --- | --- | --- |",
          ...rows,
        ].join("\n");
  return `${heading}\n\n${table}\n`;
}

function escapeWorkflowData(value: string): string {
  return value
    .replaceAll("%", "%25")
    .replaceAll("\r", "%0D")
    .replaceAll("\n", "%0A");
}

function escapeWorkflowProperty(value: string): string {
  return escapeWorkflowData(value)
    .replaceAll(":", "%3A")
    .replaceAll(",", "%2C");
}

export function formatGitHub(result: EvaluationResult): string {
  return result.policies
    .filter((policy) => policy.status === "failed")
    .map((policy) => {
      const command = policy.severity === "error" ? "error" : "warning";
      const title = escapeWorkflowProperty(`ChangeProof: ${policy.id}`);
      const message = escapeWorkflowData(policy.message);
      return `::${command} title=${title}::${message}`;
    })
    .join("\n");
}

export function formatSarif(result: EvaluationResult): string {
  const failed = result.policies.filter(
    (policy) => policy.status === "failed",
  );
  const document = {
    version: "2.1.0",
    $schema:
      "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [
      {
        tool: {
          driver: {
            name: "ChangeProof",
            informationUri: "https://www.npmjs.com/package/@kanipre/changeproof",
            rules: failed.map((policy) => ({
              id: policy.id,
              shortDescription: {
                text: policy.description ?? "Required change evidence is missing",
              },
              defaultConfiguration: {
                level: policy.severity === "error" ? "error" : "warning",
              },
            })),
          },
        },
        results: failed.map((policy) => ({
          ruleId: policy.id,
          level: policy.severity === "error" ? "error" : "warning",
          message: { text: policy.message },
          locations:
            policy.triggeringFiles[0] === undefined
              ? []
              : [
                  {
                    physicalLocation: {
                      artifactLocation: {
                        uri: policy.triggeringFiles[0]
                          .split("/")
                          .map(encodeURIComponent)
                          .join("/"),
                      },
                      region: { startLine: 1 },
                    },
                  },
                ],
        })),
      },
    ],
  };
  return `${JSON.stringify(document, null, 2)}\n`;
}

export function formatJson(result: EvaluationResult): string {
  return `${JSON.stringify(result, null, 2)}\n`;
}
