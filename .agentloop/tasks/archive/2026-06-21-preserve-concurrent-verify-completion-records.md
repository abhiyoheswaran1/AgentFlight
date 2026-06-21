# Clarify in-flight verification guidance

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
Status can be checked while one or more `agentflight verify` commands are still running. The current incomplete-verification wording says no completed result was recorded, which can read like lost evidence even when the command is simply still in flight.

## Desired Outcome
Status/report/replay/resume incomplete-verification guidance explains that a command may still be running and tells users to wait first, then rerun the verification command only if no result appears.

## Constraints
- Find the root cause before changing code.
- Use TDD: add a regression test that fails before the fix.
- Do not add new product features or change verification semantics beyond clearer guidance.
- Keep evidence local-only and preserve raw stdout/stderr evidence.

## Non-Goals
- Do not add JSON/CI, profiles, export modes, cloud, PR comments, or release work.

## Assumptions
- Root-cause investigation showed concurrent completion events and verification runs were preserved after the parallel commands finished; the friction was wording during in-flight status checks, not a persistence loss.

## Likely Files or Areas
- src/core/review-intelligence.ts
- tests/core/review-intelligence.test.ts
- tests/commands/evidence-output.test.ts
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Incomplete-verification proof gaps say the command may still be running.
- Readiness next action says to wait for completion before rerunning verification.
- Status, Markdown report, replay, and resume surfaces use the shared clearer guidance.
- Verification run storage and raw stdout/stderr evidence handling remain unchanged.

## Verification Commands
- npm test -- tests/core/review-intelligence.test.ts tests/commands/evidence-output.test.ts
- npm run verify
- npm run format:check

## Post-Verification Gates
- No post-verification gate recorded. Use this for commands that need a fresh AgentLoop verification report.

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- User-facing Review Intelligence copy affects status, report, replay, and resume trust cues.

## Rollback Notes
Revert the Review Intelligence copy update, regression tests, and docs entries.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
