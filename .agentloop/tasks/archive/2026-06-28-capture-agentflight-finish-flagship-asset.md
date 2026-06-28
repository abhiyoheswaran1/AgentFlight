# Capture AgentFlight finish flagship asset

- Created date: 2026-06-28
- Task type: docs
- Status: done

## Problem Statement
Website needs a real v0.15.0 agentflight finish terminal screenshot showing Review Passport and Baseframe result evidence.

## Desired Outcome
A real PNG capture from a synthetic Baseframe fixture is added under docs/assets and referenced from README without exposing private source, secrets, or paths.

## Constraints
- Use a synthetic/redacted repository for capture.
- Use actual agentflight v0.15.0 CLI output; do not hand-write terminal content.
- Do not modify ProjScan or AgentLoopKit repositories.

## Non-Goals
- Do not publish a new npm package for this asset-only update.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- docs/assets/agentflight-finish.png
- README.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- docs/assets/agentflight-finish.png exists and is a legible high-DPI PNG generated from a real finish run.
- The finish output includes readiness, changed file count, verification counts, Review Passport paths, handoff/report/replay/resume paths, Baseframe result path, and next action.
- README includes the asset for website teams to reuse.

## Verification Commands
- npm run format:check
- file docs/assets/agentflight-finish.png

## Post-Verification Gates
- No post-verification gate recorded. Use this for commands that need a fresh AgentLoop verification report.

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Retagging v0.15.0 after publication rewrites a public release pointer; prefer a clear decision before force-updating the tag.

## Rollback Notes
Revert the asset/README commit and restore the previous tag pointer if a tag update is performed.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
