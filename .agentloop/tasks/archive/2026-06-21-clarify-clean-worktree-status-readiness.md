# Clarify clean-worktree status readiness

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
After a task is committed and the checkout is clean, agentflight status still centers the previous session but reports Readiness: Unknown with a next action to make changes or inspect git status. Dogfood showed that this makes a completed local session feel ambiguous.

## Desired Outcome
When there are no changed files and no unresolved failed verification, status and JSON readiness clearly say the checkout is clean instead of implying unknown review readiness.

## Constraints
- Keep the change local-only and textual; do not add a new workflow, export mode, release, version bump, or network behavior.
- Do not weaken readiness for sessions with changed files, unresolved failures, incomplete verification, or missing proof gaps.

## Non-Goals
- Do not change AgentFlight session storage shape.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/core/review-intelligence.ts
- src/commands/status.ts
- tests/core/review-intelligence.test.ts
- tests/commands/evidence-output.test.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Zero changed files with no unresolved failed verification reports a clear clean-worktree readiness state and next action.
- Zero changed files with unresolved failed verification remains blocked by failed verification.
- Changed-file readiness behavior is unchanged.

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
- Review readiness wording is user-facing CLI/API text; keep it precise and avoid over-claiming review completion after a commit.

## Rollback Notes
Revert the readiness clean-worktree wording/tests and docs for this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
