# Changelog

All notable changes to this project will be documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/Kanipre/changeproof/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/Kanipre/changeproof/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Kanipre/changeproof/releases/tag/v0.1.0
