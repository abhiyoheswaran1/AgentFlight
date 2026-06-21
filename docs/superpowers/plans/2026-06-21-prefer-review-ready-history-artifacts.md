# Prefer Review-Ready History Artifacts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `agentflight history` prefer useful review artifact metadata over later clean-worktree artifact metadata for the same session.

**Architecture:** Keep history read-only. Change only session summary selection so it first chooses the latest non-clean artifact review metadata, falling back to the latest clean metadata when that is all the session has.

**Tech Stack:** TypeScript, Vitest, AgentFlight local session JSON.

---

### Task 1: Regression Test

**Files:**

- Modify: `tests/core/session.test.ts`

- [x] **Step 1: Add a failing mixed-readiness summary test**

Add a test where a ready replay event is followed by a clean report event. Expect the summary to keep the ready replay metadata.

- [x] **Step 2: Run focused tests and confirm failure**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/core/session.test.ts tests/commands/history.test.ts
```

Expected: FAIL because `getLatestRecordedReviewSummary` currently returns the later clean event.

### Task 2: Summary Selection

**Files:**

- Modify: `src/core/session.ts`

- [x] **Step 1: Prefer non-clean artifact metadata**

Update `getLatestRecordedReviewSummary` to scan artifact events from newest to oldest, return the first non-clean summary, and remember the newest clean summary as a fallback.

- [x] **Step 2: Preserve clean-only behavior**

Keep the existing clean-only test passing by returning the fallback clean summary when no non-clean summary exists.

- [x] **Step 3: Run focused tests and confirm pass**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/core/session.test.ts tests/commands/history.test.ts
```

Expected: PASS.

### Task 3: Docs, Verification, Handoff

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`
- Modify: `docs/superpowers/plans/2026-06-21-prefer-review-ready-history-artifacts.md`
- Update/archive AgentLoop task and generated handoff artifacts through commands only.

- [x] **Step 1: Record the bugfix**

Add concise changelog/devlog notes that history now prefers useful non-clean review artifact metadata over later clean metadata.

- [x] **Step 2: Run verification and gates**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/core/session.test.ts tests/commands/history.test.ts
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
git commit -m "Prefer review-ready history artifacts"
```
