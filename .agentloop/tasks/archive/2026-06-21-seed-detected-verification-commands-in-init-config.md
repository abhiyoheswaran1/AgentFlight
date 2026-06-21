# Seed detected verification commands in init config

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
agentflight init now displays a detected proof command, but newly generated .agentflight/config.json still contains an empty verification.commands list, making the visible project config less useful on first run.

## Desired Outcome
New AgentFlight configs created during init include detected verification commands from package scripts, while existing configs are never overwritten and profiles remain unchanged.

## Constraints
- Keep this focused to config creation, init guidance consistency, docs, and tests; do not add named profiles, release steps, CI/JSON, PR comments, cloud, login, billing, or hosted features.

## Non-Goals
- No broad proof-profile system, no version bump, no package publish, no dependency changes.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/core/config.ts
- src/commands/init.ts
- tests/core/config.test.ts
- tests/commands/workflow.test.ts
- AGENTFLIGHT_DEVLOG.md
- CHANGELOG.md
- docs/superpowers/plans/2026-06-21-seed-init-verification-commands.md

## Files or Areas Not to Touch
- package.json
- package-lock.json

## Acceptance Criteria
- New config files include detected commands such as npm run typecheck, npm test, and npm run build.
- Existing config files are not overwritten.
- Configs for repos with no proof scripts still use an empty verification.commands array.
- init output and generated config agree on the detected primary proof command.

## Verification Commands
- npm test -- tests/core/config.test.ts tests/commands/workflow.test.ts
- npm run verify
- npm run format:check

## Post-Verification Gates
- npm pack --dry-run
- npm audit --audit-level=moderate
- npx projscan@latest doctor --format json
- npx projscan@latest preflight --mode before_commit --format json
- npx projscan@latest review --format json
- npx agentloopkit@latest verify

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- New config defaults affect first-run generated project config; preserve existing config behavior and keep profiles empty.

## Rollback Notes
Revert config seeding, init consistency tests, changelog/devlog entry, plan, and AgentLoop evidence.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
