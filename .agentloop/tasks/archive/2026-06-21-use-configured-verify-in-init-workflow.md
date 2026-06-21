# Use configured verify in init workflow

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
agentflight init seeds detected verification commands into .agentflight/config.json, but its primary workflow still tells first-run users to run one explicit agentflight verify -- command.

## Desired Outcome
When init has configured verification commands, the primary workflow points to no-arg agentflight verify so users exercise the seeded config path; repos with no proof commands still show agentflight verify -- <proof command>.

## Constraints
- Keep init local-only and read-only after generated file writes.
- Do not change command execution behavior.
- Do not add profiles, JSON, CI, export modes, or release work.

## Non-Goals
- No migration for existing configs.
- No version bump or release.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/init.ts
- tests/commands/workflow.test.ts
- README.md
- docs/examples/basic-agentflight-session.md
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Init output uses agentflight verify when generated config includes verification commands.
- Init output keeps agentflight verify -- <proof command> when no package proof scripts are detected.
- README/example quickstart reflect the configured verify path without hiding explicit verify usage.

## Verification Commands
- npm test -- tests/commands/workflow.test.ts
- npm run verify
- npm run format:check
- npm pack --dry-run

## Post-Verification Gates
- npx projscan@latest doctor --format json
- npx projscan@latest preflight --mode before_commit --format json
- npx agentloopkit@latest verify

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Init output is first-run product copy; keep the path unambiguous.

## Rollback Notes
Revert init output, tests, and docs for this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
