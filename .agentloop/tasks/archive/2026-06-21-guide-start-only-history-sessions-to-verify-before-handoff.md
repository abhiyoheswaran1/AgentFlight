# Guide start-only history sessions to verify before handoff

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
When the current latest session has no local artifacts, agentflight history says Next: run agentflight handoff even if no verification has been recorded, which skips the proof step taught by the handoff-first workflow.

## Desired Outcome
Current latest sessions with no artifacts and no verification say to run agentflight verify, then agentflight handoff; sessions that already have verification but no handoff/report/replay artifact still say to run agentflight handoff.

## Constraints
- Keep this to history guidance only.
- Do not change handoff, verify, report, replay, resume, session storage, artifact generation, release, version bump, push, tag, publish, PR comments, JSON/CI, export modes, cloud, login, billing, or hosted features.

## Non-Goals
- No new history modes or session switching.
- No verification command detection changes.

## Assumptions
- A current start-only session should teach the proof-before-handoff workflow when no verification exists.

## Likely Files or Areas
- src/commands/history.ts
- tests/commands/history.test.ts
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md

## Files or Areas Not to Touch
- package.json
- package-lock.json
- .agentflight/evidence/**
- .agentflight/reports/**

## Acceptance Criteria
- Current latest session with no artifacts and no verification shows Next: run agentflight verify, then agentflight handoff.
- Current latest session with verification but no artifacts still shows Next: run agentflight handoff.
- Previous artifact fallback remains visible for current start-only sessions.

## Verification Commands
- npm test -- tests/commands/history.test.ts
- npm run verify
- npm run format:check
- npm pack --dry-run
- npx projscan@latest doctor --format json
- npx projscan@latest preflight --mode before_commit --format json
- npx projscan@latest review --format json
- npx agentloopkit@latest verify

## Post-Verification Gates
- npx agentloopkit@latest check-gates

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Re-check protected areas before changing migrations, auth, secrets, billing, deployment, or public APIs.

## Rollback Notes
Revert the history next-action guidance, tests, and documentation notes from this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
