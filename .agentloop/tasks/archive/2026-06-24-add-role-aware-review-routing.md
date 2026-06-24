# Add role-aware review routing

- Created date: 2026-06-24
- Task type: feature
- Status: done

## Problem Statement
AgentFlight can explain proof state, trust delta, review queue, and review receipts, but reviewers still get one universal path. Different engineering roles need to know what they specifically must inspect before trusting an agentic engineering handoff.

## Desired Outcome
Status, handoff, report, replay, resume, and JSON surfaces show source-free role-aware review routing derived from existing local proof, changed-file, contract, trust-delta, receipt, and calibration signals.

## Constraints
- Keep the feature local-first, deterministic, and source-free.
- Thread the improvement through existing commands rather than adding a new command.
- No cloud, login, telemetry, PR comments, hosted dashboards, JSON/CI export mode, dependency changes, version bump, commit, tag, push, publish, or release.

## Non-Goals
- Do not classify source contents or call a model.
- Do not add identity/signature approval semantics.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/types/index.ts
- src/core/review-intelligence.ts
- src/core/output.ts
- src/commands/status.ts
- src/commands/handoff.ts
- src/renderers/markdown-report.ts
- src/renderers/html-replay.ts
- src/renderers/resume-prompt.ts
- src/commands/resume.ts
- tests/core/review-intelligence.test.ts
- tests/renderers/markdown-report.test.ts
- tests/renderers/html-replay.test.ts
- tests/renderers/resume-prompt.test.ts
- README.md
- CHANGELOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Review routing is derived from source-free metadata and includes maintainer, verification, security, docs/DX, and release-oriented review paths when relevant.
- Review routing renders consistently in status, handoff, Markdown report, HTML replay, resume, and status JSON.
- Tests cover role routing classification, stale/failed proof behavior, security-sensitive categories, docs changes, release/dependency/config signals, and renderer output.
- Bug, security, and performance passes are run after implementation and concrete findings are fixed.

## Verification Commands
- npm test -- tests/core/review-intelligence.test.ts tests/core/output.test.ts tests/commands/workflow.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts
- npm run verify
- npm run format:check
- npm audit --audit-level=moderate
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
- The release candidate already has a broad diff; keep this as a small extension of the existing Review Queue and avoid adding a new workflow.

## Rollback Notes
Revert role-routing types, derivation, renderers, tests, and docs while keeping existing Trust Delta and Review Receipt work intact.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
