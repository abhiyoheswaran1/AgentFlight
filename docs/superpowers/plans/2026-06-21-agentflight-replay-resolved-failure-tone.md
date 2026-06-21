# AgentFlight Replay Resolved Failure Tone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep historical failed runs visible in HTML replay without styling them as urgent blockers after later passing runs resolve them.

**Architecture:** Reuse the verification summary already passed into replay. Treat failed-run navigation as urgent only when `unresolvedFailed > 0`; otherwise keep historical failed runs in the ledger and summary.

**Tech Stack:** TypeScript, Vitest, local HTML replay renderer.

---

### Task 1: Red Test

**Files:**

- Modify: `tests/renderers/html-replay.test.ts`

- [x] Add a ready replay fixture with one historical failed run, one later passing run, and `verificationSummary` showing `0 unresolved`.
- [x] Assert the failed ledger entry remains present.
- [x] Assert urgent failed-run nav and shortcut copy are absent.
- [x] Run `npm test -- tests/renderers/html-replay.test.ts` and confirm the new test fails.

### Task 2: Replay Tone

**Files:**

- Modify: `src/renderers/html-replay.ts`

- [x] Compute urgent failed-run navigation from `verificationSummary.unresolvedFailed > 0`.
- [x] Keep failed-run anchors on ledger entries.
- [x] Keep blocked replay behavior unchanged when unresolved failures exist.

### Task 3: Verification And Handoff

**Files:**

- Update task/handoff artifacts only through AgentLoopKit and AgentFlight commands.

- [x] Run focused tests: `npm test -- tests/renderers/html-replay.test.ts tests/commands/evidence-output.test.ts`.
- [x] Run full checks: `npm run verify`, `npm run format:check`, `npm pack --dry-run`, `npm audit --audit-level=moderate`.
- [x] Run product checks: `npx projscan@latest doctor --format json`, `npx projscan@latest preflight --mode before_commit --format json`, `npx agentloopkit@latest verify`.
- [x] Dogfood built replay on a session with resolved historical failures.
- [x] Complete and archive the AgentLoop task, then commit only intended files.
