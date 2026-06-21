# Clean Worktree Status Readiness Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or a stricter local TDD loop to implement this plan task-by-task.

**Goal:** Make `agentflight status` clear after a completed task has been committed and the checkout is clean.

**Architecture:** Keep Review Intelligence as the source of readiness decisions. Add an explicit clean-worktree readiness state and let status/report/replay render the shared label/reason normally.

**Tech Stack:** TypeScript, Vitest, AgentFlight Review Intelligence.

---

### Task 1: Red Tests

**Files:**

- Modify: `tests/core/review-intelligence.test.ts`
- Modify: `tests/commands/evidence-output.test.ts`
- Modify: `tests/core/session.test.ts`

- [x] Add core readiness coverage for zero changed files with passing evidence.
- [x] Add core regression coverage that unresolved failed verification still blocks.
- [x] Add status text and JSON coverage for the clean-worktree state.
- [x] Add session metadata parser coverage for `clean_worktree` readiness.
- [x] Run `npm test -- tests/core/review-intelligence.test.ts tests/commands/evidence-output.test.ts` and confirm the new assertions fail.

### Task 2: Readiness Implementation

**Files:**

- Modify: `src/types/index.ts`
- Modify: `src/core/review-intelligence.ts`
- Modify: `src/core/session.ts`

- [x] Add an explicit `clean_worktree` readiness state.
- [x] Return the clean-worktree state only after unresolved failed verification is ruled out.
- [x] Accept `clean_worktree` when reading stored report/replay readiness.
- [x] Keep changed-file readiness and proof-gap behavior unchanged.

### Task 3: Verification And Handoff

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] Run targeted tests.
- [x] Run full checks and product checks.
- [x] Dogfood built `agentflight status` on a clean checkout.
- [x] Complete and archive the AgentLoop task, then commit only intended files.
