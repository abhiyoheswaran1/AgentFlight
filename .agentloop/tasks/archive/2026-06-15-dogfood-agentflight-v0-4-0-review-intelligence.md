# Dogfood AgentFlight v0.4.0 Review Intelligence

- Created date: 2026-06-16
- Task type: docs
- Status: done

## Problem Statement

Published AgentFlight v0.4.0 needed real-repo dogfooding to evaluate whether Review Intelligence was useful, conservative, and clear.

## Desired Outcome

Dogfood findings are documented for AgentFlight, ProjScan, and fifa-predictor with v0.4.1 patch candidates and v0.5.0 direction candidates.

## Constraints

- Do not implement features, release, tag, push, or publish during dogfood evaluation.

## Non-Goals

- None recorded yet.

## Assumptions

- None recorded yet.

## Likely Files or Areas

- None recorded yet.

## Files or Areas Not to Touch

- None recorded yet.

## Acceptance Criteria

- docs/development/v0.4.0-dogfood-findings.md records tested repos, skipped repos, Review Intelligence findings, bugs, UX friction, and recommendations.
- Runtime .agentflight files are not staged or committed.

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

- Sibling repos were touched only with small safe changes and should remain clean or explicitly documented.

## Rollback Notes

Revert dogfood note changes if they are inaccurate; no product code was changed for the dogfood pass.

## Handoff Requirements

- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
