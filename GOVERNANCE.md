# Governance

ChangeProof is maintained in public. Technical decisions optimize for safe,
predictable repository policy rather than feature count.

## Roles

- **Contributors** submit Issues, documentation, tests, or code.
- **Reviewers** are trusted contributors who regularly review a documented
  area. They may triage Issues but do not necessarily have write access.
- **Maintainers** have repository write access and are responsible for review,
  triage, security response, and releases.
- **Project lead** is the repository owner and resolves decisions that do not
  reach consensus.

Roles are earned through sustained, constructive work. A maintainer nomination
should cite several contributions across at least eight weeks, evidence of sound
review judgment, and agreement to follow the security and release procedures.
Existing maintainers approve additions by consensus.

## Decisions

Routine changes use pull request review. A maintainer may merge after required
checks pass and substantive review feedback is resolved. The author must not be
the sole approver of a security-sensitive or release-workflow change.

Changes to the configuration schema, compatibility guarantees, trust boundary,
or governance require a public design Issue before implementation. The decision
and alternatives are summarized in that Issue or an architecture decision
record.

## Inactivity and removal

A maintainer who expects to be unavailable for more than eight weeks should say
so when practical. After six months without project activity, their role may be
moved to emeritus status by consensus. Access may be removed immediately for a
security incident, Code of Conduct breach, or loss of account control.

## Conflicts of interest

Reviewers disclose employer, vendor, or personal interests that could reasonably
affect a decision and recuse when appropriate. Paid work is welcome when it is
held to the same public review and compatibility standards.
