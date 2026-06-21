# Preserve Clean Handoff Artifacts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent clean-worktree `agentflight handoff` from overwriting useful session review artifacts when those artifacts already exist.

**Architecture:** Keep normal handoff generation unchanged for ready, blocked, and first-time clean sessions. For `clean_worktree` only, reuse existing session-specific report/replay/resume/handoff paths when all are present, write only the current handoff pointer, and avoid appending clean report/replay/resume artifact events that would replace recorded review readiness.

**Tech Stack:** TypeScript, Vitest, AgentFlight local artifact files.

---

### Task 1: Regression Test

**Files:**

- Modify: `tests/commands/evidence-output.test.ts`

- [x] **Step 1: Add a failing artifact preservation test**

Add a test near the handoff tests:

```ts
it("preserves existing review artifacts when clean-worktree handoff runs later", async () => {
  const command = `${process.execPath} -e "console.log('proof ok')"`;
  const repoRoot = await startedRepo([command]);
  await runVerifyCommand({
    repoRoot,
    commandArgs: [process.execPath, "-e", "console.log('proof ok')"],
    now: () => new Date("2026-06-13T12:00:00.000Z")
  });

  const readyHandoff = await runHandoffCommand({
    repoRoot,
    changedFiles: ["src/commands/handoff.ts"],
    now: new Date("2026-06-13T12:05:00.000Z")
  });
  const originalReport = await readFile(readyHandoff.reportPath, "utf8");
  const originalReplay = await readFile(readyHandoff.replayPath, "utf8");
  const originalResume = await readFile(readyHandoff.sessionResumePath, "utf8");
  const originalSessionHandoff = await readFile(readyHandoff.sessionHandoffPath, "utf8");

  const cleanHandoff = await runHandoffCommand({
    repoRoot,
    changedFiles: [],
    now: new Date("2026-06-13T12:10:00.000Z")
  });

  expect(cleanHandoff.exitCode).toBe(0);
  await expect(readFile(readyHandoff.reportPath, "utf8")).resolves.toBe(originalReport);
  await expect(readFile(readyHandoff.replayPath, "utf8")).resolves.toBe(originalReplay);
  await expect(readFile(readyHandoff.sessionResumePath, "utf8")).resolves.toBe(originalResume);
  await expect(readFile(readyHandoff.sessionHandoffPath, "utf8")).resolves.toBe(
    originalSessionHandoff
  );
  await expect(readFile(cleanHandoff.handoffPath, "utf8")).resolves.toContain(
    "Readiness: Clean worktree"
  );
});
```

- [x] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/commands/evidence-output.test.ts
```

Expected: FAIL because the second handoff overwrites at least the report artifact with clean-worktree content.

### Task 2: Preserve Existing Artifacts

**Files:**

- Modify: `src/commands/handoff.ts`
- Modify: `tests/commands/evidence-output.test.ts`

- [x] **Step 1: Implement artifact reuse for clean handoff**

In `runHandoffCommand`, compute the expected session artifact paths before generation. If readiness is `clean_worktree` and the session report, replay, resume, and handoff files all exist, skip `runReportCommand`, `runReplayCommand`, and `runResumeCommand`; render the clean handoff using the existing paths and write only `.agentflight/current/handoff.md`.

- [x] **Step 2: Keep fallback generation for first-time clean sessions**

If any existing session artifact is missing, keep the current behavior and generate report/replay/resume/handoff artifacts.

- [x] **Step 3: Run the focused test and confirm it passes**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/commands/evidence-output.test.ts
```

Expected: PASS.

### Task 3: Docs, Verification, Handoff

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`
- Modify: `docs/superpowers/plans/2026-06-21-preserve-clean-handoff-artifacts.md`
- Update/archive AgentLoop task and generated handoff artifacts through commands only.

- [x] **Step 1: Record the bugfix**

Add concise changelog/devlog notes that clean-worktree handoff preserves existing session review artifacts.

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
git commit -m "Preserve review artifacts on clean handoff"
```
