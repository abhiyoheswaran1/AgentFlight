# AgentFlight Resume Resolved Failure Wording Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `agentflight resume` describe resolved historical verification failures with the same wording used by status, report, replay, and handoff.

**Architecture:** Keep the resume renderer unchanged. Update `runResumeCommand()` to use the existing shared verification count helper so the command surface receives the same unresolved/resolved summary as the other review surfaces.

**Tech Stack:** TypeScript, Vitest, AgentFlight local session evidence.

---

### Task 1: Red Test

**Files:**

- Modify: `tests/commands/evidence-output.test.ts`

- [x] Add resume assertions to the existing resolved-failure fixture so it expects `1 passed, 1 failed (0 unresolved, 1 resolved)`.
- [x] Assert the resume output does not imply an unresolved failed run when the later matching command passed.
- [x] Run `npm test -- tests/commands/evidence-output.test.ts tests/core/verification.test.ts` and confirm the new assertion fails.

### Task 2: Resume Wording

**Files:**

- Modify: `src/commands/resume.ts`

- [x] Import `formatVerificationCountLine` from `src/core/output.ts`.
- [x] Replace the manual `${passed} passed, ${failed} failed` string with the shared helper.
- [x] Preserve existing resume renderer input shape and captured verification evidence.

### Task 3: Verification And Handoff

**Files:**

- Update task/handoff artifacts only through AgentLoopKit and AgentFlight commands.

- [x] Run focused tests: `npm test -- tests/commands/evidence-output.test.ts tests/core/verification.test.ts`.
- [x] Run full checks: `npm run verify`, `npm run format:check`, `npm pack --dry-run`, `npm audit --audit-level=moderate`.
- [x] Run product checks: `npx projscan@latest doctor --format json`, `npx projscan@latest preflight --mode before_commit --format json`, `npx agentloopkit@latest verify`.
- [x] Dogfood `agentflight resume` in the active AgentFlight session and confirm resolved historical failures are clear.
- [x] Complete and archive the AgentLoop task, then commit only intended files.
