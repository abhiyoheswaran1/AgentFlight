# Clarify clean resume constraints

- Created date: 2026-06-21
- Task type: docs
- Status: done

## Problem Statement
Clean-worktree resume prompts tell users to start a new session for the next task, but the generic constraints still say to stay scoped to the current task and not start unrelated work.

## Desired Outcome
Clean resume prompts clarify that unrelated work should start in a new AgentFlight session, while active-task resume prompts keep the stricter current-task constraints.

## Constraints
- Text-only resume prompt copy change.
- Do not change verification, artifacts, report, replay, release, or JSON/CI behavior.

## Non-Goals
- No resume redesign, no new command, no export mode, no dependency changes.

## Assumptions
- Review readiness state clean_worktree is the correct switch for clean resume constraints.

## Likely Files or Areas
- src/renderers/resume-prompt.ts
- tests/commands/evidence-output.test.ts
- AGENTFLIGHT_DEVLOG.md
- CHANGELOG.md

## Files or Areas Not to Touch
- package.json
- package-lock.json
- .agentflight/evidence/**

## Acceptance Criteria
- Clean resume constraints say to start a new AgentFlight session before unrelated work.
- Clean resume constraints do not say Do not start unrelated work.
- Non-clean resume prompts keep the existing strict constraints.

## Verification Commands
- npm test -- tests/commands/evidence-output.test.ts
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
Revert resume constraint copy, tests, and documentation notes.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
