# Point ready resume at existing handoff

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
Dogfood showed dirty ready-session resume output still says to run agentflight handoff even after a handoff artifact exists, which makes the continuation prompt stale for real engineers reviewing local evidence.

## Desired Outcome
When a current session is ready and already has a handoff/report/replay artifact, resume guidance points at the existing open-first artifact instead of telling users to generate handoff again.

## Constraints
- Keep the change local-only and deterministic.
- Do not add export, PR comment, hosted, JSON/CI, or profile features.
- Keep clean-worktree resume behavior intact.

## Non-Goals
- Do not release, push, tag, or publish.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/renderers/resume-prompt.ts
- src/commands/resume.ts
- tests/commands/evidence-output.test.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Ready dirty-session resume output shows an Open first handoff path when a handoff artifact exists.
- Ready dirty-session resume does not repeat run agentflight handoff as the next recommended action when an open-first artifact exists.
- Clean-worktree resume guidance remains unchanged.

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
- Resume prompt copy is used for continuation workflows, so stale or noisy next actions can slow review.

## Rollback Notes
Revert resume prompt guidance changes and their tests.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
