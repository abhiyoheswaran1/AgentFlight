# Prefer configured proof in start output

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
agentflight start still lists detected package proof scripts even when .agentflight/config.json has configured verification commands, making no-arg agentflight verify less obvious.

## Desired Outcome
Start output prefers the configured AgentFlight proof path when verification.commands exists, while preserving detected fallback suggestions when config is empty.

## Constraints
- Do not add verification profiles, JSON/CI, release work, dependency changes, or new command flags.
- Keep copy local-first and coding-agent-session oriented.

## Non-Goals
- No new verification behavior; this is output guidance only.

## Assumptions
- When verification.commands is non-empty, agentflight verify is the primary suggested proof command.

## Likely Files or Areas
- src/commands/start.ts
- tests/commands/workflow.test.ts
- AGENTFLIGHT_DEVLOG.md
- CHANGELOG.md

## Files or Areas Not to Touch
- package.json
- package-lock.json
- .agentflight/evidence/**

## Acceptance Criteria
- start output shows configured proof guidance when config commands exist.
- start output keeps detected package proof fallback when config commands are empty.
- start output does not expose absolute repo paths.

## Verification Commands
- npm test -- tests/commands/workflow.test.ts
- npm run verify
- npm run format:check

## Post-Verification Gates
- npx agentloopkit@latest verify

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Re-check protected areas before changing migrations, auth, secrets, billing, deployment, or public APIs.

## Rollback Notes
Revert start output copy changes, tests, and documentation notes.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
