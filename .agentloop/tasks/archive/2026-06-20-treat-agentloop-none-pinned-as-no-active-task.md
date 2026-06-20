# Treat AgentLoop none pinned as no active task

- Created date: 2026-06-20
- Task type: bugfix
- Status: done

## Problem Statement
AgentLoopKit can report 'Active task: none pinned.' when no task is active. AgentFlight only treats 'none active' as empty, so agentflight start can falsely report task reuse and skip task creation.

## Desired Outcome
AgentFlight recognizes AgentLoopKit 'none pinned' / no-active status lines as no active task, while still reusing a real active task.

## Constraints
- Keep this to AgentFlight's AgentLoopKit status parsing behavior.
- Do not change AgentLoopKit itself.
- Do not add new product features, version bumps, release work, or dependencies.

## Non-Goals
- Do not solve all startup latency in this task.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/adapters/agentloopkit.ts
- tests/adapters/agentloopkit.test.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- createAgentLoopTask creates a task when AgentLoopKit status says 'Active task: none pinned.'
- createAgentLoopTask still reuses a real active task.
- Regression tests cover both status phrasings.

## Verification Commands
- npm test -- tests/adapters/agentloopkit.test.ts
- npm run verify
- npm run format:check
- npx projscan@latest doctor --format json
- npx projscan@latest preflight --mode before_commit --format json
- npx agentloopkit@latest verify

## Post-Verification Gates
- No post-verification gate recorded. Use this for commands that need a fresh AgentLoop verification report.

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Incorrect parsing could create duplicate AgentLoop tasks or skip useful task linking.

## Rollback Notes
Revert the AgentLoopKit parser and tests.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
