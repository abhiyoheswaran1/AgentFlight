# Add local review receipts and handoff staleness

- Created date: 2026-06-24
- Task type: feature
- Status: done

## Problem Statement
AgentFlight can say work is ready for review, but it cannot record a local reviewer receipt or tell whether a handoff became stale after acceptance.

## Desired Outcome
AgentFlight records source-free local review receipts, reports whether the latest receipt is current or stale, integrates stale receipt guidance into status/handoff/report/replay/resume/history, and keeps repo calibration deterministic.

## Constraints
- Keep everything local-first and source-free.
- Do not add cloud, identity, signatures, PR comments, JSON/CI distribution, hosted behavior, or release automation.
- Do not version bump, commit, tag, push, publish, or release.
- Preserve existing Trust Delta worktree changes.

## Non-Goals
- No new hosted review system or cryptographic approval.
- No release in this task.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/types/index.ts
- src/core/session.ts
- src/core/review-intelligence.ts
- src/core/output.ts
- src/commands/handoff.ts
- src/commands/status.ts
- src/commands/history.ts
- src/renderers/markdown-report.ts
- src/renderers/html-replay.ts
- src/renderers/resume-prompt.ts
- tests/
- README.md
- docs/development/project-review-contract.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- A local review receipt can be recorded from handoff without corrupting proof evidence.
- Status, handoff, report, replay, resume, and history show current vs stale receipt state.
- Changed files after receipt make the receipt stale and add review queue guidance.
- Repo calibration can prefer accepted receipts over ready-only handoffs without blocking older data.
- Tests cover receipt recording, staleness, output rendering, and calibration behavior.

## Verification Commands
- npm test -- tests/core/review-intelligence.test.ts tests/core/session.test.ts tests/core/proof-calibration.test.ts tests/commands/workflow.test.ts tests/commands/history.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts
- npm run verify
- npm run format:check
- npx projscan@latest doctor --format json
- npx projscan@latest preflight --mode before_commit --format json
- npx agentloopkit@latest verify

## Post-Verification Gates
- No post-verification gate recorded. Use this for commands that need a fresh AgentLoop verification report.

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- This touches shared review surfaces and session metadata, so renderer/test coverage needs to stay broad.

## Rollback Notes
Revert receipt model/output changes and docs; no data migration is required because receipts are optional session metadata.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
