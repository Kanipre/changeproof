# Changelog

All notable changes to this project will be documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.3] - 2026-09-16

### Security

- Read PR and merge queue policies from the event's base commit, preventing a
  contributor from weakening the policy used to check their own change. Missing
  base configuration or incomplete events fail closed. Initial policy files
  must be merged before enabling the required check; policy edits apply after
  merging. Push/manual action and CLI configuration behavior is unchanged.
- Upgrade Vitest and its matching coverage provider to 4.1.11 to address
  GHSA-82fw-gwwq-j7x9 in development tooling.

### Fixed

- Preserve filename whitespace so similarly named files cannot satisfy an
  exact evidence requirement accidentally.
- Percent-encode SARIF artifact paths and correct the scoped npm package link.

### Maintenance

- Add bundled Action integration tests using temporary Git repositories,
  a documented threat model, and a reproducible CLI demo.
- Update paired, SHA-pinned CodeQL actions to v4.37.9.

## [0.1.2] - 2026-08-13

### Changed

- Published the CLI under the verified maintainer scope as
  `@kanipre/changeproof` after npm rejected the similar unscoped name.
- Updated the quick start to use the public npm package and documented one-off
  `npx` usage.

## [0.1.1] - 2026-08-13

### Changed

- Moved the bundled GitHub Action from the Node.js 20 runtime to Node.js 24.
- Updated SHA-pinned GitHub-maintained actions used by CI and security checks.
- Limited grouped development dependency updates to minor and patch releases;
  incompatible production major releases remain explicit maintainer decisions.
- Replaced the unavailable npm-registry quick start with the installable GitHub
  Release artifact path.

## [0.1.0] - 2026-08-10

### Added

- Strict version 1 policy schema.
- Deterministic changed-file evaluator with `any` and `all` requirements.
- Status-aware Git evaluation where deletions trigger rules but are not evidence.
- CLI output for terminals, JSON, Markdown, GitHub annotations, and SARIF.
- GitHub Action with event-aware revision discovery and job summaries.
- Initial maintainer governance, security policy, and contribution workflow.

[Unreleased]: https://github.com/Kanipre/changeproof/compare/v0.1.3...HEAD
[0.1.3]: https://github.com/Kanipre/changeproof/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/Kanipre/changeproof/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Kanipre/changeproof/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Kanipre/changeproof/releases/tag/v0.1.0
