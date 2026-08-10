# Adoption guide

ChangeProof should reduce review work, not add ceremonial files to every pull
request. Adopt it with real repository history and adjust policies when the
signal is poor.

## Recommended rollout

1. Identify two or three recurring omissions from recent pull requests.
2. Encode only those cases, initially with `severity: warning`.
3. Review at least ten matching pull requests and record false positives.
4. Narrow triggering paths or evidence globs based on observed changes.
5. Promote a policy to `error` only when maintainers trust its remediation.

Avoid generic rules such as “every code change must edit a test” when generated
files, mechanical refactors, or test-only source directories make that untrue.
Use `when.ignore` to document legitimate exclusions.

## Pilot feedback

When reporting an adoption, include:

- Repository language and approximate size
- The policies used
- Number of pull requests observed
- False positives and missed cases
- Review time saved, if it can be estimated honestly

ChangeProof has no telemetry. Public adopter counts and outcomes must come from
voluntary reports, package registry statistics, and visible repository usage.
The project will not manufacture stars, downloads, Issues, or contributor
activity.
