# Explain Start Yes Generated Files Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `agentflight start --yes` explain the AgentFlight files it generated during safe auto-init so first-run users understand what should be reviewed and what stays local.

**Architecture:** Keep `initAgentFlight(...)` as the only initializer. Track whether `start --yes` performed auto-init and render a concise generated-files note in `start` output. Do not change default `start` behavior when AgentFlight is missing and `--yes` is not provided.

**Tech Stack:** TypeScript, Vitest, AgentFlight CLI start workflow.

---

### Task 1: Regression Tests

**Files:**

- Modify: `tests/commands/workflow.test.ts`

- [x] **Step 1: Add failing `start --yes` output coverage**

Add a workflow test that starts in an uninitialized repo with `yes: true` and expects output to list `.agentflight/config.json` and `.agentflight/.gitignore`.

- [x] **Step 2: Assert workspace-hygiene copy**

Assert the same output says `.agentflight/config.json` is project config and runtime evidence stays local/excluded.

- [x] **Step 3: Run focused tests and confirm failure**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/commands/workflow.test.ts
```

Expected: FAIL because `start --yes` currently initializes silently.

### Task 2: Start Output Guidance

**Files:**

- Modify: `src/commands/start.ts`

- [x] **Step 1: Track auto-init result**

When `start --yes` initializes a missing AgentFlight config, keep the created/skipped file lists from `initAgentFlight(...)`.

- [x] **Step 2: Render concise generated-file guidance**

Add an `Initialized:` block to `start` output only when auto-init happened. Keep paths repo-relative and avoid printing the absolute repo root.

- [x] **Step 3: Keep non-yes behavior unchanged**

Leave the existing missing-initialization error unchanged when `--yes` is not provided.

- [x] **Step 4: Run focused tests and confirm pass**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/commands/workflow.test.ts
```

Expected: PASS.

### Task 3: Docs, Verification, Handoff

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`
- Modify: `docs/superpowers/plans/2026-06-21-explain-start-yes-generated-files.md`
- Update/archive AgentLoop task and generated handoff artifacts through commands only.

- [x] **Step 1: Record the polish**

Add concise changelog/devlog notes that `start --yes` now explains generated AgentFlight files.

- [x] **Step 2: Run verification and gates**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/commands/workflow.test.ts
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
git commit -m "Explain start yes generated files"
```
