# Prefer review-ready history artifacts

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
agentflight history can show a session as Clean worktree and point to a report when a later clean artifact event follows an earlier review-ready artifact event, even though the review-ready replay remains the more useful artifact.

## Desired Outcome
History prefers the latest actionable non-clean review artifact metadata over later clean-worktree artifact metadata, while sessions with only clean metadata remain unchanged.

## Constraints
- Keep history read-only and local-only.
- Do not release, version bump, push, tag, or publish.
- Keep scope limited to session summary/history artifact metadata selection.

## Non-Goals
- Do not generate, migrate, delete, or rewrite existing artifacts.
- Do not add search, export, session switching, JSON/CI, PR comments, cloud, login, billing, or hosted features.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/core/session.ts
- tests/core/session.test.ts
- tests/commands/history.test.ts
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- A session with a ready replay event followed by a clean report event summarizes as Ready for review and opens replay.
- A session with only clean artifact metadata continues to summarize as Clean worktree.
- History remains read-only and does not mutate session files or artifact files.

## Verification Commands
- npm test -- tests/core/session.test.ts tests/commands/history.test.ts
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
- Changing summary selection can affect open-first guidance for prior sessions, so preserve clean-only behavior.

## Rollback Notes
Revert the session summary selection and related tests.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
