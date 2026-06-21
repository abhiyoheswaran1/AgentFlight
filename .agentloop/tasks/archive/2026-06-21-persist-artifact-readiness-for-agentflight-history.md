# Persist artifact readiness for AgentFlight history

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
History can find past sessions and artifacts, but it does not show whether the latest generated review artifact said the session was ready, blocked, or missing proof.

## Desired Outcome
Report/replay generation persists compact local readiness metadata and history shows it when available without recalculating old sessions.

## Constraints
- Local-only metadata recorded in existing session events.
- Do not recalculate old readiness from current workspace state.
- Do not mutate old sessions or introduce indexing/search/export/sync/session switching.

## Non-Goals
- Release, version bump, tag, publish, or hosted functionality.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/core/session.ts
- src/commands/history.ts
- src/commands/report.ts
- src/commands/replay.ts
- tests/core/session.test.ts
- tests/commands/history.test.ts
- tests/commands/evidence-output.test.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Report/replay events include compact readiness metadata with state, label, risk level, changed-file count, and verification counts.
- History shows latest recorded readiness when present and falls back calmly when absent.
- Malformed or missing readiness metadata does not crash history.

## Verification Commands
- npm test -- tests/core/session.test.ts tests/commands/history.test.ts tests/commands/evidence-output.test.ts
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
Revert the history/readiness metadata changes and remove the task-specific docs.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
