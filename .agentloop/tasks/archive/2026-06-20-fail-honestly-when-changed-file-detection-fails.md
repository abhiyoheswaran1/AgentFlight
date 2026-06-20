# Fail honestly when changed-file detection fails

- Created date: 2026-06-20
- Task type: bugfix
- Status: done

## Problem Statement
AgentFlight changed-file listing returns an empty list when git status exits non-zero. During dogfood, a concurrent status run briefly reported zero changed files while handoff later found the real diff, which can erode trust if git status cannot be read. The same bug pass also showed `agentflight start` can wait too long on the optional ProjScan baseline.

## Desired Outcome
Status/report/replay/resume/handoff should not silently treat a git status failure as no changed files. The shared changed-file helper should surface an actionable error while preserving explicit changedFiles test overrides. Optional ProjScan startup work should stay bounded so `agentflight start` remains responsive even when ProjScan is busy.

## Constraints
- No new product features.
- No release, version bump, tag, publish, or push.
- Keep behavior local-only and avoid network calls.

## Non-Goals
- Do not add JSON/CI, named profiles, export modes, PR comments, hosted features, or broad workspace hygiene.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/core/git.ts
- src/adapters/projscan.ts
- src/commands/status.ts
- tests/adapters/projscan.test.ts
- tests/core/git.test.ts
- tests/commands/evidence-output.test.ts
- CHANGELOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- listChangedFiles throws an actionable error when git status fails instead of returning [].
- status propagates the changed-file detection error instead of rendering a false zero-change status.
- explicit changedFiles overrides still work for tests and command composition.
- getGitInfo remains tolerant enough for start/init session metadata if appropriate, or has explicit tests for any changed behavior.
- optional ProjScan baseline startup work uses a short timeout budget.

## Verification Commands
- npm test -- tests/core/git.test.ts tests/commands/evidence-output.test.ts tests/adapters/projscan.test.ts
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
Revert the git helper, command tests, and changelog edits for this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
