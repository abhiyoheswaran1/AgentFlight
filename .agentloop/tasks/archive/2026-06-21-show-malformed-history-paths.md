# Show malformed history paths

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
agentflight history reports malformed session files only as a count, which tells engineers something is wrong but not which local file needs cleanup.

## Desired Outcome
agentflight history lists repo-relative malformed session paths without absolute paths or noisy parser output, capped so the history view stays readable.

## Constraints
- Keep history read-only and local-only.
- Do not include absolute repo paths in terminal output.
- Do not add session repair, deletion, search, sync, export, JSON, CI, cloud, PR comments, or hosted behavior.

## Non-Goals
- No automatic cleanup or mutation of malformed session files.
- No version bump, release, tag, push, or publish.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/history.ts
- tests/commands/history.test.ts
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Malformed session output includes .agentflight/sessions/<file>.json as a repo-relative path.
- Malformed session output does not include the absolute repo root.
- Multiple malformed session paths are capped with an omitted-count line.

## Verification Commands
- npm test -- tests/commands/history.test.ts
- npm run verify
- npm run format:check
- npm pack --dry-run
- npx agentloopkit@latest verify

## Post-Verification Gates
- No post-verification gate recorded. Use this for commands that need a fresh AgentLoop verification report.

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Re-check protected areas before changing migrations, auth, secrets, billing, deployment, or public APIs.

## Rollback Notes
Revert the history command/test/docs changes.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
