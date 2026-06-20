# Read AgentLoop active task state directly

- Created date: 2026-06-20
- Task type: refactor
- Status: done

## Problem Statement
agentflight start spends several seconds running agentloopkit status only to detect whether an active AgentLoop task exists. The active pointer is already stored locally in .agentloop/state.json, so parsing status prose is slow and brittle.

## Desired Outcome
AgentFlight reuses an active AgentLoop task by reading .agentloop/state.json directly, and only calls AgentLoopKit CLI to create a task when no active state is present.

## Constraints
- Keep behavior local-only and do not read secrets.
- Do not change AgentLoopKit itself.
- Do not add product features, release work, dependencies, or configuration.

## Non-Goals
- Do not solve every optional-tool startup cost in this task.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/adapters/agentloopkit.ts
- tests/adapters/agentloopkit.test.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- createAgentLoopTask reuses .agentloop/state.json activeTaskPath without invoking agentloopkit status.
- createAgentLoopTask creates a task when no active state file exists.
- Malformed or empty state falls back to task creation instead of reporting false reuse.
- Focused tests and full verification pass.

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
- Incorrect state parsing could create duplicate tasks or skip linking a real active task.

## Rollback Notes
Revert the AgentLoopKit adapter and tests.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
