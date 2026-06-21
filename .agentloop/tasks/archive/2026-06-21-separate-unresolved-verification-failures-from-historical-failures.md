# Separate unresolved verification failures from historical failures

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
After TDD red/green or format-fix loops, AgentFlight can show a session as ready while review surfaces still show total historical failed verification counts without clearly saying no unresolved failures remain.

## Desired Outcome
Review surfaces distinguish total historical failures from unresolved failed verification so engineers can trust readiness without losing ledger evidence.

## Constraints
- Keep all evidence local and preserve historical failed runs in report/replay ledgers.
- Do not delete or rewrite captured verification runs.
- Do not add profiles, JSON/CI, PR comments, export modes, hosted features, or release work.

## Non-Goals
- Version bump, publish, tag, push, or release.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/core/verification.ts
- src/core/review-intelligence.ts
- src/commands/status.ts
- src/commands/handoff.ts
- src/renderers/markdown-report.ts
- src/renderers/html-replay.ts
- tests/commands/evidence-output.test.ts
- tests/core/review-intelligence.test.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Ready sessions with resolved historical failures say that no unresolved failed verification remains.
- Blocked sessions with unresolved failures still show stderr-preferred failure excerpts and fail handoff.
- Report/replay ledgers continue to retain historical failed evidence.

## Verification Commands
- npm test -- tests/core/review-intelligence.test.ts tests/commands/evidence-output.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts
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
Revert the unresolved-failure summary display changes.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
