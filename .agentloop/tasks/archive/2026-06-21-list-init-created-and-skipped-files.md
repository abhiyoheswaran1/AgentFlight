# List init created and skipped files

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
First-run init output says Created: 2 and Skipped existing files: 0 without naming which files were created or preserved. Dogfood shows first-run trust improves when generated project config and local gitignore are explicit.

## Desired Outcome
agentflight init lists created files and skipped existing files by repo-relative path while keeping existing first-run guidance about config, runtime evidence, and ProjScan memory filters.

## Constraints
- CLI output only; do not change init file creation behavior, config shape, runtime filters, release, version, cloud, export, or PR behavior.
- Keep output concise and deterministic.

## Non-Goals
- Do not add an interactive init workflow.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/init.ts
- tests/commands/workflow.test.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Fresh init output lists .agentflight/config.json and .agentflight/.gitignore as created files.
- Second init output lists existing files as skipped instead of only showing counts.
- Existing local-files guidance remains present.

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
- Init output is first-run user-facing copy; avoid adding noisy absolute paths.

## Rollback Notes
Revert init output formatting, tests, and docs for this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
