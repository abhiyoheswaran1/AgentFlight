# Add AgentFlight v0.14.0 product visual

- Created date: 2026-06-27
- Task type: docs
- Status: done

## Problem Statement
Website team needs a real AgentFlight product capture for the flagship page, and the product README should carry the same current visual.

## Desired Outcome
Generate an authentic AgentFlight v0.14.0 terminal screenshot from a real local run, add it to docs assets, and reference it from README without fabricating product state.

## Constraints
- Use real CLI output from the released repository build.
- Do not fabricate fake product screenshots.
- Keep AgentFlight independent and local-first.

## Non-Goals
- Do not change package behavior or publish another release.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- docs/assets/
- README.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- A real terminal capture of AgentFlight readiness/result output exists under docs/assets.
- README references the new capture with accurate alt text.
- Website team can convert the asset to AVIF and wire it into the site.

## Verification Commands
- npm run format:check
- npm run lint
- npm run typecheck

## Post-Verification Gates
- agentloop check-gates

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Asset quality depends on the terminal rendering and should be inspected before handoff.

## Rollback Notes
Remove the new docs asset and README reference.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
