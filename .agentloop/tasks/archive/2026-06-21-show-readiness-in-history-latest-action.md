# Show readiness in history latest action

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
agentflight history now surfaces the latest open-first action, but the top block does not show whether that latest session is ready, blocked, or not recorded.

## Desired Outcome
The top-level Latest action block includes the latest session's recorded readiness while preserving the detailed per-session rows.

## Constraints
- Keep history read-only and local-only.
- Do not add search, session switching, export modes, JSON/CI, PR comments, cloud, auth, billing, or hosted behavior.
- Do not change artifact selection rules.

## Non-Goals
- No release, version bump, tag, push, publish, or website work.

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
- latest action shows Recorded readiness for a ready latest session.
- latest action shows Recorded readiness: not recorded for a current no-artifact session.
- per-session Recorded readiness rows remain unchanged.

## Verification Commands
- npm test -- tests/commands/history.test.ts
- npm run verify
- npm run format:check
- npm pack --dry-run
- npm audit --audit-level=moderate
- npx projscan@latest doctor --format json
- npx projscan@latest preflight --mode before_commit --format json
- npx projscan@latest review --format json
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
Revert the history renderer/test/docs changes.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
