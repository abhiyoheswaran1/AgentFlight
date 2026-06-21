# History Previous Artifact Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `agentflight history` keep useful local artifacts discoverable when the newest current session has no artifacts yet.

**Architecture:** Keep history read-only. When the newest session is current and has no handoff/report/replay artifact, keep the existing `Next: run agentflight handoff` guidance and append a previous-artifact hint using the nearest older session with an existing open-first artifact.

**Tech Stack:** TypeScript, Vitest, AgentFlight history command.

---

### Task 1: Regression Test

**Files:**

- Modify: `tests/commands/history.test.ts`

- [x] **Step 1: Add failing latest-action fallback expectation**

Extend the current no-artifacts history test so the latest block also shows the older replay artifact as a previous artifact.

- [x] **Step 2: Keep current-session action**

Assert `Next: run agentflight handoff` remains present for the current session.

- [x] **Step 3: Run focused tests and confirm failure**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/commands/history.test.ts
```

Expected: FAIL because history currently does not show a previous artifact in the latest-action block.

### Task 2: History Latest-Action Hint

**Files:**

- Modify: `src/commands/history.ts`

- [x] **Step 1: Find previous open-first artifact**

When formatting history, inspect older sessions in order and choose the first existing open-first artifact.

- [x] **Step 2: Render read-only fallback**

When the latest current session has no artifact, render a concise `Previous artifact:` line after the current handoff next action.

- [x] **Step 3: Preserve path safety**

Keep artifact paths repo-relative and do not expose absolute repo roots.

- [x] **Step 4: Run focused tests and confirm pass**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/commands/history.test.ts
```

Expected: PASS.

### Task 3: Docs, Verification, Handoff

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`
- Modify: `docs/superpowers/plans/2026-06-21-history-previous-artifact-guidance.md`
- Update/archive AgentLoop task and generated handoff artifacts through commands only.

- [x] **Step 1: Record the polish**

Add concise changelog/devlog notes that history now surfaces a previous useful artifact when the current session has none.

- [x] **Step 2: Run verification and gates**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/commands/history.test.ts
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
git commit -m "Show previous artifact in history latest action"
```
