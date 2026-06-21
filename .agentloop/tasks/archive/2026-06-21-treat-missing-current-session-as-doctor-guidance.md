# Treat missing current session as doctor guidance

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
agentflight doctor reports Warning when no current session exists, even though a freshly initialized repo can be healthy before work starts. That makes first-run setup checks feel more alarming than necessary.

## Desired Outcome
Doctor reports no current session as OK guidance to start a session, while real setup gaps and missing proof scripts remain warnings/errors.

## Constraints
- Do not change commands that require an active session.
- Do not add an info status type or JSON/CI output.
- Do not release, version bump, push, tag, or publish.

## Non-Goals
- Do not change commands that require an active session.
- Do not add a new doctor status level such as `info`.
- Do not change report, replay, resume, status, handoff, or history behavior.
- Do not add JSON/CI output, workspace hygiene automation, release steps, or version changes.

## Assumptions
- A repository can be correctly initialized and healthy before any AgentFlight session has been started.
- `agentflight doctor` is a setup-health check, so a missing current session should guide the user rather than lower the overall result on its own.
- Missing proof scripts, invalid config, unavailable tools, and unwritable paths remain legitimate warnings or errors.

## Likely Files or Areas
- `src/core/doctor.ts`
- `tests/core/doctor.test.ts`
- `tests/commands/workflow.test.ts`
- `CHANGELOG.md`
- `AGENTFLIGHT_DEVLOG.md`
- `docs/superpowers/plans/2026-06-21-doctor-current-session-guidance.md`

## Files or Areas Not to Touch
- Session-required command behavior in `src/commands/status.ts`, `src/commands/snapshot.ts`, report/replay/resume/handoff commands, and session loading.
- Built-in changed-file ignore defaults.
- Release/version files beyond normal unreleased changelog notes.

## Acceptance Criteria
- Doctor overall status can be OK when the only missing item is current session.
- Doctor still tells users how to start a session.
- Missing proof scripts still warn.

## Verification Commands
- npm test -- tests/core/doctor.test.ts tests/commands/workflow.test.ts
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
- Add focused failing doctor tests for a fully configured repo with no current session.
- Change only the current-session doctor check so the missing-session case is OK guidance.
- Keep missing proof-script warnings unchanged.
- Dogfood the built CLI in a temp repo before handoff.
- Update changelog/devlog with evidence-based notes.

## Risk Notes
- Re-check protected areas before changing migrations, auth, secrets, billing, deployment, or public APIs.

## Rollback Notes
Revert the current-session check in `src/core/doctor.ts` from OK guidance back to a warning and remove the focused tests/docs added for this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
