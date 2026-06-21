# Tone down resolved failure urgency in HTML replay

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
HTML replay navigation and shortcuts treat any failed verification run as urgent, even when later passing runs have resolved the failures and Review Intelligence says the session is ready.

## Desired Outcome
Replay keeps historical failed runs discoverable while reserving urgent failed-run navigation for unresolved failed verification.

## Constraints
- Do not remove failed runs from the replay ledger.
- Do not change captured verification evidence.
- Do not add export modes, PR comments, hosted features, release work, or version changes.

## Non-Goals
- Version bump, publish, tag, push, or release.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/renderers/html-replay.ts
- src/commands/replay.ts
- tests/renderers/html-replay.test.ts
- tests/commands/evidence-output.test.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Ready replay with only resolved historical failures does not show urgent failed-run navigation.
- Blocked replay with unresolved failed verification still shows urgent failed-run navigation.
- Historical failed runs remain visible in the verification ledger.

## Verification Commands
- npm test -- tests/renderers/html-replay.test.ts tests/commands/evidence-output.test.ts
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
Revert the replay navigation tone changes.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
