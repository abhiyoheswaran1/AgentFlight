# Clean Handoff Exit Success Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `agentflight handoff` exit successfully for clean-worktree handoffs while preserving nonzero exits for blocked review states.

**Architecture:** Keep handoff rendering and artifact generation unchanged. Narrow the behavior change to the handoff exit-code predicate so `ready_for_review` and `clean_worktree` are successful informational states, while proof-blocked states remain nonzero.

**Tech Stack:** TypeScript, Vitest, AgentFlight CLI artifacts, AgentLoopKit task evidence.

---

### Task 1: Regression Test

**Files:**

- Modify: `tests/commands/evidence-output.test.ts`

- [x] **Step 1: Add a failing clean-worktree handoff test**

Add a handoff test near the existing local handoff tests:

```ts
it("exits successfully for clean-worktree local handoffs", async () => {
  const repoRoot = await startedRepo([]);

  const handoff = await runHandoffCommand({
    repoRoot,
    changedFiles: [],
    now: new Date("2026-06-13T12:05:00.000Z")
  });

  expect(handoff.exitCode).toBe(0);
  expect(handoff.output).toContain("Readiness: Clean worktree");
  expect(handoff.output).toContain("Start a new AgentFlight session when you begin the next task.");
  expect(handoff.output).not.toContain("Fix before sharing:");
});
```

- [x] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/commands/evidence-output.test.ts
```

Expected: FAIL because clean handoff currently returns exit code `1`.

### Task 2: Exit-Code Predicate

**Files:**

- Modify: `src/commands/handoff.ts`
- Modify: `tests/commands/evidence-output.test.ts`

- [x] **Step 1: Implement the minimal predicate change**

Change the handoff result exit code to use a helper that accepts both `ready_for_review` and `clean_worktree`:

```ts
function exitsSuccessfully(readiness: HandoffReadiness): boolean {
  return readiness.state === "ready_for_review" || readiness.state === "clean_worktree";
}
```

Keep `isReadyForSharing(...)` unchanged so open-first artifact selection and sharing copy still distinguish clean worktrees from review-ready changes.

- [x] **Step 2: Run the focused test and confirm it passes**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/commands/evidence-output.test.ts
```

Expected: PASS.

### Task 3: Docs, Bug Pass, Handoff

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`
- Modify: `docs/superpowers/plans/2026-06-21-clean-handoff-exit-success.md`
- Update/archive AgentLoop task and generated handoff artifacts through commands only.

- [x] **Step 1: Record the bugfix**

Add concise unreleased changelog/devlog notes that clean-worktree handoff now exits successfully.

- [x] **Step 2: Run verification and gates**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/commands/evidence-output.test.ts
node dist/cli.js verify -- npm run verify
node dist/cli.js verify -- npm run format:check
node dist/cli.js verify -- npm pack --dry-run
node dist/cli.js verify -- npx projscan@latest doctor --format json
node dist/cli.js verify -- npx projscan@latest preflight --mode before_commit --format json
node dist/cli.js verify -- npx agentloopkit@latest verify
```

Expected: checks pass; ProjScan may report only the known accumulated scale caution.

- [x] **Step 3: Handoff and commit**

Run AgentFlight handoff, AgentLoopKit handoff, `check-gates`, mark/archive the task, stage only intended files, commit with:

```bash
git commit -m "Treat clean handoff as successful"
```
