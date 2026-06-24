# Add repo-calibrated proof guidance

- Created date: 2026-06-24
- Task type: feature
- Status: done

## Problem Statement
AgentFlight can explain required proof for the current change, but it does not yet compare current proof against trusted local history from prior handoffs. Engineers still have to remember whether today's proof is strong enough for similar work in this repo.

## Desired Outcome
AgentFlight surfaces deterministic local calibration guidance when current proof is weaker than proof patterns from similar prior ready handoffs, without uploading source or adding a new workflow.

## Constraints
- Use only local AgentFlight artifacts and source-free metadata.
- Keep existing command surface; render through status, handoff, report, replay, and resume where practical.
- No telemetry, cloud sync, network calls, hidden learning, dependency changes, or release.
- Do not change package version.

## Non-Goals
- No PR comments, JSON/CI, named profiles, export modes, hosted dashboard, login, billing, or model-based extraction.

## Assumptions
- Prior ready handoffs and session artifacts provide enough local metadata for conservative proof-pattern suggestions.

## Likely Files or Areas
- src/core/review-intelligence.ts
- src/core/review-contract.ts
- src/core/project-review-contract.ts
- src/renderers/markdown-report.ts
- src/renderers/html-replay.ts
- src/renderers/resume-prompt.ts
- src/commands/status.ts
- src/commands/handoff.ts
- tests/core/review-intelligence.test.ts
- tests/renderers/markdown-report.test.ts
- tests/renderers/html-replay.test.ts
- README.md
- docs/development/project-review-contract.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Current status/handoff/report/replay/resume can show repo-calibrated proof guidance based on similar local ready handoffs.
- Guidance is deterministic, conservative, and clearly suggestion-only.
- No raw source text or command output is copied from historical evidence into calibration summaries.
- Tests cover under-proofed current work, no-history behavior, and local-only evidence handling.

## Verification Commands
- npm test -- tests/core/review-intelligence.test.ts tests/core/review-contract.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/commands/evidence-output.test.ts
- npm run verify
- npm run format:check
- npm audit --audit-level=moderate
- npx projscan@latest doctor --format json
- npx projscan@latest preflight --mode before_commit --format json
- npx agentloopkit@latest verify

## Post-Verification Gates
- No post-verification gate recorded. Use this for commands that need a fresh AgentLoop verification report.

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Calibration could be misleading if history matching is too aggressive; keep thresholds conservative and explain why suggestions appear.
- Reading historical artifacts could become slow; cap scanned history and avoid parsing large evidence files.

## Rollback Notes
Revert the calibration helper, renderer additions, tests, and docs; existing Review Contract and Project Review Contract behavior should remain usable.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
