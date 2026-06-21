# AgentFlight Concurrent Verify Evidence Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or a stricter local TDD loop to implement this plan task-by-task.

**Goal:** Prevent concurrent `agentflight verify` commands from reusing evidence paths or overwriting each other's session updates.

**Architecture:** Keep the existing `.agentflight/evidence/<session-id>/verification-N.*.txt` user-facing path shape. Reserve a number with a hidden local claim file before running the command, then serialize session append mutations with a short local file lock and reload the latest persisted session before writing.

**Tech Stack:** TypeScript, Vitest, AgentFlight local artifact files.

---

### Task 1: Red Test

**Files:**

- Modify: `tests/commands/verify.test.ts`

- [x] Add a deterministic test that starts two `runVerifyCommand` calls before either command returns.
- [x] Assert returned stdout paths are distinct.
- [x] Assert the persisted session contains both verification runs.
- [x] Assert raw stdout evidence remains intact for both commands.
- [x] Run `npm test -- tests/commands/verify.test.ts` and confirm the new assertion fails.

### Task 2: Evidence Reservation And Session Merge

**Files:**

- Modify: `src/core/fs-safe.ts`
- Modify: `src/core/verification.ts`
- Modify: `src/core/session.ts`

- [x] Add a local exclusive write helper for reservation files.
- [x] Add a short local file-lock helper for session mutation.
- [x] Reserve verification evidence names with hidden claim files.
- [x] Reload persisted session state before appending events or verification runs.
- [x] Preserve existing sequential verification output.

### Task 3: Verification And Handoff

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] Run focused tests: `npm test -- tests/commands/verify.test.ts`.
- [x] Run targeted tests: `npm test -- tests/commands/verify.test.ts tests/commands/evidence-output.test.ts`.
- [x] Run full checks: `npm run verify`, `npm run format:check`, `npm pack --dry-run`, `npm audit --audit-level=moderate`.
- [x] Run product checks: `npx projscan@latest doctor --format json`, `npx projscan@latest preflight --mode before_commit --format json`, `npx agentloopkit@latest verify`.
- [x] Dogfood concurrent `agentflight verify` commands and confirm distinct evidence paths are reported.
- [ ] Complete and archive the AgentLoop task, then commit only intended files.
