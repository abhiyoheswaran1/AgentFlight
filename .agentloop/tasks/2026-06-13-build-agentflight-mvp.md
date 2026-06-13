# Build AgentFlight MVP

- Created date: 2026-06-13
- Task type: feature
- Status: in-progress

## Problem Statement

AgentFlight needs its first local-first TypeScript npm CLI MVP.

## Desired Outcome

A working agentflight CLI with init, start, status, report, replay, resume, and doctor commands, documented dogfooding with ProjScan and AgentLoopKit, and verification evidence.

## Constraints

- Local-first only; no cloud, auth, billing, telemetry, or source upload.
- Use ProjScan and AgentLoopKit as development workflow dependencies from day one.

## Non-Goals

- None recorded yet.

## Assumptions

- None recorded yet.

## Likely Files or Areas

- None recorded yet.

## Files or Areas Not to Touch

- None recorded yet.

## Acceptance Criteria

- npm run build, test, typecheck, lint, format:check, and verify pass.
- AgentFlight dogfoods itself using init, start, status, report, replay, resume, and doctor.

## Verification Commands

- npm run verify

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
