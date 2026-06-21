# Align init tool availability reporting

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
agentflight init reports ProjScan and AgentLoopKit availability from repo marker files, while start and doctor inspect the actual CLIs. First-run dogfood saw init say unavailable and later commands say available.

## Desired Outcome
agentflight init uses the same ToolAdapterResult-style availability reporting as start, with deterministic test injection and no marker-file-only availability claims.

## Constraints
- Keep init local-only and avoid running heavy baselines or doctor checks.
- Do not add new product features, export modes, PR comments, release, or version bump scope.

## Non-Goals
- Do not change AgentFlight config file shape.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/init.ts
- src/core/config.ts
- tests/commands/workflow.test.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Init output can show injected ProjScan and AgentLoopKit CLI availability even when marker files are absent.
- Init output uses concise unavailable guidance when injected tools are unavailable.

## Verification Commands
- npm test -- tests/commands/workflow.test.ts tests/core/config.test.ts
- npm run verify
- npm run format:check

## Post-Verification Gates
- No post-verification gate recorded. Use this for commands that need a fresh AgentLoop verification report.

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Re-check protected areas before changing migrations, auth, secrets, billing, deployment, or public APIs.

## Rollback Notes
Revert the init tool reporting change, tests, and docs for this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
