# Security policy

## Supported versions

Before 1.0, only the latest published minor version receives security fixes.
After 1.0, this table will list supported release lines explicitly.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting feature on the repository's
Security tab. Include the affected version, impact, reproduction steps, and any
suggested mitigation. Do not include secrets or personal data.

If private reporting is temporarily unavailable, contact the repository owner
through the private address shown on their GitHub profile. Do not open a public
Issue for an undisclosed vulnerability.

Maintainers aim to acknowledge a report within 3 business days, provide an
initial assessment within 7 business days, and coordinate disclosure after a
fix is available. These are targets, not a service-level agreement.

## Scope

High-priority areas include path traversal, Git argument injection, unsafe YAML
parsing, workflow command injection, untrusted pull request behavior, and
release artifact tampering.

ChangeProof does not execute changed repository files and does not require
network access. Reports that demonstrate a violation of those boundaries are
especially important.
