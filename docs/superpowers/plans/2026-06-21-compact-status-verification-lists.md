# Compact Status Verification Lists Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or a stricter local TDD loop to implement this plan task-by-task.

**Goal:** Keep `agentflight status` scannable on long sessions without reducing stored evidence.

**Architecture:** Compact only the terminal formatter in `status`; keep JSON and session verification runs complete.

**Tech Stack:** TypeScript, Vitest, AgentFlight status command.

---

### Task 1: Red Tests

**Files:**

- Modify: `tests/commands/evidence-output.test.ts`

- [x] Add status text coverage for many verification runs.
- [x] Assert the terminal list shows a recent bounded subset and an omitted-run count.
- [x] Assert JSON status still includes every verification run.
- [x] Assert raw evidence paths/content remain present.
- [x] Run `npm test -- tests/commands/evidence-output.test.ts` and confirm the new assertions fail.

### Task 2: Status Formatter

**Files:**

- Modify: `src/commands/status.ts`

- [x] Add a small terminal-only display limit for verification runs.
- [x] Show the newest runs when the list is compacted.
- [x] Add an explicit note that earlier runs remain in report/replay and JSON.

### Task 3: Verification And Handoff

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] Run targeted tests.
- [x] Run full checks and product checks.
- [x] Dogfood `agentflight status` on a long local session.
- [x] Complete and archive the AgentLoop task, then commit only intended files.
