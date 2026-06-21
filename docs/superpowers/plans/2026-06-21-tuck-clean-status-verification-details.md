# Tuck Clean Status Verification Details Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or a stricter local TDD loop to implement this plan task-by-task.

**Goal:** Keep `agentflight status` brief once the checkout is clean and there are no unresolved failed verification runs.

**Architecture:** Keep Review Intelligence unchanged. Pass a terminal-display hint from `runStatusCommand` into the verification-run formatter; JSON remains the full session data.

**Tech Stack:** TypeScript, Vitest, AgentFlight status command.

---

### Task 1: Red Tests

**Files:**

- Modify: `tests/commands/evidence-output.test.ts`

- [x] Update clean-worktree status coverage to expect tucked verification details.
- [x] Assert status JSON still exposes verification runs.
- [x] Assert unresolved failed verification still prints actionable failure details.
- [x] Run `npm test -- tests/commands/evidence-output.test.ts` and confirm the new assertions fail.

### Task 2: Status Formatter

**Files:**

- Modify: `src/commands/status.ts`

- [x] Add a clean-worktree/no-unresolved-failure display branch.
- [x] Keep normal compact recent-run behavior for dirty worktrees.
- [x] Keep unresolved failed verification details visible.

### Task 3: Verification And Handoff

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] Run targeted tests.
- [x] Run full checks and product checks.
- [x] Dogfood `agentflight status` on a clean local session.
- [x] Complete and archive the AgentLoop task, then commit only intended files.
