# Maintainer playbook

This is the operating checklist for people with repository write access.

## Issue triage

Triage new Issues weekly when capacity permits.

1. Confirm the report contains a version, environment, and reproduction.
2. Apply one type label: `bug`, `enhancement`, `documentation`, or `question`.
3. Apply one state label: `needs-info`, `confirmed`, `blocked`, or
   `ready-for-work`.
4. Add impact (`impact:high`, `impact:medium`, `impact:low`) only after
   confirmation.
5. Close support requests that belong in Discussions with a direct pointer.

Security reports never move through public Issue triage.

## Pull request review

Review in this order:

1. Does the change solve a confirmed problem without expanding scope?
2. Are trust boundaries preserved: no shell invocation, no repository code
   execution, and no network dependency in evaluation?
3. Do tests cover failure behavior and Windows path behavior where relevant?
4. Is a schema or CLI change documented and represented in the changelog?
5. Are action bundle changes explained by source changes and dependency lockfile
   changes?

Use conventional review states: approve only when merge-ready, comment for
non-blocking suggestions, and request changes for correctness or safety issues.

## Release checklist

1. Ensure `main` is green and the dependency audit reports zero known issues.
2. Move relevant changelog entries from `Unreleased` to the release version.
3. Confirm version consistency in `package.json` and CLI output.
4. Run `npm ci`, `npm run verify`, and `npm pack --dry-run` from a clean clone.
5. Inspect `action-dist/index.cjs`, the package file list, and update
   `THIRD_PARTY_NOTICES.md` when bundled dependencies change.
6. Tag the reviewed commit as `vX.Y.Z`; the release workflow publishes npm and
   creates GitHub release notes.
7. Verify installation in a new temporary directory and run one passing and one
   failing policy.
8. Move the floating `v1` tag only for compatible stable releases after 1.0.

Never publish from an uncommitted working tree or bypass a failed required
check.

## Deprecation

Before 1.0, breaking changes require release notes and a migration example.
After 1.0, deprecated behavior remains for at least one minor release unless it
creates a security issue. Schema version 1 will never be silently reinterpreted.
