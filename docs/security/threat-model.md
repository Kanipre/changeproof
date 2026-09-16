# Threat model

ChangeProof checks whether a change includes expected files. It is not a sandbox
or a review of file contents. Its result supplements tests and human review.

## Inputs and trust

- **PR and merge queue policy:** read from the GitHub event's base commit.
  Contributor changes to the policy cannot relax their own check. Missing or
  invalid base policy fails closed. A maintainer must first merge the initial
  policy and review future policy changes.
- **Changed paths and statuses:** obtained from null-delimited Git output.
  Traversal and absolute paths are rejected, whitespace remains significant,
  and deleted files trigger policies without satisfying evidence requirements.
- **Git revisions:** validated and passed to `execFileSync` as arguments, not
  shell text. Policy reads first resolve a commit and then read its Git object;
  a symlink in the checkout is not followed to retrieve PR policy content.
- **YAML:** parsed as data and validated with a strict, versioned schema.
  Configuration has no executable hooks. Parser and glob resource-exhaustion
  risks still require dependency review and bounded CI jobs.
- **Output:** workflow annotations escape control characters; SARIF encodes
  file paths as URIs. Human-readable policy messages are maintainer-authored
  text, not instructions for an agent.
- **Distribution:** the bundled action includes dependencies. Review source,
  lockfile, generated bundle, upstream advisories and CI before tagging.

## Deployment responsibilities

Use a reviewed ChangeProof action release or immutable commit SHA and a
read-only `contents` token. Do not use `pull_request_target` to run untrusted
checkout code with secrets. Local `uses: ./` runs the contributor's action
implementation; ChangeProof's self-tests use that deliberately, but downstream
security gates must use a trusted action reference.

The CLI and push/manual actions use local configuration, so their callers must
provide a trusted config. Explicit `--file` inputs are assertions supplied by
the caller, not independent proof of a Git change. Branch protection must
require the check if it is intended to block merging.

## Residual limits

A meaningless test file can satisfy a filename rule. ChangeProof cannot prove
test quality, security review, or absence of malicious code. It is not an AI
agent, does not make API calls, and does not execute evidence files. If a model
consumes issues, PR text, or reports, that separate workflow must handle prompt
injection and must not grant the model credentials or automatic merge authority.

`test/action.integration.test.ts` runs the bundled action in temporary Git
repositories to cover policy tampering, merge queues, valid evidence, missing
base configuration, malformed events, and push compatibility.
