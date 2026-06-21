# Clarify history open-first empty state

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
After adding history Open first guidance, sessions with no generated artifacts can show Open first: missing, which is artifact-state jargon rather than useful CLI copy.

## Desired Outcome
agentflight history shows Open first: none yet when no primary artifact exists, while preserving replay/report/handoff guidance when artifacts are available.

## Constraints
- Keep history read-only and local-only.
- Do not add session switching, artifact generation, export modes, PR comments, release, or version bump scope.

## Non-Goals
- Do not change artifact path availability rules.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/history.ts
- tests/commands/history.test.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- History shows Open first: none yet when no handoff, report, or replay artifact exists.
- Existing replay/report/handoff open-first behavior remains unchanged.

## Verification Commands
- npm test -- tests/commands/history.test.ts
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
Revert the history empty-state copy change, tests, and docs for this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
