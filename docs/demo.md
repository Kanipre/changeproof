# Reproducible local demo

This is a maintainer-authored smoke test, not a claim of external adoption.
It uses explicit file lists to demonstrate the policy evaluator without
executing any repository code. Run it in a new empty directory with Node 20+:

```sh
npx @kanipre/changeproof init
npx @kanipre/changeproof check --file src/parser.ts
# Exit 1: a source change without test evidence fails.

npx @kanipre/changeproof check --file src/parser.ts --file test/parser.test.ts
# Exit 0: the source change includes matching test evidence.

npx @kanipre/changeproof check --file docs/guide.md
# Exit 0: the starter source policy does not match a documentation-only change.
```

Use `--format json` to inspect machine-readable results or `--format sarif`
for a report suitable for code-scanning tools. To inspect real repository
changes, omit `--file` and use `--base origin/main --head HEAD` after fetching
the required history. Explicit file lists do not verify that those files were
actually changed.

For v0.1.3 source verification, `npm ci && npm run verify` also runs the bundled
GitHub Action in real temporary Git repositories. Its tests confirm that a PR
which changes its policy to skip a source change still fails under the trusted
base policy, and that adding the required evidence passes.

For a production rollout, begin with warning policies and record real results
as described in the [adoption guide](adoption.md).
