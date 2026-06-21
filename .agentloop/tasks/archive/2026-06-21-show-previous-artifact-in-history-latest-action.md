# Show previous artifact in history latest action

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
agentflight history latest action points only at the current session when that session has no artifacts, making a recent useful replay/report harder to reopen after a throwaway or smoke session.

## Desired Outcome
When the current latest session has no handoff/report/replay yet, history still suggests running handoff for the current session and also surfaces the nearest previous existing artifact as a read-only fallback.

## Constraints
- Local-first only; no session switching, search index, export, sync, release, version bump, push, tag, publish, dependency changes, cloud, login, billing, hosted features, JSON/CI, PR comments, or verification profiles.

## Non-Goals
- No session switching, search, export, sync, hosted state, JSON/CI changes,
  release work, or broader history navigation.

## Assumptions
- The previous-artifact hint is a read-only convenience and must not change the
  current session, artifact generation, or review metadata.
- Existing open-first artifact ordering remains the source of truth.

## Likely Files or Areas
- src/commands/history.ts
- tests/commands/history.test.ts
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md
- docs/superpowers/plans/2026-06-21-history-previous-artifact-guidance.md

## Files or Areas Not to Touch
- package version, lockfile, dependencies, release metadata, cloud/auth/billing
  code, hosted features, PR comments, verification profiles, and runtime
  .agentflight evidence files.

## Acceptance Criteria
- history latest action shows a previous artifact when the current latest session has none and an older session has an artifact.
- history remains read-only and keeps the current-session handoff next action.
- history does not show absolute repo paths.

## Verification Commands
- npm test -- tests/commands/history.test.ts
- npm run verify
- npm run format:check

## Post-Verification Gates
- npx agentloopkit@latest verify
- npx agentloopkit@latest check-gates

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Risk is low but the latest-action wording must not imply the current session
  has generated artifacts.
- Artifact paths must remain repo-relative and local-only.
- Keep the current-session handoff next action visible.

## Rollback Notes
- Revert the history latest-action fallback in src/commands/history.ts, the
  regression test in tests/commands/history.test.ts, and related docs/changelog
  notes.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
