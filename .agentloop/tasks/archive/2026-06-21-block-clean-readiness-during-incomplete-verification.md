# Block clean readiness during incomplete verification

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
Dogfooding status while an AgentFlight verification was still running exposed inconsistent output: zero changed files could report Clean worktree while Proof gaps showed an incomplete verification. In-progress verification should take precedence over clean-worktree readiness.

## Desired Outcome
Review Intelligence treats incomplete verification attempts as blocking before clean-worktree readiness, so status/report/replay do not call a session clean while a verification command is still incomplete.

## Constraints
- Do not change verification storage, command execution, JSON shape, report/replay structure, release, version, cloud, or export behavior.
- Keep clean-worktree readiness for zero changed files when there are no unresolved failed or incomplete verification attempts.

## Non-Goals
- Do not add a live progress UI or polling behavior.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/core/review-intelligence.ts
- tests/core/review-intelligence.test.ts
- tests/commands/evidence-output.test.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Zero changed files with an incomplete verification attempt reports Needs verification, not Clean worktree.
- Status output does not show Clean worktree with a blocking incomplete-verification proof gap.
- Zero changed files with completed passing verification still reports Clean worktree.

## Verification Commands
- npm test -- tests/core/review-intelligence.test.ts tests/commands/evidence-output.test.ts
- npm run verify
- npm run format:check

## Post-Verification Gates
- No post-verification gate recorded. Use this for commands that need a fresh AgentLoop verification report.

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Readiness ordering is user-facing; preserve failed-verification precedence and clean-worktree behavior after completion.

## Rollback Notes
Revert the readiness-ordering change, tests, and docs for this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
