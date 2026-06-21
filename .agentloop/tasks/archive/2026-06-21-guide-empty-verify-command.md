# Guide empty verify command

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
When .agentflight/config.json has no verification commands, agentflight verify without an explicit command fails without showing the package proof commands AgentFlight can already detect.

## Desired Outcome
The empty-command verify error suggests concise agentflight verify -- <command> examples from detected package scripts, while still leaving config unchanged.

## Constraints
- Do not mutate .agentflight/config.json.
- Do not add named verification profiles, JSON/CI behavior, release behavior, or automatic migration.
- Keep output local-only and concise.

## Non-Goals
- No version bump, release, tag, push, or publish.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/verify.ts
- tests/commands/verify.test.ts
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Empty configured commands plus package scripts produces suggested agentflight verify commands.
- No package proof scripts keeps the existing no-command error concise.
- Named profile errors remain unchanged.

## Verification Commands
- npm test -- tests/commands/verify.test.ts
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
Revert the verify error guidance, tests, and docs changes.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
