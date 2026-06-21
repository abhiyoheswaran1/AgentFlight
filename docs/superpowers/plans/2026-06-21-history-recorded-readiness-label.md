# History Recorded Readiness Label Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `agentflight history` label stored review metadata as recorded readiness rather than live readiness.

**Architecture:** Keep history read-only and leave session metadata unchanged. Change only the command renderer label and tests/docs that describe the line.

**Tech Stack:** TypeScript, Vitest, AgentFlight history command.

---

### Task 1: Red Tests

**Files:**

- Modify: `tests/commands/history.test.ts`

- [x] Update the history fixture assertions to expect `Recorded readiness: Ready for review (risk medium, 1 changed file)`.
- [x] Update the older-session assertion to expect `Recorded readiness: not recorded`.
- [x] Keep existing `Open first:` and artifact path assertions unchanged.
- [x] Run `npm test -- tests/commands/history.test.ts tests/core/session.test.ts` and confirm the new assertions fail.

### Task 2: Renderer Label

**Files:**

- Modify: `src/commands/history.ts`

- [x] Change the rendered label from `Readiness:` to `Recorded readiness:`.
- [x] Do not change session summary parsing, artifact selection, or readiness state logic.
- [x] Run the focused tests and confirm they pass.

### Task 3: Docs, Smoke, And Handoff

**Files:**

- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] Update user-facing history wording where needed.
- [x] Run `npm run verify`, `npm run format:check`, package/audit, ProjScan, and AgentLoopKit checks.
- [x] Dogfood the built CLI with `agentflight history --limit 2`.
- [x] Archive the AgentLoop task and commit only intended files.
