# Block Clean Readiness During Incomplete Verification Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or a stricter local TDD loop to implement this plan task-by-task.

**Goal:** Prevent `Clean worktree` readiness from masking an in-progress or otherwise incomplete verification attempt.

**Architecture:** Keep proof-gap detection unchanged. Adjust Review Intelligence readiness ordering so unresolved failed runs still win first, then actionable proof gaps, then clean-worktree readiness.

**Tech Stack:** TypeScript, Vitest, AgentFlight Review Intelligence/status.

---

### Task 1: Red Tests

**Files:**

- Modify: `tests/core/review-intelligence.test.ts`
- Modify: `tests/commands/evidence-output.test.ts`

- [x] Add core coverage for zero changed files with an incomplete verification event.
- [x] Add status coverage for the same clean-worktree/incomplete-verification edge.
- [x] Preserve coverage that completed passing verification still reports clean worktree.
- [x] Run `npm test -- tests/core/review-intelligence.test.ts tests/commands/evidence-output.test.ts` and confirm the new assertions fail.

### Task 2: Readiness Ordering

**Files:**

- Modify: `src/core/review-intelligence.ts`

- [x] Move actionable proof-gap handling before the clean-worktree branch.
- [x] Preserve failed-verification precedence.
- [x] Keep clean-worktree readiness when no failed or incomplete verification remains.

### Task 3: Verification And Handoff

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] Run targeted tests.
- [x] Run full checks and product checks.
- [x] Dogfood status for the incomplete-verification edge if practical.
- [x] Complete and archive the AgentLoop task, then commit only intended files.
