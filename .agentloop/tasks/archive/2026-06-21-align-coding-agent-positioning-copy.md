# Align coding agent positioning copy

- Created date: 2026-06-21
- Task type: docs
- Status: done

## Problem Statement
Current public/runtime copy still says AI coding sessions or AI coding agents, while product positioning should use coding agent sessions and agentic engineering language instead.

## Desired Outcome
Current public surfaces and CLI/package descriptions use coding agent sessions or agentic engineering phrasing, with tests updated for CLI copy.

## Constraints
- No product behavior changes beyond user-facing copy.
- Do not version bump, release, tag, push, or publish.
- Do not rewrite historical task contracts or devlog evidence unless needed for current public copy.

## Non-Goals
- No website deployment.
- No feature work.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/cli.ts
- tests/cli-entrypoint.test.ts
- package.json
- README.md
- PRODUCT.md
- docs/development/product-direction.md
- docs/marketing/agentflight-v0.6.0-website-update-prompt.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- CLI description says local-first review layer for coding agent sessions.
- README/package/current product docs avoid AI coding positioning phrasing.
- Agentic engineering may be used where broader product framing benefits from it.

## Verification Commands
- npm test -- tests/cli-entrypoint.test.ts
- npm run verify
- npm run format:check
- npm pack --dry-run

## Post-Verification Gates
- npx projscan@latest doctor --format json
- npx projscan@latest preflight --mode before_commit --format json
- npx agentloopkit@latest verify

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Copy-only changes can still affect package metadata and CLI help expectations.

## Rollback Notes
Revert copy, package metadata, and test changes for this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
