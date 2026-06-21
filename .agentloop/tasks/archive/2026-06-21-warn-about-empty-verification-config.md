# Warn about empty verification config

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
Older AgentFlight configs can have an empty verification.commands array even when package scripts exist, so agentflight verify without an explicit command fails after doctor reports scripts as configured.

## Desired Outcome
agentflight doctor warns when .agentflight/config.json has no configured verification commands while package proof scripts exist, with concise guidance to add commands or run explicit agentflight verify commands.

## Constraints
- Do not mutate .agentflight/config.json.
- Do not add named verification profiles, JSON/CI behavior, release behavior, or automatic config migration.
- Keep doctor local-only and path-safe.

## Non-Goals
- No version bump, release, tag, push, or publish.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/core/doctor.ts
- src/commands/doctor.ts
- tests/core/doctor.test.ts
- tests/commands/workflow.test.ts
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Doctor warns when config verification.commands is empty and at least one proof script exists.
- Doctor remains OK when config has at least one verification command.
- Doctor remains OK when no proof scripts exist, because there is nothing obvious to seed.

## Verification Commands
- npm test -- tests/core/doctor.test.ts tests/commands/workflow.test.ts
- npm run verify
- npm run format:check
- npm pack --dry-run
- npx agentloopkit@latest verify

## Post-Verification Gates
- No post-verification gate recorded. Use this for commands that need a fresh AgentLoop verification report.

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Re-check protected areas before changing migrations, auth, secrets, billing, deployment, or public APIs.

## Rollback Notes
Revert the doctor warning, tests, and docs changes.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
