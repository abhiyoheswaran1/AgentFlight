# Point clean status to latest artifacts

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
After a committed session, agentflight status reports a clean worktree and only tells the user to start a new session, even though recent local report/replay/handoff artifacts are available through history.

## Desired Outcome
Clean-worktree status points users to agentflight history --limit 1 to reopen the latest local artifacts, while still telling them to start a new session for new work.

## Constraints
- Keep status read-only and local-only.
- Do not generate artifacts from status.
- Do not add search, session switching, export modes, JSON/CI, PR comments, cloud, auth, billing, or hosted behavior.

## Non-Goals
- No release, version bump, tag, push, publish, or website work.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/status.ts
- tests/commands/workflow.test.ts
- tests/commands/evidence-output.test.ts
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- clean-worktree status includes agentflight history --limit 1 in the next action.
- non-clean status next-action behavior remains unchanged.
- JSON status output remains unchanged except existing fields.

## Verification Commands
- npm test -- tests/commands/workflow.test.ts tests/commands/evidence-output.test.ts
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
Revert the status renderer/test/docs changes.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
