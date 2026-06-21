# Make clean handoff exit successfully

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
agentflight handoff prints a normal clean-worktree handoff after a completed session but exits with code 1, making an informational state look like a command failure.

## Desired Outcome
Clean-worktree handoff output remains clear and exits successfully, while blocked review states remain nonzero.

## Constraints
- Keep behavior local-only and deterministic.
- Do not add product features, release, version bump, push, tag, or publish.
- Keep the change focused on handoff exit-code semantics and tests.

## Non-Goals
- Do not change report, replay, resume, or history artifact generation.
- Do not change readiness labels or add JSON/CI/export surfaces.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/handoff.ts
- tests/commands/evidence-output.test.ts
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- agentflight handoff exits 0 for clean_worktree readiness.
- agentflight handoff still exits nonzero for blocked review readiness.
- handoff output remains concise and local-only.

## Verification Commands
- npm test -- tests/commands/evidence-output.test.ts
- npm run verify
- npm run format:check

## Post-Verification Gates
- npx projscan@latest doctor --format json
- npx projscan@latest preflight --mode before_commit --format json
- npx agentloopkit@latest verify

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Changing exit-code semantics can affect scripts, so scope the success case to clean-worktree state.

## Rollback Notes
Revert the handoff exit-code and test changes.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
