# Keep start tool checks fast and bounded

- Created date: 2026-06-20
- Task type: refactor
- Status: done

## Problem Statement
Dogfooding shows agentflight start should stay fast while still reporting optional ProjScan and AgentLoopKit availability. Optional tool health checks should not dominate the start path.

## Desired Outcome
agentflight start performs bounded optional-tool inspection without running heavy diagnostics on the critical path, while preserving concise degraded-tool warnings and AgentLoop task reuse/linking.

## Constraints
- Keep the patch small and focused on start-path optional-tool inspection.
- Do not add product features, release work, dependencies, JSON/CI modes, cloud features, or public API churn.
- Keep evidence local-only and preserve raw runtime behavior.

## Non-Goals
- Do not change ProjScan or AgentLoopKit projects.
- Do not start v0.6.0 or cut a release.

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
- agentflight start no longer runs AgentLoopKit doctor on the critical path when a lightweight availability/status check is enough.
- AgentLoopKit task reuse/linking still works when AgentLoopKit is available.
- Unavailable or degraded AgentLoopKit still produces concise warnings.
- Focused tests cover the faster inspection behavior and regression risk.

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
- Changing optional-tool checks can hide degraded-tool information if warnings are not preserved.

## Rollback Notes
Revert the changed adapter/command/test files and the related changelog note.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
