# Replay Historical Failed Ledger Label Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make resolved historical failed verification rows in HTML replay read as historical evidence instead of current failures.

**Architecture:** Use existing replay `verificationSummary` only. If failed runs exist and `unresolvedFailed` is `0`, render failed ledger rows with historical text/style; otherwise keep the current failed-row treatment.

**Tech Stack:** TypeScript, Vitest, AgentFlight HTML replay renderer.

---

### Task 1: Red Tests

**Files:**

- Modify: `tests/renderers/html-replay.test.ts`

- [x] Update the resolved-failure replay test to expect a historical failed row class and `HIST` stamp.
- [x] Add or keep assertions that urgent failed-run navigation is absent for resolved failures.
- [x] Add assertions that unresolved failed replay rows still render as `FAIL` with urgent navigation.
- [x] Run `npm test -- tests/renderers/html-replay.test.ts tests/commands/evidence-output.test.ts` and confirm the new historical-row assertion fails.

### Task 2: Replay Renderer

**Files:**

- Modify: `src/renderers/html-replay.ts`

- [x] Pass `verificationSummary` into the verification ledger renderer.
- [x] Add a display-only helper that identifies historical failed rows only when all failures are resolved.
- [x] Render historical failed rows with a distinct class and `HIST` stamp.
- [x] Preserve failed excerpt escaping and raw evidence paths.
- [x] Run focused tests and confirm they pass.

### Task 3: Docs, Smoke, And Handoff

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] Record the replay ergonomics rationale and verification evidence.
- [x] Run `npm run verify`, `npm run format:check`, package/audit, ProjScan, and AgentLoopKit checks.
- [x] Dogfood built `agentflight replay` on the current session and confirm replay generation still works.
- [x] Archive the AgentLoop task and commit only intended files.
