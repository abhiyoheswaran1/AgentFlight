# Configure AgentFlight repo default verification

- Created date: 2026-06-21
- Task type: docs
- Status: done

## Problem Statement
AgentFlight's own tracked .agentflight/config.json predates init-seeded verification commands, so agentflight doctor warns even when package proof scripts exist.

## Desired Outcome
AgentFlight's repo config dogfoods a sensible no-arg verification command and doctor no longer warns about empty verification.commands.

## Constraints
- Do not change product runtime behavior or package version.
- Keep the config local-first and repository-scoped.

## Non-Goals
- No new verification profiles, CI modes, release work, dependency changes, or product features.

## Assumptions
- The repo's normal all-up proof command is npm run verify.

## Likely Files or Areas
- .agentflight/config.json
- AGENTFLIGHT_DEVLOG.md
- CHANGELOG.md

## Files or Areas Not to Touch
- package.json
- package-lock.json
- src/**

## Acceptance Criteria
- agentflight doctor reports no empty-verification warning for this repo.
- agentflight verify with no explicit command runs the configured repo proof command.

## Verification Commands
- node dist/cli.js doctor
- node dist/cli.js verify
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
Revert .agentflight/config.json and related documentation notes.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
