# Keep artifact commands out of proof guidance

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
Dogfood showed AgentFlight artifact commands run under verification can leak into Review Intelligence as suggested proof, making replay/report guidance tell reviewers to rerun artifact views instead of meaningful verification.

## Desired Outcome
Review Intelligence keeps artifact/readout commands visible as captured evidence but does not promote them as proof-gap suggested commands or readiness-blocking incomplete proof when they are only AgentFlight artifact commands.

## Constraints
- Keep behavior local-only and deterministic.
- Preserve captured stdout/stderr and verification evidence.
- Do not add release, cloud, PR comment, JSON/CI, or profile features.

## Non-Goals
- Do not release, tag, publish, or push.
- Do not broaden proof ranking into ProjScan-enriched ranking.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/core/review-intelligence.ts
- tests/core/review-intelligence.test.ts
- docs/development/product-direction.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Artifact/readout commands such as agentflight replay/report/status/handoff/history/resume/doctor are not suggested as readiness proof commands.
- Incomplete real proof commands still block readiness and suggest the original command.
- Failed verification commands and raw evidence behavior remain intact.

## Verification Commands
- npm test -- tests/core/review-intelligence.test.ts
- npm run verify
- npm run format:check

## Post-Verification Gates
- No post-verification gate recorded. Use this for commands that need a fresh AgentLoop verification report.

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Over-filtering could hide real failures if a user intentionally verifies an AgentFlight command.

## Rollback Notes
Revert review-intelligence filtering and its focused tests.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
