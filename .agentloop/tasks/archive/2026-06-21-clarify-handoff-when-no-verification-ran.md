# Clarify handoff when no verification ran

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
agentflight handoff says 'No failed verification excerpts recorded' even when zero verification runs exist, which obscures the actual missing-proof state.

## Desired Outcome
Handoff verification details should distinguish zero verification runs from passing runs without failed excerpts.

## Constraints
- Do not change readiness scoring or proof-gap rules.
- Do not add new commands, release work, or export modes.
- Keep copy concise and local-only.

## Non-Goals
- No broader verification redesign.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/handoff.ts
- tests/commands/evidence-output.test.ts
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- No-run handoffs show 'No verification runs recorded.'
- Ready passing handoffs can still say no failed excerpts.
- Failed handoffs still show stderr-preferred excerpts.

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
- Copy-only behavior could affect tests or users parsing text.

## Rollback Notes
Revert handoff verification-detail copy and tests.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
