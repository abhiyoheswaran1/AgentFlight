# AgentFlight Init Tool Availability Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or a stricter local TDD loop to implement this plan task-by-task.

**Goal:** Make `agentflight init` report ProjScan and AgentLoopKit availability consistently with `start`, reports, and doctor.

**Architecture:** Keep core config initialization responsible for safe file creation. Let the command layer inspect or accept injected `ToolAdapterResult` values, then render with the shared compact formatter.

**Tech Stack:** TypeScript, Vitest, AgentFlight tool adapters.

---

### Task 1: Red Tests

**Files:**

- Modify: `tests/commands/workflow.test.ts`

- [x] Inject available ProjScan and AgentLoopKit results into `runInitCommand`.
- [x] Assert init output shows available versions without requiring repo marker files.
- [x] Inject unavailable tool results.
- [x] Assert init output shows the same concise follow-up guidance as other surfaces.
- [x] Run `npm test -- tests/commands/workflow.test.ts tests/core/config.test.ts` and confirm the assertions fail.

### Task 2: Init Tool Reporting

**Files:**

- Modify: `src/commands/init.ts`

- [x] Add optional injected tool results for deterministic tests.
- [x] Inspect ProjScan and AgentLoopKit CLIs when injection is absent.
- [x] Use the shared compact tool formatter.
- [x] Keep AgentLoopKit init inspection lightweight by skipping doctor.

### Task 3: Verification And Handoff

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] Run targeted tests: `npm test -- tests/commands/workflow.test.ts tests/core/config.test.ts`.
- [x] Run full checks: `npm run verify`, `npm run format:check`, `npm pack --dry-run`, `npm audit --audit-level=moderate`.
- [x] Run product checks: `npx projscan@latest doctor --format json`, `npx projscan@latest preflight --mode before_commit --format json`, `npx agentloopkit@latest verify`.
- [x] Dogfood built `agentflight init` in a temp repo and confirm available tool output is consistent.
- [ ] Complete and archive the AgentLoop task, then commit only intended files.
