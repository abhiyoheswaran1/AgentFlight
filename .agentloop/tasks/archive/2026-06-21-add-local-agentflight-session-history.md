# Add local AgentFlight session history

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
AgentFlight stores useful local session evidence, but users have no simple command to list recent sessions and find report or replay artifacts after dogfooding multiple loops.

## Desired Outcome
A small read-only history command lists recent local sessions with task, start time, branch, verification counts, current marker, and local report/replay paths without switching sessions or uploading data.

## Constraints
- Local-first only; no telemetry, cloud, login, billing, hosted features, GitHub App, PR comments, export modes, JSON/CI, or release work.
- Do not mutate old session files or add searchable indexing.

## Non-Goals
- None recorded yet.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- None recorded yet.

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- agentflight history lists recent sessions newest first.
- The current session is marked when present.
- Malformed session files do not crash history output.
- History output points to local report and replay paths when those artifacts exist.

## Verification Commands
- npm test -- tests/core/session.test.ts tests/commands/history.test.ts
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
