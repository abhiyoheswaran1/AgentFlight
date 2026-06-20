# Stop auto-creating AgentLoop tasks on start

- Created date: 2026-06-21
- Task type: refactor
- Status: done

## Problem Statement
agentflight start currently creates an AgentLoopKit task when no active task exists. That can add first-run review noise and make startup slower, even though AgentFlight should mainly link local evidence rather than mutate another tool's task list.

## Desired Outcome
agentflight start links an existing AgentLoopKit active task when present, but does not create a new AgentLoopKit task automatically when no active state exists.

## Constraints
- Keep AgentLoopKit integration local-only and optional.
- Do not change AgentLoopKit itself.
- Do not add flags, profiles, release work, dependencies, or hosted features.

## Non-Goals
- Do not remove AgentLoopKit availability detection.
- Do not solve all startup latency.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/adapters/agentloopkit.ts
- src/commands/start.ts
- tests/adapters/agentloopkit.test.ts
- tests/commands/workflow.test.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- agentflight start reuses .agentloop/state.json activeTaskPath when present.
- agentflight start does not invoke AgentLoopKit create-task when no active state exists.
- No-active AgentLoopKit state does not report a false linked task.
- Focused tests and full verification pass.

## Verification Commands
- npm test -- tests/adapters/agentloopkit.test.ts tests/commands/workflow.test.ts
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
- Changing AgentLoopKit linking could surprise users who expected automatic AgentLoop task creation.

## Rollback Notes
Revert the adapter, start command, tests, and changelog note.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
