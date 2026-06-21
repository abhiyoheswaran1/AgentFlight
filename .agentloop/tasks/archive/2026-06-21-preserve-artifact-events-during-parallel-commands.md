# Preserve artifact events during parallel commands

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
Dogfooding report/resume/doctor/history in parallel showed report_generated metadata could be lost because report/replay/resume persist stale session snapshots instead of merging event updates.

## Desired Outcome
Parallel report, replay, and resume commands preserve each artifact event in the current session while keeping generated artifact content and paths unchanged.

## Constraints
- No new commands, no UI redesign, no release/version changes, no broad session rewrite.

## Non-Goals
- No artifact format redesign.
- No new commands or flags.
- No broad session storage rewrite.
- No release, version bump, tag, push, or publish.

## Assumptions
- Artifact commands can be run concurrently by users or agents during review.
- Session event persistence should merge with the latest saved session, as verification and doctor event recording already do.
- Artifact contents may be rendered from the command's local snapshot; the persistence bug is losing events, not rendering.

## Likely Files or Areas
- `src/commands/report.ts`
- `src/commands/replay.ts`
- `src/commands/resume.ts`
- `tests/commands/evidence-output.test.ts`
- `CHANGELOG.md`
- `AGENTFLIGHT_DEVLOG.md`
- `docs/superpowers/plans/2026-06-21-parallel-artifact-event-preservation.md`

## Files or Areas Not to Touch
- Verification run reservation/merge behavior.
- HTML/Markdown/resume render layout.
- Release/version files.

## Acceptance Criteria
- Concurrent report/replay/resume commands leave report_generated, replay_generated, and resume_generated events in session history.
- Generated report/replay/resume artifacts still render successfully.

## Verification Commands
- npm test -- tests/commands/evidence-output.test.ts tests/core/session.test.ts
- npm run verify
- npm run format:check

## Post-Verification Gates
- npm pack --dry-run
- npm audit --audit-level=moderate
- npx projscan@latest doctor --format json
- npx projscan@latest preflight --mode before_commit --format json
- npx projscan@latest review --format json
- npx agentloopkit@latest verify
- agentloop check-gates after handoff

## Implementation Plan
- Add a failing concurrent report/replay/resume test that expects all three artifact events to persist.
- Replace stale `saveSession(addSessionEvent(...))` persistence with locked `appendSessionEvent(...)`.
- Keep artifact rendering and output paths unchanged.

## Risk Notes
- Re-check protected areas before changing migrations, auth, secrets, billing, deployment, or public APIs.

## Rollback Notes
Restore report/replay/resume to saving their locally updated session snapshots and remove the focused concurrent artifact-event regression test/docs.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
