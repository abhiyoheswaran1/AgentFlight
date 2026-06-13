# Prepare AgentFlight v0.3.0 session events and snapshots

- Created date: 2026-06-13
- Task type: feature
- Status: done

## Problem Statement

AgentFlight needs timeline events and snapshots so sessions feel like real AI coding flight recordings, not only final-state reports.

## Desired Outcome

AgentFlight records session events, supports agentflight snapshot, and status/report/replay/resume use the timeline while preserving v0.1/v0.2 compatibility.

## Constraints

- Local-first only; no telemetry, cloud, login, billing, GitHub App, database, paid gating, full diff capture, destructive commands, tag, or publish.

## Non-Goals

- None recorded yet.

## Assumptions

- None recorded yet.

## Likely Files or Areas

- None recorded yet.

## Files or Areas Not to Touch

- None recorded yet.

## Acceptance Criteria

- agentflight snapshot records current git/risk/verification state as a session event.
- start, verify, report, replay, resume, and doctor append meaningful events.
- replay/report/status/resume show timeline or latest snapshot context.
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
