# Compact long status verification lists

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
Dogfooding a completed session showed agentflight status printing a long verification ledger after the summary line. This makes status harder to scan during real work, while report/replay already preserve full evidence.

## Desired Outcome
Terminal status shows a concise recent verification run list when a session has many runs, with an explicit omitted-run note. JSON status and stored verification evidence remain complete.

## Constraints
- Keep this local-only and display-only; do not delete or mutate verification runs, evidence files, report/replay ledgers, JSON output, or session storage.
- Do not add export modes, PR comments, release, version bump, or cloud behavior.

## Non-Goals
- Do not change report/replay verification ledgers.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/status.ts
- tests/commands/evidence-output.test.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Status text with many verification runs shows only the most recent bounded list plus an omitted-run count.
- Status JSON still includes every verification run.
- Stored stdout/stderr evidence remains intact.

## Verification Commands
- npm test -- tests/commands/evidence-output.test.ts
- npm run verify
- npm run format:check

## Post-Verification Gates
- No post-verification gate recorded. Use this for commands that need a fresh AgentLoop verification report.

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Status is a quick CLI surface; keep the compacting rule obvious so users know where the full evidence remains.

## Rollback Notes
Revert the status display compaction, tests, and docs for this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
