# Release AgentFlight v0.4.0 Review Intelligence

- Created date: 2026-06-16
- Task type: release
- Status: done

## Problem Statement

The completed v0.4.0 Review Intelligence implementation needed a clean release with documented manual sign-off for ProjScan's scale/complexity caution.

## Desired Outcome

AgentFlight v0.4.0 is released, tagged, published to npm through Trusted Publishing, and verified from a clean install.

## Constraints

- No new product scope during release; no manual npm publish unless Trusted Publishing fails.

## Non-Goals

- None recorded yet.

## Assumptions

- None recorded yet.

## Likely Files or Areas

- None recorded yet.

## Files or Areas Not to Touch

- None recorded yet.

## Acceptance Criteria

- package version and CLI report 0.4.0.
- main and tag v0.4.0 are pushed.
- npm latest confirms 0.4.0 and npx agentflight@latest --version reports 0.4.0.
- Published smoke test verifies Review Intelligence output.

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

- Release included accepted manual sign-off for ProjScan scale/complexity caution.

## Rollback Notes

If npm release is bad, publish a patch release with the corrected behavior and document the issue in CHANGELOG.

## Handoff Requirements

- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
