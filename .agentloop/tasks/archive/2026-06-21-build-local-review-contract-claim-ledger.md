# Build local Review Contract claim ledger

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
AgentFlight shows proof freshness and readiness, but reviewers still have to infer which explicit claims are supported, stale, failed, unsupported, or only manually reviewable.

## Desired Outcome
AgentFlight generates a deterministic local Review Contract that lists review claims, maps each claim to proof or gaps, and renders the contract across status, report, replay, resume, and handoff without cloud, telemetry, PR comments, or CI JSON.

## Constraints
- Keep the feature deterministic and local-only.
- Do not add LLM or model-based claim extraction.
- Do not add PR comments, CI JSON, hosted features, login, billing, database, cloud, or telemetry.
- Do not release this work unless explicitly asked later.

## Non-Goals
- ProjScan-enriched ranking.
- Named verification profiles.
- Export modes.
- Website changes.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/core/review-contract.ts
- src/core/review-intelligence.ts
- src/types/index.ts
- src/commands/status.ts
- src/commands/handoff.ts
- src/renderers/markdown-report.ts
- src/renderers/html-replay.ts
- src/renderers/resume-prompt.ts
- tests/core/review-contract.test.ts
- tests/commands/evidence-output.test.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Review Contract claims are deterministic and source-free.
- Claims show supported, needs review, unsupported, failed, stale, not testable, or unknown state.
- Status, report, replay, resume, and handoff expose the Review Contract compactly.
- Raw stdout/stderr evidence and proof snapshots remain intact.
- Tests cover supported, stale, failed, missing, and not-testable claims.
- Bug, security, performance, and docs passes are completed.

## Verification Commands
- npm test -- tests/core/review-contract.test.ts tests/core/review-intelligence.test.ts tests/commands/evidence-output.test.ts
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
Revert the Review Contract source, renderer, test, and docs changes as one feature commit if needed.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
