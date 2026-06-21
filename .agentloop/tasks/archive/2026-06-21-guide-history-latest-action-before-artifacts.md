# Guide history latest action before artifacts

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
When the latest session is current but no handoff/report/replay exists yet, agentflight history now surfaces Latest action with Open first: none yet, which is honest but not actionable.

## Desired Outcome
For a current latest session without artifacts, history keeps Open first: none yet and adds the next local action to run agentflight handoff.

## Constraints
- Keep history read-only and local-only.
- Do not generate artifacts from history.
- Do not add search, session switching, export modes, JSON/CI, PR comments, cloud, auth, billing, or hosted behavior.

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
- history output shows Next: run agentflight handoff in the top-level Latest action only when the newest session is the current session and no open-first artifact exists.
- sessions with existing open-first artifacts keep the current top-level Latest action output without extra next-action noise.
- empty history output remains unchanged.

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
