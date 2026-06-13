# Prepare AgentFlight v0.2.0 verification evidence

- Created date: 2026-06-13
- Task type: feature
- Status: proposed

## Problem Statement

AgentFlight needs real verification evidence capture so reports, replay, status, and resume prompts prove what ran.

## Desired Outcome

agentflight verify records command evidence locally and downstream commands use that evidence honestly.

## Constraints

- Do not publish or cut a version in this task.
- Local-first only; no telemetry, cloud, auth, billing, GitHub App, or database.
- Use safe child_process execution without shell interpolation.

## Non-Goals

- None recorded yet.

## Assumptions

- None recorded yet.

## Likely Files or Areas

- None recorded yet.

## Files or Areas Not to Touch

- None recorded yet.

## Acceptance Criteria

- agentflight verify -- <command> records passing and failing command results.
- agentflight verify with no args runs configured commands.
- status, report, replay, and resume reflect captured verification evidence.
- npm run verify and npm run format:check pass.

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
