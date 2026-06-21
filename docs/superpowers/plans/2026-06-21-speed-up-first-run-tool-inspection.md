# Speed Up First-Run Tool Inspection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Avoid extra ProjScan help probing in first-run `init` and `start` paths when AgentFlight only needs concise availability and version output.

**Architecture:** Keep the existing ProjScan adapter as the single tool-inspection entry point. Add an option to skip the help probe for concise callers, wire `init` and `start` to that option, and leave `doctor` on the deeper default path.

**Tech Stack:** TypeScript, Vitest, AgentFlight CLI init/start/doctor tool adapters.

---

### Task 1: Regression Tests

**Files:**

- Modify: `tests/adapters/projscan.test.ts`
- Modify if needed: `tests/commands/workflow.test.ts`

- [x] **Step 1: Add failing adapter coverage**

Add a test showing `inspectProjScan({ includeHelp: false })` calls the version command but does not call `--help`, while still reporting the tool as available.

- [x] **Step 2: Preserve default diagnostic coverage**

Keep or add coverage proving the default inspector still calls `--help` and reports help failures as warnings for deeper diagnostics.

- [x] **Step 3: Run focused tests and confirm failure**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/adapters/projscan.test.ts tests/commands/workflow.test.ts
```

Expected: FAIL because `includeHelp` does not exist yet.

### Task 2: Concise Inspection Path

**Files:**

- Modify: `src/adapters/projscan.ts`
- Modify: `src/commands/init.ts`
- Modify: `src/commands/start.ts`

- [x] **Step 1: Add an adapter option**

Add an `includeHelp?: boolean` option to `inspectProjScan(...)`. Default to `true` so existing diagnostic callers keep current behavior.

- [x] **Step 2: Wire first-run callers**

Use `includeHelp: false` from `agentflight init` and `agentflight start`.

- [x] **Step 3: Keep doctor deeper**

Leave `agentflight doctor` on the default inspector behavior so setup diagnostics can still include help-probe warnings.

- [x] **Step 4: Run focused tests and confirm pass**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/adapters/projscan.test.ts tests/commands/workflow.test.ts
```

Expected: PASS.

### Task 3: Docs, Verification, Handoff

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`
- Modify: `docs/superpowers/plans/2026-06-21-speed-up-first-run-tool-inspection.md`
- Update/archive AgentLoop task and generated handoff artifacts through commands only.

- [x] **Step 1: Record the polish**

Add concise changelog/devlog notes that init/start now use concise ProjScan inspection while doctor keeps deeper diagnostics.

- [x] **Step 2: Run verification and gates**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/adapters/projscan.test.ts tests/commands/workflow.test.ts
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
git commit -m "Speed up first-run tool inspection"
```
