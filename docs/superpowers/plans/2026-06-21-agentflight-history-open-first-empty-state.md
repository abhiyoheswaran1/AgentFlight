# AgentFlight History Open-First Empty State Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or a stricter local TDD loop to implement this plan task-by-task.

**Goal:** Make the `agentflight history` open-first empty state read like user-facing CLI copy.

**Architecture:** Preserve existing artifact path rows and their `missing` value. Change only the recommendation fallback when no handoff, report, or replay artifact exists.

**Tech Stack:** TypeScript, Vitest.

---

### Task 1: Red Test

**Files:**

- Modify: `tests/commands/history.test.ts`

- [x] Add an assertion that a session with no handoff/report/replay artifacts shows `Open first: none yet`.
- [x] Run `npm test -- tests/commands/history.test.ts` and confirm the assertion fails.

### Task 2: Empty-State Copy

**Files:**

- Modify: `src/commands/history.ts`

- [x] Return `none yet` from open-first guidance when no primary artifact exists.
- [x] Preserve `missing` in the artifact path rows.

### Task 3: Verification And Handoff

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] Run adjacent tests: `npm test -- tests/commands/history.test.ts tests/cli-entrypoint.test.ts tests/commands/evidence-output.test.ts`.
- [x] Run full checks: `npm run verify`, `npm run format:check`, `npm pack --dry-run`, `npm audit --audit-level=moderate`.
- [x] Run product checks: `npx projscan@latest doctor --format json`, `npx projscan@latest preflight --mode before_commit --format json`, `npx agentloopkit@latest verify`.
- [x] Dogfood `agentflight history --limit 1` with no generated handoff/report/replay and confirm `Open first: none yet`.
- [ ] Complete and archive the AgentLoop task, then commit only intended files.
