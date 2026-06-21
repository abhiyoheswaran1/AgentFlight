# Align clean status ledger copy with handoff path

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
Clean-worktree status now points users to the handoff packet first, but the tucked verification-details copy still says to open report/replay or JSON for the full ledger.

## Desired Outcome
Clean-worktree status copy mentions the handoff packet alongside report/replay and JSON, keeping the ready review path consistent without changing evidence storage or artifact generation.

## Constraints
- Copy alignment only.
- No new command behavior, artifact generation, release, version bump, push, tag, publish, PR comments, JSON/CI, export modes, cloud, or hosted features.

## Non-Goals
- No status layout redesign.
- No new artifact type.

## Assumptions
- Handoff is now the first review packet for ready sessions, while report/replay remain useful supporting evidence.

## Likely Files or Areas
- src/commands/status.ts
- tests/commands/evidence-output.test.ts
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md

## Files or Areas Not to Touch
- package.json
- package-lock.json
- .agentflight/evidence/**
- .agentflight/reports/**

## Acceptance Criteria
- Clean-worktree status tucked-verification copy mentions handoff/report/replay or JSON output.
- Unresolved failed verification status still keeps details visible and does not show the tucked-details copy.
- No evidence capture or artifact paths change.

## Verification Commands
- npm test -- tests/commands/evidence-output.test.ts
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
Revert the status copy, tests, and documentation notes from this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
