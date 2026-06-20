# Make ready-review next actions point to handoff

- Created date: 2026-06-20
- Task type: bugfix
- Status: done

## Problem Statement
Ready-review output still tells users to generate or share report/replay, which conflicts with the post-v0.6.0 handoff golden path.

## Desired Outcome
When Review Intelligence is ready, next action points to agentflight handoff as the local review packet while report/replay/resume remain supporting artifacts.

## Constraints
- Keep behavior local-only and deterministic.
- Do not release, tag, push, publish, or bump version.

## Non-Goals
- Changing report/replay generation behavior.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/core/review-intelligence.ts
- tests/core/review-intelligence.test.ts
- tests/renderers/markdown-report.test.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Ready Review Intelligence nextAction mentions agentflight handoff.
- Failed or needs-verification next actions remain unchanged.
- Report/Markdown tests reflect the handoff golden path.

## Verification Commands
- npm test -- tests/core/review-intelligence.test.ts tests/renderers/markdown-report.test.ts
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
Revert the ready-review next-action wording and tests.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
