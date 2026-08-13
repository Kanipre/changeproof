# Roadmap

The roadmap is problem-led. Milestones move only when user reports justify the
work.

## 0.1 — usable foundation

- Strict versioned YAML configuration
- Local CLI and GitHub Action
- `any` and `all` evidence requirements
- Error and warning severities
- Human, JSON, Markdown, GitHub, and SARIF output
- Windows, macOS, and Linux-compatible path handling

## Candidate 0.2 work

- Evaluate Zod 4 under strict schema-v1 compatibility and malformed-input tests
- `changeproof explain <policy>` for configuration debugging
- Reusable policy recipe repository based on adopted projects
- GitLab CI example using the existing CLI
- A machine-readable baseline mode for gradual rollout in large repositories

## Before 1.0

- Validate configuration semantics on several unrelated public repositories
- Document compatibility and deprecation guarantees
- Complete an external security review of Git and path handling
- Recruit at least one maintainer outside the original project owner

AI-assisted PR summaries and issue triage may be explored as optional,
non-blocking maintainer tools. They will not become a dependency of the local,
deterministic policy gate.
