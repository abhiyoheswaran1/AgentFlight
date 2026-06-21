# Show latest artifact in clean resume

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
Clean-worktree resume prompts omit the latest local artifact path even when report/replay/handoff evidence exists, while status and history now show it directly.

## Desired Outcome
Clean resume prompts include the same repo-relative Open first artifact shortcut when current artifacts exist, while keeping the start-new-session guidance.

## Constraints
- Keep resume local-only and text-only.
- Do not add export modes, PR comments, JSON/CI, release work, or hosted features.

## Non-Goals
- No resume redesign, no new artifact types, no session switching, no dependency changes.

## Assumptions
- The shared review-artifact helper should drive the clean resume shortcut.

## Likely Files or Areas
- src/commands/resume.ts
- tests/commands/evidence-output.test.ts
- AGENTFLIGHT_DEVLOG.md
- CHANGELOG.md

## Files or Areas Not to Touch
- package.json
- package-lock.json
- .agentflight/evidence/**

## Acceptance Criteria
- Clean resume prompts include a repo-relative Open first artifact path when current artifacts exist.
- Clean resume prompts keep start-new-session guidance.
- Resume output does not expose absolute paths.

## Verification Commands
- npm test -- tests/commands/evidence-output.test.ts
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
Revert resume output changes, tests, and documentation notes.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
