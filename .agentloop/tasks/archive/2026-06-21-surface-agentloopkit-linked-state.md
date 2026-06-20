# Surface AgentLoopKit linked state

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
After AgentFlight stopped auto-creating AgentLoopKit tasks, start output still reports only AgentLoopKit availability and stale task-creation warning copy, making linked vs unlinked state unclear.

## Desired Outcome
AgentFlight start and report surfaces concisely show whether AgentLoopKit has an active task linked, without reintroducing task creation or noisy diagnostics.

## Constraints
- Do not create AgentLoopKit task contracts automatically.
- Do not add new product features or release work.
- Keep copy concise and local-only.

## Non-Goals
- No v0.6.0 roadmap feature implementation.
- No dependency changes.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/core/output.ts
- src/commands/start.ts
- tests/commands/workflow.test.ts
- tests/renderers/markdown-report.test.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Start output distinguishes AgentLoopKit linked and unlinked states.
- Legacy AgentLoopKit task creation warning copy is removed or made generic.
- Session evidence remains intact.

## Verification Commands
- npm test -- tests/commands/workflow.test.ts tests/renderers/markdown-report.test.ts
- npm run verify
- npm run format:check

## Post-Verification Gates
- No post-verification gate recorded. Use this for commands that need a fresh AgentLoop verification report.

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- User-facing copy change could add noise if too verbose.

## Rollback Notes
Revert the output formatting and tests for this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
