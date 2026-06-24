# Project Review Contract

- Created date: 2026-06-23
- Task type: feature
- Status: done

## Problem Statement
AgentFlight shows review claims and proof, but it does not yet let a repo define the proof standard required for different change types.

## Desired Outcome
Add a repo-specific local Project Review Contract that maps changed-file categories to required proof and manual review checks, then render required proof versus actual proof through status, handoff, report, replay, and resume without adding hosted or release behavior.

## Constraints
- Keep all behavior local-first, deterministic, and source-free where possible.
- Do not add cloud, login, billing, Pro/Team, GitHub App, PR comments, hosted features, or release/version changes.
- Preserve backwards compatibility for existing .agentflight/config.json files without projectReviewContract.
- Use TDD for behavior changes and keep renderers consistent.

## Non-Goals
- No release, publish, tag, push, or version bump.
- No model-based claim extraction or telemetry-backed learning.
- No automatic modification of user proof commands after init.

## Assumptions
- Project Review Contract can live in .agentflight/config.json as optional local project configuration.

## Likely Files or Areas
- src/core/config.ts
- src/core/review-intelligence.ts
- src/core/review-contract.ts
- src/types/index.ts
- src/renderers/markdown-report.ts
- src/renderers/html-replay.ts
- src/renderers/resume-prompt.ts
- src/commands/status.ts
- src/commands/handoff.ts
- tests/core/review-intelligence.test.ts
- tests/core/review-contract.test.ts
- tests/renderers/markdown-report.test.ts
- tests/renderers/html-replay.test.ts
- README.md
- CHANGELOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Repo config can define Project Review Contract rules by change type/category with required proof kinds and manual review checks.
- Default config includes a sensible local contract baseline for source, tests, config, auth, data, docs, CLI/public API style changes without breaking old configs.
- Review Intelligence reports required proof as current, stale, failed, missing, or manual-review pending.
- Status, handoff, report, replay, and resume surface the Project Review Contract decision path consistently.
- Required proof does not corrupt captured stdout/stderr evidence and remains source-free.
- Tests cover required proof mapping, stale proof, failed proof, manual review checks, backwards compatibility, and renderer output.

## Verification Commands
- npm test -- tests/core/review-intelligence.test.ts tests/core/review-contract.test.ts tests/core/config.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts tests/commands/workflow.test.ts
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
- This touches shared review readiness logic and all review surfaces, so regressions could make handoff misleading.
- Config schema changes must remain optional for older projects.

## Rollback Notes
Revert the Project Review Contract config/type/review-intelligence/rendering changes and docs updates.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
