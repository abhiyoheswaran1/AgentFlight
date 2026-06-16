# Prepare AgentFlight v0.4.1 Review Intelligence trust patch

- Created date: 2026-06-16
- Task type: bugfix
- Status: done

## Problem Statement

v0.4.0 dogfooding found trust issues: interrupted verification could leave orphan started events, long verify runs were silent, report proof-gap text could conflict, AgentFlight config ranked as unknown, and ProjScan memory needed a filter suggestion.

## Desired Outcome

Incomplete verification is detected and blocks readiness, verify emits heartbeat output, proof-gap wording is unified, AgentFlight config is classified correctly, and ProjScan memory ignore guidance is informational.

## Constraints

- Patch scope only; no v0.5.0 work, PR comments, JSON/CI, ProjScan-enriched ranking, cloud, login, billing, Pro/Team, database, or GitHub App.

## Non-Goals

- None recorded yet.

## Assumptions

- None recorded yet.

## Likely Files or Areas

- None recorded yet.

## Files or Areas Not to Touch

- None recorded yet.

## Acceptance Criteria

- Incomplete verification appears as a blocking Review Intelligence proof gap.
- Long-running verify heartbeat stays out of captured stdout/stderr evidence.
- .agentflight/config.json is visible and classified as AgentFlight project config.
- .projscan-memory/\*\* is suggested but not hardcoded as a built-in filter.

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

- Readiness logic must stay conservative without creating false blockers for completed proof runs.

## Rollback Notes

Revert the v0.4.1 trust patch or publish a follow-up patch if readiness becomes too strict or too loose.

## Handoff Requirements

- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
