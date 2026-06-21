# Prefer handoff packet for ready review artifacts

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
Ready sessions have a generated handoff packet, but discovery surfaces still say Open first: replay, which works against the handoff golden path and makes users choose between artifacts.

## Desired Outcome
Ready-session handoff, status, and history surfaces prefer the local handoff packet as the first artifact to open, while blocked or incomplete sessions still point to the report/fix path.

## Constraints
- Keep this as artifact preference and copy alignment only.
- Preserve report, replay, and resume artifact generation and paths.
- Keep blocked and needs-verification paths report-first.
- No release, version bump, push, tag, publish, cloud, PR comments, JSON/CI, export modes, or named profiles.

## Non-Goals
- No replay navigation redesign.
- No new artifact type.
- No session switching or export workflow.

## Assumptions
- The handoff packet is now the local end-of-session review packet; replay remains available for chronological inspection.

## Likely Files or Areas
- src/core/artifacts.ts
- src/commands/handoff.ts
- tests/commands/history.test.ts
- tests/commands/evidence-output.test.ts
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md
- docs/development/product-direction.md

## Files or Areas Not to Touch
- package.json
- package-lock.json
- .agentflight/evidence/**
- .agentflight/reports/**

## Acceptance Criteria
- Ready-session Open first lines prefer handoff when a handoff artifact exists.
- Blocked or needs-verification sessions still prefer report.
- Report and replay remain listed in artifacts and available for deeper inspection.
- Clean-worktree status after a ready handoff points back to the handoff packet.
- History latest action and ready session entries point to the handoff packet.

## Verification Commands
- npm test -- tests/commands/history.test.ts tests/commands/evidence-output.test.ts
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
Revert the artifact preference change, tests, and documentation notes from this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
