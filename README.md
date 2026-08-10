# ChangeProof

**Make every risky change bring its evidence.**

ChangeProof is a language-independent CLI and GitHub Action that checks whether
a pull request includes the evidence your repository expects. A source change
can require tests, a public API change can require release notes, and an
authentication change can require both tests and a threat-model update.

The rules are declarative YAML. ChangeProof does not execute repository code,
call a hosted service, or send source data over the network.

> **Project status:** pre-release (`0.1.x`). The configuration format is usable,
> but compatibility is not guaranteed until `1.0.0`.

## Why this exists

Path filters answer, “Which CI job should run?” ChangeProof answers, “What
evidence must accompany this change?” That distinction matters when a project
receives many pull requests, especially small or automated patches that look
plausible but omit tests, documentation, release notes, or security review.

- Language and build-system independent
- Deterministic and reviewable policy-as-code
- Works locally, in any CI system, or as a GitHub Action
- Error and warning severities for gradual adoption
- Terminal, JSON, Markdown, GitHub annotation, and SARIF output
- No API key and no network access at runtime

## Quick start

ChangeProof requires Node.js 20 or newer.

```sh
npx changeproof init
npx changeproof check
```

The generated `.changeproof.yml` starts with one rule: changes under `src/`
must include a test file.

```yaml
version: 1

policies:
  - id: source-needs-tests
    description: Source changes should include test evidence.
    when:
      changed:
        - "src/**"
      ignore:
        - "src/**/*.test.*"
    require:
      any:
        - "test/**"
        - "tests/**"
        - "**/*.test.*"
        - "**/*.spec.*"
    severity: error
    message: Add or update a test that exercises this source change.
```

Run it against the working tree:

```sh
npx changeproof check
```

Or compare two Git revisions:

```sh
npx changeproof check --base origin/main --head HEAD
```

## GitHub Action

`fetch-depth: 0` is required so ChangeProof can compare the event's base and
head commits. Pin the reviewed release tag shown below rather than a moving
branch.

```yaml
name: Change evidence

on:
  pull_request:
  merge_group:

permissions:
  contents: read

jobs:
  changeproof:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
      - uses: Kanipre/changeproof@v0.1.0
```

The action publishes a job summary and annotations, then fails only when an
`error` policy is missing evidence. Failed `warning` policies remain visible
without blocking the pull request.

## Requirement semantics

`require.any` passes when at least one listed pattern matches a changed file.
`require.all` passes only when every listed pattern matches at least one changed
file. When both are present, both conditions must pass.

```yaml
require:
  any:
    - "test/**"
    - "**/*.test.*"
  all:
    - "CHANGELOG.md"
    - "docs/migration.md"
```

Patterns use `minimatch` syntax, paths are repository-relative, dotfiles are
included, and matching is case-sensitive. Negated patterns are intentionally
unsupported; use `when.ignore` so policy intent stays explicit.

Deleted files still activate matching policies, but do not count as evidence.
Deleting a protected source file can therefore require a test or release note;
deleting the test itself cannot satisfy that requirement.

See [configuration reference](docs/configuration.md) and the
[monorepo example](examples/monorepo.yml).

## CLI

```text
changeproof check [options]
  -c, --config <path>     configuration path (default: .changeproof.yml)
      --base <revision>   base Git revision
      --head <revision>   head Git revision (default: HEAD)
      --file <path>       explicit changed file; repeatable
  -f, --format <format>   pretty | json | markdown | github | sarif
  -o, --output <path>     write output to a file

changeproof init [--force]
```

Exit codes are `0` for a pass, `1` for missing error-level evidence, and `2`
for invalid input, configuration, or Git state.

## Design boundaries

ChangeProof verifies that evidence files are present in a change. It does not
claim that a test is correct, documentation is complete, or a threat model was
reviewed. Keep existing test, coverage, review, and security checks; use
ChangeProof to make missing categories visible early and consistently.

The engine accepts an explicit list of paths, so other tools can use it without
Git or GitHub. The public TypeScript API exports configuration parsing,
evaluation, Git discovery, and all formatters.

## Project operations

- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)
- [Governance](GOVERNANCE.md)
- [Maintainer playbook](docs/maintainer-playbook.md)
- [Architecture](ARCHITECTURE.md)
- [Roadmap](docs/roadmap.md)
- [Adoption guide](docs/adoption.md)
- [Support](SUPPORT.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)

ChangeProof uses its own policies in [`.changeproof.yml`](.changeproof.yml).

## License

Apache-2.0. See [LICENSE](LICENSE).
