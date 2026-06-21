# AgentFlight History Resolved Failure Wording Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `agentflight history` show resolved historical verification failures with the same unresolved/resolved wording as the other review surfaces.

**Architecture:** Extract command normalization and failed-run resolution into a small dependency-free verification-runs helper. Extend local session summaries with unresolved and resolved failed-run counts derived from existing verification runs, then format the history count line through the shared output helper.

**Tech Stack:** TypeScript, Vitest, AgentFlight local session summaries.

---

### Task 1: Red Test

**Files:**

- Modify: `tests/commands/history.test.ts`

- [x] Update the history fixture to include a failed command followed by a later passing run of the same command.
- [x] Assert history prints `2 passed, 1 failed (0 unresolved, 1 resolved)`.
- [x] Assert existing session order, current marker, readiness, artifact path, malformed-session, and invalid-limit behavior remains covered.
- [x] Run `npm test -- tests/commands/history.test.ts tests/core/verification.test.ts` and confirm the new assertion fails.

### Task 2: Verification Run Resolution Helper

**Files:**

- Create: `src/core/verification-runs.ts`
- Modify: `src/core/verification.ts`

- [x] Move command parsing, command formatting, command normalization, and unresolved failed-run detection into `src/core/verification-runs.ts`.
- [x] Re-export those helpers from `src/core/verification.ts` so existing imports keep working.
- [x] Keep verification behavior and tests unchanged.

### Task 3: Session Summary Counts

**Files:**

- Modify: `src/core/session.ts`

- [x] Add `verificationUnresolvedFailed` and `verificationResolvedFailed` to `SessionSummary`.
- [x] Populate those fields in `summarizeSession()` from the dependency-free unresolved failed-run helper without changing stored session JSON.

### Task 4: History Display

**Files:**

- Modify: `src/commands/history.ts`

- [x] Import `formatVerificationCountLine` from `src/core/output.ts`.
- [x] Replace the manual history verification line with the shared helper.
- [x] Preserve history limit validation, current-session marker, readiness, and artifact path behavior.

### Task 5: Verification And Handoff

**Files:**

- Update task/handoff artifacts only through AgentLoopKit and AgentFlight commands.

- [x] Run focused tests: `npm test -- tests/commands/history.test.ts tests/core/verification.test.ts`.
- [x] Run full checks: `npm run verify`, `npm run format:check`, `npm pack --dry-run`, `npm audit --audit-level=moderate`.
- [x] Run product checks: `npx projscan@latest doctor --format json`, `npx projscan@latest preflight --mode before_commit --format json`, `npx agentloopkit@latest verify`.
- [x] Dogfood `agentflight history --limit 3` in the active repo and confirm ready sessions show resolved-failure context.
- [x] Complete and archive the AgentLoop task, then commit only intended files.
