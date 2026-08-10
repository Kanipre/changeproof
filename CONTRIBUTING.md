# Contributing

Thank you for helping make pull request review more dependable.

## Before opening code

For a bug, open a report with a minimal repository layout and expected result.
For a feature that changes schema or CLI behavior, open a design Issue first so
maintainers and users can test the premise before implementation.

Small documentation fixes may go directly to a pull request.

## Development setup

Requirements: Node.js 20 or newer and Git.

```sh
git clone https://github.com/Kanipre/changeproof.git
cd changeproof
npm ci
npm run verify
```

Useful focused commands:

```sh
npm run typecheck
npm test
npm run test:coverage
npm run build
```

## Pull requests

- Keep one problem per pull request.
- Add a failing test before a bug fix when practical.
- Update README or `docs/` for user-visible behavior.
- Add a changelog entry for behavior, compatibility, or security changes.
- Do not edit `action-dist/index.cjs` by hand; run `npm run build`.
- Explain security and compatibility effects in the pull request template.

Pull requests from forks run with read-only permissions. Contributions must not
depend on repository secrets.

## Style and tests

TypeScript is strict. Prefer small pure functions and explicit data structures.
The core evaluator must stay deterministic and free of filesystem, network,
environment, and process dependencies.

Tests should cover behavior, not implementation detail. Path-related changes
must include Windows separators, traversal attempts, or case behavior when
relevant. Coverage thresholds are a floor, not a substitute for meaningful
assertions.

## Commit and licensing policy

Clear imperative commit subjects are preferred; Conventional Commits are not
required. By contributing, you agree that your contribution is licensed under
the project's Apache-2.0 license and that you have the right to submit it.

All contributors must follow the [Code of Conduct](CODE_OF_CONDUCT.md).
