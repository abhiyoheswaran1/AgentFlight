# Share First-Run File Guidance Helpers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep first-run AgentFlight generated-file guidance consistent between `agentflight init` and `agentflight start --yes`.

**Architecture:** Move AgentFlight generated-file list ordering and local-file guidance strings into shared output helpers. `init` should use the helper for created/skipped lists and the full local-files section. `start --yes` should use the same generated-file list helper and concise project-config/runtime-evidence wording.

**Tech Stack:** TypeScript, Vitest, AgentFlight CLI init/start output helpers.

---

### Task 1: Regression Tests

**Files:**

- Add: `tests/core/output.test.ts`
- Modify if needed: `tests/commands/workflow.test.ts`

- [x] **Step 1: Add failing helper coverage**

Add tests for shared generated AgentFlight file ordering:

```text
.agentflight/config.json
.agentflight/.gitignore
other generated paths
```

The helper should return `- none` for empty lists and never expose absolute repo roots.

- [x] **Step 2: Add guidance coverage**

Add tests for shared first-run local-file guidance so config/runtime wording lives in one place.

- [x] **Step 3: Run focused tests and confirm failure**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/core/output.test.ts tests/commands/workflow.test.ts
```

Expected: FAIL because the shared helpers do not exist yet.

### Task 2: Shared Output Helpers

**Files:**

- Modify: `src/core/output.ts`
- Modify: `src/commands/init.ts`
- Modify: `src/commands/start.ts`

- [x] **Step 1: Add shared helpers**

Add helpers for generated AgentFlight file lists and first-run local-file guidance.

- [x] **Step 2: Refactor init**

Use the shared list helper for created/skipped files and the shared local-files guidance for the `Local files:` block.

- [x] **Step 3: Refactor start --yes**

Use the shared list helper for the `Initialized:` block and shared guidance strings for config/runtime wording.

- [x] **Step 4: Keep output tidy**

Avoid extra blank lines when `agentflight start` does not auto-initialize.

- [x] **Step 5: Run focused tests and confirm pass**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/core/output.test.ts tests/commands/workflow.test.ts
```

Expected: PASS.

### Task 3: Docs, Verification, Handoff

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`
- Modify: `docs/superpowers/plans/2026-06-21-share-first-run-file-guidance-helpers.md`
- Update/archive AgentLoop task and generated handoff artifacts through commands only.

- [x] **Step 1: Record the refactor**

Add concise changelog/devlog notes that first-run generated-file guidance now uses shared output helpers.

- [x] **Step 2: Run verification and gates**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/core/output.test.ts tests/commands/workflow.test.ts
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
git commit -m "Share first-run file guidance helpers"
```
