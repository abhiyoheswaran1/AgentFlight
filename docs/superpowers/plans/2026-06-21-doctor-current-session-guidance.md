# Doctor Current Session Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `agentflight doctor` treat a missing current session as first-run guidance instead of a warning.

**Architecture:** Keep doctor evaluation centralized in `src/core/doctor.ts`. Change only the `current session` check for the missing-session case from warning to OK with an actionable start-session message, preserving all other setup warnings and errors.

**Tech Stack:** TypeScript, Vitest, AgentFlight doctor command, AgentLoopKit task evidence.

---

### Task 1: Red Tests

**Files:**

- Modify: `tests/core/doctor.test.ts`
- Modify: `tests/commands/workflow.test.ts`

- [x] Add a core doctor test where every setup check passes except `currentSessionExists: false`; expect overall `ok`, a `current session` check with status `ok`, and guidance containing `Run agentflight start --task`.
- [x] Add a command workflow test that initializes a temp repo with proof scripts, runs doctor before starting a session, and expects `Overall: OK`, `OK current session`, and start-session guidance.
- [x] Run `npm test -- tests/core/doctor.test.ts tests/commands/workflow.test.ts` and confirm the new assertions fail because doctor still warns on missing current session.

### Task 2: Minimal Implementation

**Files:**

- Modify: `src/core/doctor.ts`

- [x] Change the missing current-session branch from `warning(...)` to `ok(...)`.
- [x] Keep the existing active-session OK message unchanged.
- [x] Keep commands that require a session unchanged.
- [x] Run `npm test -- tests/core/doctor.test.ts tests/commands/workflow.test.ts` and confirm the focused suite passes.

### Task 3: Docs and Smoke

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`
- Modify: `docs/superpowers/plans/2026-06-21-doctor-current-session-guidance.md`

- [x] Add an unreleased changelog note describing the doctor first-run guidance fix.
- [x] Add a devlog entry with the dogfood finding, persona readout, implementation, and verification evidence.
- [x] Build the CLI, run doctor in a temp initialized repo before session start, and confirm the current-session row is OK guidance.

### Task 4: Verification, Handoff, Commit

**Files:**

- Modify: `.agentloop/tasks/2026-06-21-treat-missing-current-session-as-doctor-guidance.md`
- Create/archive: `.agentloop/handoffs/*`

- [x] Run `npm run verify`.
- [x] Run `npm run format:check`.
- [x] Run `npm pack --dry-run`.
- [x] Run `npm audit --audit-level=moderate`.
- [x] Run `npx projscan@latest doctor --format json`.
- [x] Run `npx projscan@latest preflight --mode before_commit --format json` and document any scale-only caution.
- [x] Run `npx projscan@latest review --format json` and document any scale-only block.
- [x] Run `npx agentloopkit@latest verify`.
- [x] Generate AgentFlight and AgentLoopKit handoffs, archive the task, and run gates.
