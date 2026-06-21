# Prevent concurrent verify evidence collisions

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
Dogfooding exposed that two concurrent agentflight verify commands can claim the same verification-N stdout/stderr paths, risking overwritten or ambiguous evidence.

## Desired Outcome
Concurrent verify runs allocate distinct evidence paths and preserve each run's stdout/stderr evidence without corrupting session state.

## Constraints
- Keep evidence local-only and preserve existing verification event schema where practical.
- Do not add daemon, cloud, locking service, JSON/CI, profiles, export modes, PR comments, release, or version bump scope.

## Non-Goals
- Do not redesign verification output or session storage.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/verify.ts
- src/core/session.ts
- src/core/fs-safe.ts
- tests/commands/verify.test.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Concurrent runVerifyCommand calls write different stdout/stderr evidence paths.
- Raw stdout/stderr evidence remains intact for each run.
- Sequential verify output remains unchanged.

## Verification Commands
- npm test -- tests/commands/verify.test.ts tests/commands/evidence-output.test.ts
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
Revert the verify evidence allocation change, tests, and docs for this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
