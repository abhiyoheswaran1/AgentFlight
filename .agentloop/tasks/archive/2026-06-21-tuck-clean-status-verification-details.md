# Tuck clean status verification details

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
After a completed session is committed, agentflight status now says Clean worktree but still prints recent verification run details. Dogfooding showed the clean state should be shorter: counts are useful, but run details belong in report/replay or JSON when there is nothing left to review.

## Desired Outcome
When the worktree is clean and there are no unresolved failed verification runs, terminal status shows the verification count and a concise details-available line instead of recent run details. Status JSON remains complete, and unresolved failures still show actionable run details.

## Constraints
- Terminal display only; do not mutate session runs, evidence files, report/replay ledgers, JSON output, or storage shape.
- Do not hide unresolved failed verification details.

## Non-Goals
- Do not add flags, export modes, PR comments, release, version bump, or cloud behavior.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/status.ts
- tests/commands/evidence-output.test.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Clean-worktree terminal status with verification runs does not print individual run commands.
- Clean-worktree status still shows verification counts and tells users where full details are available.
- Status JSON still includes every verification run.
- Unresolved failed verification status still shows actionable failure details.

## Verification Commands
- npm test -- tests/commands/evidence-output.test.ts
- npm run verify
- npm run format:check

## Post-Verification Gates
- No post-verification gate recorded. Use this for commands that need a fresh AgentLoop verification report.

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Avoid making failed verification less visible; only tuck details when there are no unresolved failures.

## Rollback Notes
Revert the clean-status display branch, tests, and docs for this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
