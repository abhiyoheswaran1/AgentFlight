# Keep AgentFlight start off heavy ProjScan baseline

- Created date: 2026-06-20
- Task type: bugfix
- Status: done

## Problem Statement
agentflight start still takes too long because it runs the heavy optional projscan start baseline on the startup path. Dogfood measured projscan start around 16 seconds and agentflight start around 18 seconds even after bounded warning output.

## Desired Outcome
agentflight start should inspect ProjScan availability and record AgentLoopKit linkage without running the heavy ProjScan baseline during startup.

## Constraints
- No new CLI flags or product features.
- No release, version bump, tag, publish, or push.
- Keep ProjScan available for explicit user-run workflows.

## Non-Goals
- Do not remove the ProjScan adapter or ProjScan report tooling support.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/start.ts
- tests/commands/workflow.test.ts
- CHANGELOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Start tool inspection no longer calls the heavy ProjScan baseline path.
- Start still reports ProjScan availability and AgentLoopKit linkage.
- Built CLI start smoke completes faster and does not create duplicate AgentLoop tasks.

## Verification Commands
- npm test -- tests/commands/workflow.test.ts tests/adapters/projscan.test.ts
- npm run verify
- npm run format:check
- npx projscan@latest review --format json
- npx projscan@latest preflight --mode before_commit --format json
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
Revert start tool inspection, tests, changelog, and task evidence for this loop.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
