export { ConfigError, loadConfig, parseConfig } from "./config.js";
export { evaluate } from "./evaluate.js";
export {
  formatGitHub,
  formatJson,
  formatMarkdown,
  formatPretty,
  formatSarif,
} from "./format.js";
export { getChangedFiles, getChanges } from "./git.js";
export type {
  ChangedFile,
  ChangeStatus,
  ChangeProofConfig,
  EvaluationResult,
  Policy,
  PolicyResult,
  Severity,
} from "./types.js";
