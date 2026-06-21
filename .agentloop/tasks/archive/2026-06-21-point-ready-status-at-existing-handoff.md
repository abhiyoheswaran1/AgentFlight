# Point ready status at existing handoff

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
Dogfood showed dirty ready-session status still says to run agentflight handoff after a handoff artifact already exists, while handoff and resume now point at the existing local review packet.

## Desired Outcome
When a current dirty session is ready and has a handoff/report/replay artifact, status output shows Open first and uses the existing artifact as the next action instead of repeating handoff-generation guidance.

## Constraints
- Keep the behavior local-only and deterministic.
- Do not add export, PR comment, hosted, JSON/CI, or profile features.
- Keep blocked and clean status behavior intact.

## Non-Goals
- Do not release, push, tag, or publish.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/status.ts
- tests/commands/evidence-output.test.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Ready dirty-session status shows Open first handoff path when a handoff artifact exists.
- Ready dirty-session status no longer repeats run agentflight handoff as the next action when an open-first artifact exists.
- Blocked status and clean-worktree status behavior remain unchanged.

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
- Status is the main review-readiness command, so stale next actions undermine the handoff-first workflow.

## Rollback Notes
Revert status open-first guidance changes and their tests.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
