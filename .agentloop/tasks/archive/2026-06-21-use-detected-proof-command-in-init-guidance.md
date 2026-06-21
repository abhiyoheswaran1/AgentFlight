# Use detected proof command in init guidance

- Created date: 2026-06-21
- Task type: docs
- Status: done

## Problem Statement
agentflight init now points users through verify and handoff, but the verify line is hardcoded to npm test even when the repo's detected proof commands prefer typecheck, lint, or build.

## Desired Outcome
First-run init output uses the first detected verification command when one exists, and falls back to a generic proof-command placeholder when none is detected.

## Constraints
- Keep this to init guidance and tests; do not change config schema, generated config defaults, package metadata, release state, or add named profiles.

## Non-Goals
- No version bump, release, PR comments, JSON/CI, cloud, login, billing, or broad proof-profile system.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/init.ts
- tests/commands/workflow.test.ts
- AGENTFLIGHT_DEVLOG.md
- CHANGELOG.md
- docs/superpowers/plans/2026-06-21-init-detected-proof-guidance.md

## Files or Areas Not to Touch
- package.json
- package-lock.json

## Acceptance Criteria
- init output uses agentflight verify -- npm run typecheck when typecheck is the first detected proof command.
- init output does not hardcode npm test when a more appropriate detected command exists.
- init output uses a clear placeholder when no proof command is detected.

## Verification Commands
- npm test -- tests/commands/workflow.test.ts
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
- Changing init guidance affects first-run CLI copy only; generated config and runtime session behavior should remain unchanged.

## Rollback Notes
Revert the init guidance helper, tests, changelog/devlog entry, plan, and AgentLoop evidence.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
