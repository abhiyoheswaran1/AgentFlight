# AgentFlight Unresolved Verification Failures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make AgentFlight review surfaces distinguish unresolved failed verification from historical failed runs that later passed.

**Architecture:** Keep verification run evidence immutable. Add exact-command unresolved-failure summarization in `src/core/verification.ts`, reuse it from Review Intelligence, and display concise unresolved/resolved counts in status, report, replay, and handoff.

**Tech Stack:** TypeScript, Vitest, local AgentFlight session JSON.

---

### Task 1: Red Tests

**Files:**

- Modify: `tests/core/verification.test.ts`
- Modify: `tests/commands/evidence-output.test.ts`
- Modify: `tests/renderers/markdown-report.test.ts`
- Modify: `tests/renderers/html-replay.test.ts`

- [x] Add a core verification-summary test where a failed command later passes and expect `unresolvedFailed: 0`, `resolvedFailed: 1`, no failed-command gap, and ready readiness when configured proof is otherwise satisfied.
- [x] Add a command-level test that status/report/replay/handoff show no unresolved failed verification remains while preserving historical failed run evidence.
- [x] Keep blocked-handoff tests asserting unresolved failures still show stderr-preferred excerpts and non-zero handoff exit.
- [x] Run focused tests and confirm the new expectations fail before implementation.

### Task 2: Shared Summary

**Files:**

- Modify: `src/core/verification.ts`
- Modify: `src/core/review-intelligence.ts`

- [x] Export `getUnresolvedFailedRuns()` from verification core.
- [x] Add `unresolvedFailed`, `resolvedFailed`, and `unresolvedFailedRuns` to `VerificationSummary`.
- [x] Make verification gaps/readiness use unresolved failures instead of all historical failures.
- [x] Import the shared helper in Review Intelligence and remove the private duplicate helper.

### Task 3: Review Surface Copy

**Files:**

- Modify: `src/commands/status.ts`
- Modify: `src/commands/handoff.ts`
- Modify: `src/renderers/markdown-report.ts`
- Modify: `src/renderers/html-replay.ts`
- Modify: `src/commands/report.ts`
- Modify: `src/commands/replay.ts`

- [x] Show `0 unresolved` or historical-failure context near verification counts when resolved failures exist.
- [x] Keep failed excerpts visible only for unresolved failed verification in handoff.
- [x] Keep report/replay verification ledgers unchanged so historical failed evidence remains inspectable.

### Task 4: Verification And Handoff

**Files:**

- Update task/handoff artifacts only through AgentLoopKit and AgentFlight commands.

- [x] Run focused tests: `npm test -- tests/core/verification.test.ts tests/core/review-intelligence.test.ts tests/commands/evidence-output.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts`.
- [x] Run full checks: `npm run verify`, `npm run format:check`, `npm pack --dry-run`, `npm audit --audit-level=moderate`.
- [x] Run product checks: `npx projscan@latest doctor --format json`, `npx projscan@latest preflight --mode before_commit --format json`, `npx agentloopkit@latest verify`.
- [x] Dogfood built CLI with `status`, `report`, `replay`, and `handoff` on a session with resolved historical failures.
- [ ] Complete and archive the AgentLoop task, then commit only intended files.
