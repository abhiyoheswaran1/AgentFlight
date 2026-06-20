# Centralize Review Intelligence proof gap rules

- Created date: 2026-06-21
- Task type: refactor
- Status: done

## Problem Statement
Review Intelligence proof-gap rules are repeated inline, making command preference and future proof guidance easy to misorder.

## Desired Outcome
Proof-gap rule data should live in one ordered table while preserving existing Review Intelligence behavior.

## Constraints
- No behavior change intended.
- Do not change readiness states, scoring, or proof command preferences.
- Do not add product features, release work, dependencies, CI, or export modes.

## Non-Goals
- None recorded yet.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/core/review-intelligence.ts
- tests/core/review-intelligence.test.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Existing Review Intelligence tests pass without expectation changes.
- Proof-gap rule order remains explicit and readable.

## Verification Commands
- npm test -- tests/core/review-intelligence.test.ts
- npm run verify
- npm run format:check

## Post-Verification Gates
- No post-verification gate recorded. Use this for commands that need a fresh AgentLoop verification report.

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Refactoring central Review Intelligence code could accidentally change gap order or suggested proof.

## Rollback Notes
Revert the proof-gap rule extraction.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
