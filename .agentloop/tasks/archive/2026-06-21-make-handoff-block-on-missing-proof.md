# Make handoff block on missing proof

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
agentflight handoff treats missing verification proof as a normal non-blocked handoff: it says Next action and Open first: replay even when Review Intelligence says Needs verification.

## Desired Outcome
Handoff output should clearly mark non-ready missing-proof states as fix-before-sharing, point reviewers to the report first, and return a non-zero exit code for not-ready handoffs while preserving ready and failed behavior.

## Constraints
- Do not add release work or distribution features.
- Do not add new commands or profiles.
- Keep handoff local-only and concise.

## Non-Goals
- No PR comments, CI integration, export modes, cloud, or hosted features.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/handoff.ts
- tests/commands/evidence-output.test.ts
- README.md
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Ready handoffs still exit 0 and open replay first.
- Failed verification handoffs still exit non-zero, show failed excerpts, and open report first.
- Missing-proof handoffs exit non-zero, show Fix before sharing, keep the suggested verification command, and open report first.

## Verification Commands
- npm test -- tests/commands/evidence-output.test.ts
- npm run verify
- npm run format:check

## Post-Verification Gates
- No post-verification gate recorded. Use this for commands that need a fresh AgentLoop verification report.

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Changing exit-code behavior can affect local scripts that use handoff as a readiness gate.

## Rollback Notes
Revert handoff readiness rendering, exit-code logic, docs, and tests for this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
