# Second review surface maintenance pass

- Created date: 2026-06-24
- Task type: bugfix
- Status: done

## Problem Statement
Continue the AgentFlight improvement loop with another focused bug-hunting and maintainability pass after the review-surface fixes.

## Desired Outcome
Additional concrete bugs, security issues, or maintainability problems are found and fixed without adding product scope or release work.

## Constraints
- No release, version bump, commit, push, tag, publish, hosted workflow, PR automation, or new product command.
- Keep changes local-first, source-free where relevant, and tied to existing review surfaces.

## Non-Goals
- None recorded yet.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- Review surfaces: `src/commands/status.ts`, `src/commands/handoff.ts`,
  `src/commands/resume.ts`, `src/renderers/markdown-report.ts`,
  `src/renderers/html-replay.ts`, and `src/renderers/resume-prompt.ts`.
- Review intelligence and proof state: `src/core/review-intelligence.ts`,
  `src/core/project-review-contract.ts`, `src/core/proof-calibration.ts`,
  `src/core/session.ts`, `src/core/verification.ts`, and `src/core/output.ts`.
- Focused regression tests under `tests/commands/`, `tests/core/`, and
  `tests/renderers/`.
- Development evidence and user-facing docs touched by the maintenance pass:
  `AGENTFLIGHT_DEVLOG.md`, `CHANGELOG.md`, `README.md`, and
  `docs/development/`.

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Any implemented fix has focused regression coverage.
- npm run verify and npm run format:check pass before handoff.
- ProjScan, AgentLoopKit, and AgentFlight are used for the development loop and concrete blockers are fixed.

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
- Re-check protected areas before changing migrations, auth, secrets, billing, deployment, or public APIs.

## Rollback Notes
- Revert the maintenance-pass source, test, and documentation changes as one
  local patch if the review-surface behavior regresses.
- If a narrower rollback is needed, disable the affected display path by
  reverting the corresponding command/renderer change and its regression test,
  then rerun `npm run verify`, `npm run format:check`, ProjScan, AgentLoopKit,
  and AgentFlight dogfood before handoff.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
