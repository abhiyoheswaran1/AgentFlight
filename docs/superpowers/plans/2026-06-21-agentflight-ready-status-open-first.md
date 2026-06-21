# AgentFlight Ready Status Open First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ready-session status output point at an existing handoff/report/replay artifact instead of repeating handoff generation guidance.

**Architecture:** Reuse the existing open-first artifact helper in the status command for ready sessions, matching clean status and ready resume behavior. Keep blocked status and JSON evidence unchanged.

**Tech Stack:** TypeScript, Vitest, existing AgentFlight command fixtures.

---

### Task 1: Regression Test

**Files:**

- Modify: `tests/commands/evidence-output.test.ts`

- [ ] **Step 1: Write the failing test**

Add a dirty ready-session fixture that runs verification, generates a handoff, and then calls `runStatusCommand` with the same changed file. Assert the output includes:

```text
Open first: handoff .agentflight/reports/<session>-handoff.md
```

Assert the ready status next-action block does not keep `Run agentflight handoff to generate the local review packet.` when the open-first artifact exists.

- [ ] **Step 2: Verify red**

Run:

```bash
npm test -- tests/commands/evidence-output.test.ts
```

Expected: FAIL because dirty ready status currently repeats handoff-generation guidance.

### Task 2: Minimal Implementation

**Files:**

- Modify: `src/commands/status.ts`

- [ ] **Step 1: Locate existing open-first code**

Find clean-worktree status open-first handling and reuse the same helper for ready sessions.

- [ ] **Step 2: Add open-first guidance for dirty ready sessions**

When Review Intelligence readiness is `ready_for_review` and a local artifact exists, render `Open first` and use it as the next action. Leave blocked status next actions and clean-worktree next actions unchanged.

- [ ] **Step 3: Verify green**

Run:

```bash
npm test -- tests/commands/evidence-output.test.ts
```

Expected: PASS.

### Task 3: Bug Pass

**Files:**

- Review: `src/commands/status.ts`
- Review: `tests/commands/evidence-output.test.ts`

- [ ] **Step 1: Inspect behavior boundaries**

Confirm these cases still behave correctly:

```text
clean worktree with prior artifact
dirty ready session without artifacts
dirty blocked session with proof gaps
JSON status output remains parseable
```

- [ ] **Step 2: Run verification**

Run:

```bash
npm run verify
npm run format:check
npm pack --dry-run
npm audit --audit-level=moderate
npx projscan@latest doctor --format json
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest verify
```

Expected: normal checks pass. ProjScan may return the known manual scale signoff, but no concrete blocker should appear.
