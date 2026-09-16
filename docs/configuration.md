# Configuration reference

ChangeProof reads `.changeproof.yml` from the current directory by default.
Use `--config` or the action's `config` input to select another file.
The CLI uses the local file. For pull requests and merge queues, the action
reads the repository-relative path from the event's base commit. It fails if
that committed configuration is missing or invalid, without falling back to
the contributor's version. The action's diff inputs do not override this trust
boundary. For other events, the action uses the checked-out file.

## Top-level fields

| Field | Required | Meaning |
| --- | --- | --- |
| `$schema` | No | Editor hint pointing to the bundled JSON Schema. |
| `version` | Yes | Configuration version. The only accepted value is `1`. |
| `policies` | Yes | One or more policy objects. IDs must be unique. |

Unknown fields are rejected. This catches misspellings instead of silently
weakening a policy.

## Policy fields

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | Yes | Stable lowercase identifier using letters, digits, and hyphens. |
| `description` | No | Human-readable purpose shown in structured output. |
| `when.changed` | Yes | Globs that activate the policy. |
| `when.ignore` | No | Globs excluded after `when.changed` matches. |
| `require.any` | Conditional | At least one pattern must match a changed file. |
| `require.all` | Conditional | Every pattern must match at least one changed file. |
| `severity` | No | `error` (default) or `warning`. |
| `message` | No | Remediation text shown when evidence is missing. |

At least one of `require.any` or `require.all` is required. If both are present,
both are enforced.

## Matching behavior

- Paths are normalized to forward slashes and matched from repository root.
- Matching is case-sensitive on every operating system.
- Filename whitespace is significant and is not trimmed.
- Dotfiles such as `.changeset/quiet-rivers.md` are included.
- Deleted files can activate a policy but never count as evidence. This prevents
  deleting a test or document from satisfying a requirement.
- Negated globs are rejected. Put exclusions in `when.ignore`.

The last point makes review safer: a negative pattern cannot subtly change
meaning when patterns are reordered.

## Recipes

### Runtime changes need tests

```yaml
- id: runtime-needs-tests
  when:
    changed: ["src/**"]
    ignore: ["src/**/*.test.ts"]
  require:
    any: ["test/**", "**/*.test.ts"]
```

### Sensitive code needs two kinds of evidence

```yaml
- id: auth-needs-security-evidence
  when:
    changed: ["src/auth/**"]
  require:
    all:
      - "test/auth/**"
      - "docs/security/threat-model.md"
  message: Add auth tests and update the threat model.
```

### Introduce a rule without blocking merges

```yaml
- id: workflow-needs-runbook
  when:
    changed: [".github/workflows/**"]
  require:
    any: ["docs/runbooks/**", "CHANGELOG.md"]
  severity: warning
```

Start new policies as warnings, observe real pull requests, then promote rules
to errors once false positives are resolved.

## JSON Schema

The published package includes `schema/changeproof.schema.json`. In this
repository, editors discover it through:

```yaml
$schema: ./schema/changeproof.schema.json
```
