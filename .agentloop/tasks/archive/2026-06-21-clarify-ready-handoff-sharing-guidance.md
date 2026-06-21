# Clarify ready handoff sharing guidance

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
Ready AgentFlight handoffs now point reviewers to the handoff packet first, but the terminal next action still says to share the handoff with report/replay, preserving older report-first wording.

## Desired Outcome
Ready handoff output tells engineers to share the local handoff packet first while still referencing report/replay as supporting artifacts.

## Constraints
- No new product features.
- Keep workflow semantics unchanged: ready handoff opens handoff first; blocked handoff opens report first.
- Avoid AI-coding-assistant positioning; use coding agent sessions or local review language.

## Non-Goals
- Do not add export modes, PR comments, JSON/CI, cloud, hosted, login, or v0.6.0 scope changes.

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
- Ready handoff output no longer says 'Share this handoff with the report/replay'.
- Ready handoff output says to share the local handoff packet for scoped review.
- Blocked handoff guidance remains unchanged.

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
- User-facing CLI copy change; risk is low but must stay consistent with status/report/replay guidance.

## Rollback Notes
Revert the handoff copy/test/docs changes.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
