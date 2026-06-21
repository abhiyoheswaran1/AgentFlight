# Doctor Path-Safe Root Output Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop `agentflight doctor` from printing the absolute repository root in shareable terminal output.

**Architecture:** Keep repository-root detection unchanged. Change the successful doctor check message from the raw path to path-safe wording, while preserving the missing-root error message.

**Tech Stack:** TypeScript, Vitest, AgentFlight doctor command.

---

### Task 1: Red Tests

**Files:**

- Modify: `tests/core/doctor.test.ts`
- Modify: `tests/commands/workflow.test.ts`

- [x] Add a core doctor assertion that the repository-root OK check says `Repository root detected.` instead of the absolute path.
- [x] Add a command workflow assertion that doctor output does not contain the temp repo root.
- [x] Keep the existing missing-root error behavior unchanged.
- [x] Run `npm test -- tests/core/doctor.test.ts tests/commands/workflow.test.ts` and confirm the new assertions fail.

### Task 2: Renderer Message

**Files:**

- Modify: `src/core/doctor.ts`

- [x] Change only the successful `repository root` check message.
- [x] Leave `input.repoRoot` and command-side repository-root detection unchanged.
- [x] Run focused tests and confirm they pass.

### Task 3: Docs, Smoke, And Handoff

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] Record the privacy/DX rationale and verification evidence.
- [x] Run `npm run verify`, `npm run format:check`, package/audit, ProjScan, and AgentLoopKit checks.
- [x] Dogfood built `agentflight doctor` and confirm the local absolute root path is absent.
- [x] Archive the AgentLoop task and commit only intended files.
