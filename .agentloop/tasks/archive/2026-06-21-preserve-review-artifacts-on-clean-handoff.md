# Preserve review artifacts on clean handoff

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
Running agentflight handoff after a completed session is committed can regenerate report/replay/resume with zero changed files and overwrite the useful review artifacts for that session.

## Desired Outcome
Clean-worktree handoff remains informational and successful, but existing session review artifacts are preserved instead of being overwritten with empty clean-state artifacts.

## Constraints
- Keep behavior local-only and deterministic.
- Do not add product features, release, version bump, push, tag, or publish.
- Keep scope to clean-worktree handoff artifact preservation.

## Non-Goals
- Do not add export modes, PR comments, JSON/CI, cloud, login, billing, or hosted features.
- Do not change readiness labels broadly.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/handoff.ts
- tests/commands/evidence-output.test.ts
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- A clean-worktree handoff after an existing review handoff does not overwrite the existing report, replay, resume, or session handoff artifacts.
- Clean-worktree handoff still exits 0 and can update the current handoff pointer.
- If no prior session artifacts exist, handoff can still generate the normal clean-state artifacts.

## Verification Commands
- npm test -- tests/commands/evidence-output.test.ts
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
- Skipping artifact regeneration must only apply when clean_worktree and existing session-specific artifacts are already present.

## Rollback Notes
Revert the handoff artifact preservation changes and tests.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
