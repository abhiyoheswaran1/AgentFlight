# Build proof freshness review contract

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
AgentFlight currently records verification evidence and readiness, but it does not prove whether that evidence still applies after later file changes.

## Desired Outcome
AgentFlight can tell reviewers whether verification proof is current, stale, missing, or failed for the current changed files, and surfaces that contract consistently in status, handoff, report, replay, resume, and history without cloud or CI scope.

## Constraints
- Do not release, tag, publish, or bump version unless the user explicitly approves later.
- Local-first only: no cloud, telemetry, login, billing, database, hosted features, or automatic PR comments.
- Use TDD for each behavior phase and run bug, security, and performance passes after each phase.
- Keep public positioning on coding agent sessions and agentic engineering; avoid assistant-style copy.

## Non-Goals
- Do not add PR comments, JSON/CI expansion, export modes, cloud, GitHub App, or paid feature gates.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/core/verification.ts
- src/core/session.ts
- src/core/review-intelligence.ts
- src/core/changed-files.ts
- src/core/output.ts
- src/commands/status.ts
- src/commands/handoff.ts
- src/commands/history.ts
- src/renderers/markdown-report.ts
- src/renderers/html-replay.ts
- src/renderers/resume-prompt.ts
- tests/core/review-intelligence.test.ts
- tests/commands/evidence-output.test.ts
- tests/commands/history.test.ts
- tests/renderers/markdown-report.test.ts
- tests/renderers/html-replay.test.ts
- tests/renderers/resume-prompt.test.ts
- README.md
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Verification runs record enough local worktree fingerprint metadata to detect proof freshness without storing source contents.
- Review Intelligence distinguishes current proof, stale proof, missing proof, failed proof, and unresolved changed files.
- Status, handoff, report, replay, resume, and history expose proof freshness in concise reviewer-facing language.
- Raw stdout/stderr evidence remains intact and local-only.
- Existing sessions without proof-freshness metadata remain readable.
- No release is performed.

## Verification Commands
- npm test -- tests/core/review-intelligence.test.ts tests/commands/evidence-output.test.ts tests/commands/history.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts
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
Revert the proof-freshness source, tests, docs, task, and generated handoff evidence. Do not move any release tags.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
