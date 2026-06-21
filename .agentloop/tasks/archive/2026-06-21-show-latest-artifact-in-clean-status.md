# Show latest artifact in clean status

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
After a clean handoff, agentflight status tells users to run history --limit 1 instead of directly showing the latest local artifact path, adding an avoidable lookup step.

## Desired Outcome
Clean-worktree status points directly to the latest local handoff/report/replay artifact when one exists, while still telling users to start a new session for new work.

## Constraints
- Keep status read-only and local-first.
- Do not add export, sync, JSON/CI, release, or hosted behavior.

## Non-Goals
- No history redesign, no session switching, no new artifact types, no version bump, no dependency changes.

## Assumptions
- The current session's existing open-first artifact is the right clean-status shortcut.

## Likely Files or Areas
- src/commands/status.ts
- tests/commands/workflow.test.ts
- src/commands/history.ts
- AGENTFLIGHT_DEVLOG.md

## Files or Areas Not to Touch
- package.json
- package-lock.json
- .agentflight/evidence/**

## Acceptance Criteria
- Clean-worktree status includes a repo-relative Open first artifact path when current artifacts exist.
- Clean-worktree status keeps the start-new-session next action.
- Status does not expose absolute paths.

## Verification Commands
- npm test -- tests/commands/workflow.test.ts
- npm run verify
- npm run format:check

## Post-Verification Gates
- npx agentloopkit@latest verify

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Re-check protected areas before changing migrations, auth, secrets, billing, deployment, or public APIs.

## Rollback Notes
Revert status output changes, tests, and documentation notes.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
