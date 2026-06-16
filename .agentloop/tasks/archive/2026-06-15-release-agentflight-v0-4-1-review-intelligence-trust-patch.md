# Release AgentFlight v0.4.1 Review Intelligence trust patch

- Created date: 2026-06-16
- Task type: release
- Status: done

## Problem Statement

The focused v0.4.1 trust patch needed a clean release with npm Trusted Publishing and post-release smoke verification.

## Desired Outcome

AgentFlight v0.4.1 is released, tagged, published to npm, and verified from a clean install.

## Constraints

- No new product features, no version beyond 0.4.1, no manual npm publish unless Trusted Publishing fails.

## Non-Goals

- None recorded yet.

## Assumptions

- None recorded yet.

## Likely Files or Areas

- None recorded yet.

## Files or Areas Not to Touch

- None recorded yet.

## Acceptance Criteria

- package version and CLI report 0.4.1.
- main and tag v0.4.1 are pushed.
- npm latest confirms 0.4.1 and npx agentflight@latest --version reports 0.4.1.
- Published smoke test verifies Review Intelligence and runtime filtering.

## Verification Commands

- npm run verify
- npm run format:check
- npm pack --dry-run

## Post-Verification Gates

- No post-verification gate recorded. Use this for commands that need a fresh AgentLoop verification report.

## Implementation Plan

- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes

- Release automation must complete through Trusted Publishing before claiming npm success.

## Rollback Notes

Publish a corrective patch release if the published package is broken; avoid manual publish unless workflow recovery requires it.

## Handoff Requirements

- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
