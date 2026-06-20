# Compact verification evidence commands in text surfaces

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
Long verification commands are compact in the HTML replay ledger, but status and Markdown verification evidence rows can still print full long commands and make dense review output noisy.

## Desired Outcome
Status and Markdown report verification evidence rows display long commands compactly while preserving stored verification run data and raw stdout/stderr evidence.

## Constraints
- No new commands, export modes, CI/JSON output, PR comments, cloud, login, billing, or hosted features.
- Do not alter verification capture, stored run.command values, stdout, or stderr evidence.
- Keep this limited to dense text display helpers, tests, and development notes.

## Non-Goals
- Do not redesign reports or handoff artifacts.
- Do not change suggested proof command behavior.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/status.ts
- src/renderers/markdown-report.ts
- tests/commands/evidence-output.test.ts
- tests/renderers/markdown-report.test.ts
- AGENTFLIGHT_DEVLOG.md
- CHANGELOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Long verification run commands are shortened in status output.
- Long verification run commands are shortened in Markdown verification evidence rows.
- Stored verification run commands and raw stdout/stderr evidence remain unchanged.
- Short commands remain readable and unmodified.

## Verification Commands
- npm test -- tests/commands/evidence-output.test.ts tests/renderers/markdown-report.test.ts
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
Revert the status/report display changes, tests, and notes to restore full visible verification evidence commands.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
