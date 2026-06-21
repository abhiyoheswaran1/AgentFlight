# Guide idempotent init with detected proof

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
When .agentflight/config.json already exists with empty verification.commands, agentflight init skips config as intended but its primary workflow falls back to agentflight verify -- <proof command> even when package proof scripts are detected.

## Desired Outcome
Idempotent init keeps existing config unchanged but uses detected package proof commands to show a concrete explicit verify command when configured commands are empty.

## Constraints
- Do not mutate existing .agentflight/config.json.
- Keep init local-only and deterministic.
- Do not change verify execution behavior.

## Non-Goals
- No config migration or profile work.
- No release or version bump.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/core/config.ts
- src/commands/init.ts
- tests/core/config.test.ts
- tests/commands/workflow.test.ts
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Idempotent init with empty config and detected proof scripts shows a concrete agentflight verify -- command.
- Existing config remains unchanged.
- Fresh init with seeded commands still shows no-arg agentflight verify.
- No-proof repos still show agentflight verify -- <proof command>.

## Verification Commands
- npm test -- tests/core/config.test.ts tests/commands/workflow.test.ts
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
- Init output must not imply no-arg verify will work when config commands are empty.

## Rollback Notes
Revert init/config source, tests, and docs for this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
