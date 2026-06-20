# Reuse active AgentLoop task during AgentFlight start

- Created date: 2026-06-20
- Task type: bugfix
- Status: done

## Problem Statement
AgentFlight start creates a new AgentLoopKit placeholder task even when the repo already has an active AgentLoop task. In the repo's required workflow, this creates duplicate task contracts that agents repeatedly have to remove before handoff.

## Desired Outcome
AgentFlight should detect and reuse an active AgentLoopKit task during start instead of creating a duplicate placeholder, while still creating a task when none is active.

## Constraints
- No new product features beyond duplicate-task prevention.
- No release, version bump, tag, publish, or push.
- Keep changes local-only and preserve AgentLoopKit availability reporting.

## Non-Goals
- Do not redesign AgentLoopKit integration or add a full task-selection UI.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/adapters/agentloopkit.ts
- tests/adapters/agentloopkit.test.ts
- CHANGELOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- createAgentLoopTask returns linked/available without calling create-task when AgentLoopKit status reports an active task.
- createAgentLoopTask still creates a task when status reports no active task.
- agentflight start no longer creates a duplicate AgentLoop placeholder when this repo already has an active task.

## Verification Commands
- npm test -- tests/adapters/agentloopkit.test.ts tests/commands/workflow.test.ts
- npm run verify
- npm run format:check
- npx projscan@latest review --format json
- npx projscan@latest preflight --mode before_commit --format json
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
Revert AgentLoopKit adapter, tests, changelog, and task evidence for this loop.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
