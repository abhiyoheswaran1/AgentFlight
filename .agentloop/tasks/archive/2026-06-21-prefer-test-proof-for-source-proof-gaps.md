# Prefer test proof for source proof gaps

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
When source and test files both change, Review Intelligence can suggest typecheck first even though npm test would satisfy both the source and test proof gaps.

## Desired Outcome
Source proof gaps should prefer an available test command before typecheck/build so the first suggested action clears more review uncertainty.

## Constraints
- Do not change verification command detection order.
- Do not add named profiles, CI, JSON, PR comments, or release work.
- Keep Review Intelligence deterministic and explainable.

## Non-Goals
- No ProjScan-enriched ranking changes.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/core/review-intelligence.ts
- tests/core/review-intelligence.test.ts
- tests/commands/evidence-output.test.ts
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- A source-only missing-proof gap prefers npm test when test is configured.
- Source gaps still fall back to typecheck/build when no test command is configured.
- Handoff missing-proof copy points to npm test when source and test files changed and npm test is available.

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
- Changing suggested proof priority can alter existing review copy.

## Rollback Notes
Revert proof-kind preference and tests.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
