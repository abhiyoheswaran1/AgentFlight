# Prepare AgentFlight v0.2.1 dogfood friction patch

- Created date: 2026-06-13
- Task type: bugfix
- Status: done

## Problem Statement

AgentFlight v0.2.0 dogfooding found small workflow friction in verification output, risk clarity, replay readability, and ProjScan version detection.

## Desired Outcome

Patch-level fixes are implemented locally without new product scope, and verification passes.

## Constraints

- No new commands, cloud, login, billing, database, GitHub App, Pro gating, snapshot, JSON output, or v0.3.0 scope.

## Non-Goals

- None recorded yet.

## Assumptions

- None recorded yet.

## Likely Files or Areas

- None recorded yet.

## Files or Areas Not to Touch

- None recorded yet.

## Acceptance Criteria

- agentflight verify prints evidence paths after recording results.
- AgentLoopKit dogfood files do not falsely raise docs-only sessions to medium risk.
- Reports, replays, and resume prompts have clearer next actions after proof exists.

## Verification Commands

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
