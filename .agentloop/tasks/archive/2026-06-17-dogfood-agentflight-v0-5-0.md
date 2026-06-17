# Dogfood AgentFlight v0.5.0

- Created date: 2026-06-17
- Task type: docs
- Status: done

## Problem Statement
AgentFlight v0.5.0 is released; published package behavior needs dogfood evaluation in real repositories.

## Desired Outcome
Evidence-based findings document covering success paths, controlled failure excerpts, replay ledger UX, reports, print/PDF, bugs, v0.5.1 patch recommendations, and v0.6.0 candidates.

## Constraints
- Do not start v0.6.0.
- Do not add product features.
- Do not commit, push, tag, release, or publish.
- Keep findings evidence-based.
- Do not read or print secrets.

## Non-Goals
- No code feature work, version bump, release, dependency change, or repository cleanup outside the evaluation.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- docs/development/v0.5.0-dogfood-findings.md

## Files or Areas Not to Touch
- package.json
- package-lock.json

## Acceptance Criteria
- Confirm agentflight@latest reports 0.5.0.
- Dogfood success-path commands in clean available repositories.
- Dogfood one safe controlled failing verification where appropriate and inspect report/replay output.
- Record findings in docs/development/v0.5.0-dogfood-findings.md.
- Run final verification commands requested by the user.

## Verification Commands
- npm run verify
- npm run format:check
- npx projscan@latest doctor --format json
- npx agentloopkit@latest verify

## Post-Verification Gates
- No post-verification gate recorded. Use this for commands that need a fresh AgentLoop verification report.

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Dogfood commands may create local .agentflight/.agentloop artifacts in tested repositories; avoid commits and keep secrets unread.

## Rollback Notes
Remove the findings document and local dogfood artifacts if this evaluation pass must be discarded.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
