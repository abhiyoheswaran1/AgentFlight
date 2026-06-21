# Clarify recorded readiness in history output

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
`agentflight history` shows stored review-artifact readiness as `Readiness:`,
which can be misread as live worktree readiness for the current session after
the task has been committed and `agentflight status` is clean.

## Desired Outcome
History labels stored readiness metadata as recorded readiness, keeping the command read-only and avoiding live git/status recomputation.

## Constraints
- Keep history read-only and local-only.
- Do not change session storage, report/replay metadata shape, readiness computation, status output, or artifact generation.
- Do not add search, export, session switching, JSON/CI, cloud, release, or version bump scope.

## Non-Goals
- Live git/status recomputation inside `agentflight history`.
- Session storage or metadata shape changes.
- Search, export, session switching, JSON/CI, cloud, release, or version bump
  scope.

## Assumptions
- History should stay a read-only local artifact browser.
- The stored review metadata is still useful; the issue is the label, not the
  data.

## Likely Files or Areas
- `src/commands/history.ts`
- `tests/commands/history.test.ts`
- `README.md`
- `CHANGELOG.md`
- `AGENTFLIGHT_DEVLOG.md`
- `docs/superpowers/plans/2026-06-21-history-recorded-readiness-label.md`

## Files or Areas Not to Touch
- `src/core/session.ts`
- readiness/review-intelligence computation
- report/replay/handoff artifact generation
- `package.json`
- release, publishing, and CI workflow files

## Acceptance Criteria
- History prints `Recorded readiness:` when metadata exists.
- Older sessions without metadata print `Recorded readiness: not recorded`.
- Open-first guidance and artifact paths are unchanged.

## Verification Commands
- npm test -- tests/commands/history.test.ts tests/core/session.test.ts
- npm run verify
- npm run format:check

## Post-Verification Gates
- Run AgentLoopKit verification and gates before archiving.

## Implementation Plan
- Add failing history tests for the new label.
- Change only the history renderer label.
- Update user-facing docs that mention recorded readiness.
- Dogfood `agentflight history --limit 2` with the built CLI.

## Risk Notes
- Re-check protected areas before changing migrations, auth, secrets, billing, deployment, or public APIs.

## Rollback Notes
Revert the history label/test/docs changes. No local session data needs cleanup
because the change is display-only.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
