# Deduplicate optional tool adapter fallback

- Created date: 2026-06-20
- Task type: refactor
- Status: done

## Problem Statement
ProjScan and AgentLoopKit adapters duplicate local binary, npx latest, PATH fallback, failure summarization, and version parsing logic. This makes optional-tool behavior harder to maintain and easy to drift.

## Desired Outcome
Optional tool fallback and version parsing live in one shared adapter helper while existing ProjScan and AgentLoopKit behavior remains unchanged.

## Constraints
- Behavior-preserving refactor only; do not add product features or change CLI output intentionally.
- Do not change dependencies, release metadata, versions, or external tool projects.
- Keep tests focused on existing adapter behavior and helper behavior.

## Non-Goals
- Do not optimize startup behavior in this refactor beyond removing duplicated code.
- Do not release, push, tag, or publish.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/adapters/agentloopkit.ts
- src/adapters/projscan.ts
- src/adapters/tool-runner.ts
- tests/adapters/agentloopkit.test.ts
- tests/adapters/projscan.test.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- ProjScan and AgentLoopKit adapters use the shared fallback helper.
- Existing local-binary, npx, PATH fallback ordering remains covered by tests.
- Failure summaries and version normalization remain equivalent.
- Full verification passes after the refactor.

## Verification Commands
- npm test -- tests/adapters/agentloopkit.test.ts tests/adapters/projscan.test.ts
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
- Shared helper regression could make optional tools appear unavailable or change fallback order.

## Rollback Notes
Revert the adapter helper and adapter import changes.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
