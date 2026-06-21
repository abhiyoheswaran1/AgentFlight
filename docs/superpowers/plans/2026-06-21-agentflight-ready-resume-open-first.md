# AgentFlight Ready Resume Open First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ready-session resume prompts point at an existing handoff/report/replay artifact instead of repeating handoff generation guidance.

**Architecture:** Reuse the existing open-first artifact selection already used by status, handoff, and clean resume surfaces. Keep the change inside resume command/rendering tests and avoid new persisted state.

**Tech Stack:** TypeScript, Vitest, existing AgentFlight command fixtures.

---

### Task 1: Regression Test

**Files:**

- Modify: `tests/commands/evidence-output.test.ts`

- [ ] **Step 1: Write the failing test**

Add a dirty ready-session fixture with a handoff artifact recorded in the session. Run the resume command and assert the output includes:

```text
Open first: handoff .agentflight/reports/<session>-handoff.md
```

Assert the output does not keep `Run agentflight handoff to generate the local review packet.` as the next recommended action when the open-first artifact is present.

- [ ] **Step 2: Verify red**

Run:

```bash
npm test -- tests/commands/evidence-output.test.ts
```

Expected: FAIL because dirty ready-session resume currently still repeats handoff generation guidance.

### Task 2: Minimal Implementation

**Files:**

- Modify: `src/commands/resume.ts` or `src/renderers/resume-prompt.ts`

- [ ] **Step 1: Locate existing helper usage**

Find the existing clean-worktree or status open-first artifact helper and reuse it instead of duplicating artifact selection logic.

- [ ] **Step 2: Add open-first guidance for dirty ready sessions**

When Review Intelligence readiness is ready and an open-first artifact exists, render that path and use it as the next recommended action. Keep blocked-session proof guidance and clean-worktree resume behavior unchanged.

- [ ] **Step 3: Verify green**

Run:

```bash
npm test -- tests/commands/evidence-output.test.ts
```

Expected: PASS.

### Task 3: Bug Pass

**Files:**

- Review: `src/commands/resume.ts`
- Review: `src/renderers/resume-prompt.ts`
- Review: `tests/commands/evidence-output.test.ts`

- [ ] **Step 1: Inspect behavior boundaries**

Confirm these cases still behave correctly:

```text
clean worktree with prior artifact
dirty ready session without artifacts
dirty blocked session with proof gaps
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
