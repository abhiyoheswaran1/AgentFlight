# Clarify resolved verification failures in history output

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
AgentFlight history lists total failed verification runs for ready sessions, even when those failures were resolved by later passing runs and other surfaces show 0 unresolved failures.

## Desired Outcome
History uses the same unresolved-versus-resolved verification count wording as status, resume, report, replay, and handoff while preserving raw historical proof counts.

## Constraints
- Do not change session storage or captured verification evidence.
- Do not add search, export, sync, session switching, JSON, PR comments, hosted features, version changes, or release work.
- Keep the change scoped to history display and tests.

## Non-Goals
- Do not redesign history output.
- Do not recalculate old readiness beyond existing stored session data.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/history.ts
- tests/commands/history.test.ts
- src/core/output.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- History for a session with resolved historical failures shows unresolved/resolved context.
- History still lists sessions, readiness, report/replay paths, and malformed-session notices as before.
- Invalid history limit behavior remains unchanged.

## Verification Commands
- npm test -- tests/commands/history.test.ts tests/core/verification.test.ts
- npm run verify
- npm run format:check

## Post-Verification Gates
- No post-verification gate recorded. Use this for commands that need a fresh AgentLoop verification report.

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Re-check protected areas before changing migrations, auth, secrets, billing, deployment, or public APIs.

## Rollback Notes
Revert history display wording and related tests.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
