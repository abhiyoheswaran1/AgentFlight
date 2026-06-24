# Add Trust Delta review guidance

- Created date: 2026-06-24
- Task type: feature
- Status: done

## Problem Statement
AgentFlight tells reviewers what proof exists and what the repo requires, but it does not yet summarize what changed the trust state since the last known-good point or verification snapshot.

## Desired Outcome
Status, handoff, report, replay, and resume show a concise source-free Trust Delta and sharper review queue derived from existing changed-file, proof freshness, failed proof, missing proof, manual review, and repo-calibration signals.

## Constraints
- Keep all analysis local-first and source-free: use paths, categories, proof metadata, freshness snapshots, and existing session metadata only.
- Reuse existing Review Contract, Project Review Contract, proof freshness, and repo-calibration data paths where possible.
- Keep behavior deterministic and explainable; do not call external services or models.

## Non-Goals
- Do not add PR comments, JSON/CI contracts, hosted dashboards, cloud sync, accounts, billing, or new distribution channels.
- Do not release, tag, publish, or bump version.
- Do not add dependencies unless an existing repo tool requires it.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/core/review-intelligence.ts
- src/core/review-contract.ts
- src/commands/status.ts
- src/commands/handoff.ts
- src/renderers/markdown-report.ts
- src/renderers/html-replay.ts
- src/renderers/resume-prompt.ts
- tests/core/review-intelligence.test.ts
- tests/renderers/markdown-report.test.ts
- tests/renderers/html-replay.test.ts
- tests/renderers/resume-prompt.test.ts
- README.md
- docs/development/project-review-contract.md

## Files or Areas Not to Touch
- package.json
- package-lock.json

## Acceptance Criteria
- Trust Delta highlights stale proof files/categories, failed proof, missing proof, manual-review-only changes, and repo-calibration under-proofing when present.
- Review queue tells the reviewer which proof to rerun and which files/manual checks to inspect first, without adding a new command.
- Rendered surfaces stay concise and consistent across status, handoff, Markdown report, HTML replay, and resume.
- Existing raw stdout/stderr evidence remains untouched.
- Tests cover stale proof, failed proof, missing proof, docs-only/manual review, and rendered output.

## Verification Commands
- npm test -- tests/core/review-intelligence.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts
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
- Re-check protected areas before changing migrations, auth, secrets, billing, deployment, or public APIs.

## Rollback Notes
Revert the Trust Delta source, renderer, test, and documentation changes; no migration or dependency rollback is expected.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
