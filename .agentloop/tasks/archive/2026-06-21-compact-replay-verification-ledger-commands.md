# Compact replay verification ledger commands

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
Long verification commands remain fully visible in the HTML replay verification ledger, making dense review and PDF output noisy even though proof-gap surfaces already compact suggested commands.

## Desired Outcome
HTML replay verification run commands display compactly while preserving the full command in a title attribute for inspection.

## Constraints
- No new commands, export modes, CI/JSON output, PR comments, cloud, login, billing, or hosted features.
- Keep raw verification evidence and stored command values unchanged.
- Keep the change limited to replay display helpers, tests, and local development notes.

## Non-Goals
- Do not redesign the replay UI.
- Do not change verification capture semantics.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/renderers/html-replay.ts
- tests/renderers/html-replay.test.ts
- AGENTFLIGHT_DEVLOG.md
- CHANGELOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Long verification run commands are shortened in the visible HTML replay ledger.
- The full verification run command remains available in the HTML title attribute.
- HTML escaping remains safe for visible and title text.
- Existing suggested proof command compaction continues to work.

## Verification Commands
- npm test -- tests/renderers/html-replay.test.ts
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
Revert the replay renderer/test/docs changes to restore full visible ledger commands.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
