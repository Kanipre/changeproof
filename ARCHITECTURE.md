# Architecture

ChangeProof is split into a deterministic core and two thin adapters.

1. `config.ts` parses YAML and validates the complete document.
2. `git.ts` obtains repository-relative changed paths without invoking a shell.
3. `matcher.ts` normalizes paths and applies fixed minimatch options.
4. `evaluate.ts` turns configuration plus paths into a pure result object.
5. `format.ts` serializes the result for humans and CI systems.
6. `cli.ts` and `action.ts` adapt the core to a terminal or GitHub Action.

The evaluator has no filesystem, network, environment, clock, or process
dependencies. This keeps policy decisions reproducible and makes integrations
straightforward.

## Trust boundaries

Configuration and changed paths are untrusted input. ChangeProof validates both
before evaluation. Git revisions are constrained before being passed as
arguments to `execFileSync`; no command is run through a shell. The action uses
only the checked-out repository and GitHub event payload. It does not fetch
commits, execute repository code, or transmit source paths.

The GitHub Action is bundled into `action-dist/index.cjs` so downstream users do
not install dependencies at action runtime. Release review must include the
generated bundle diff.

## Compatibility

The CLI supports maintained Node.js releases beginning with Node 20. The YAML
schema is explicitly versioned. A future breaking schema change must introduce
a new `version` value and a migration guide rather than reinterpret version 1.

## Non-goals

- Judging whether evidence content is correct
- Replacing test runners, coverage tools, or code review
- Calling an LLM in the deterministic enforcement path
- Reading pull request descriptions or contributor identity
