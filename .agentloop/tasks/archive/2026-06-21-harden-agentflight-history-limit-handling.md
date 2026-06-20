# Harden AgentFlight history limit handling

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
The new agentflight history command accepts invalid --limit values silently, which can make CLI output surprising instead of trustworthy.

## Desired Outcome
History limit handling rejects non-integer, zero, or negative limits with an actionable error while valid limits still list recent sessions.

## Constraints
- No new product surface beyond limit validation; local-only; no release work.

## Non-Goals
- None recorded yet.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- None recorded yet.

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- history rejects NaN, zero, negative, and fractional limits.
- valid history limits still work.

## Verification Commands
- npm test -- tests/commands/history.test.ts tests/cli-entrypoint.test.ts
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
Document how to revert or disable this change.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
