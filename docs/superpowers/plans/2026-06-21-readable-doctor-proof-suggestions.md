# Readable Doctor Proof Suggestions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `agentflight doctor` proof-command suggestions readable when multiple detected proof scripts exist.

**Architecture:** Keep Doctor check data local and deterministic. Change the suggested-fix text for multiple detected commands to a multiline list and update the Doctor renderer so multiline suggested fixes stay indented under the check.

**Tech Stack:** TypeScript, Vitest, AgentFlight CLI doctor output.

---

### Task 1: Regression Tests

**Files:**

- Modify: `tests/core/doctor.test.ts`
- Modify: `tests/commands/workflow.test.ts`

- [x] **Step 1: Add failing core expectation**

Update the empty verification-command test to expect `suggestedFix` to contain a multiline list of full `agentflight verify -- ...` commands, not a semicolon-separated one-liner.

- [x] **Step 2: Add failing command-output expectation**

Update the workflow doctor test to assert the rendered output contains `Suggested fix:` followed by indented command bullets and no semicolon-separated `Try one of:` line.

- [x] **Step 3: Run focused tests and confirm failure**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/core/doctor.test.ts tests/commands/workflow.test.ts
```

Expected: FAIL because Doctor currently renders the suggestions as one long line.

### Task 2: Suggested Fix Rendering

**Files:**

- Modify: `src/core/doctor.ts`
- Modify: `src/commands/doctor.ts`

- [x] **Step 1: Make multiple command suggestions multiline**

Change `buildVerificationCommandsSuggestedFix(...)` so multiple suggestions return:

```text
Try one of:
- agentflight verify -- npm run typecheck
- agentflight verify -- npm test
To make one command the default, add it under verification.commands.
```

Keep the no-command fallback as a single readable sentence.

- [x] **Step 2: Indent multiline suggested fixes in command output**

Change `renderDoctor(...)` so `Suggested fix:` appears on its own line for multiline values and every following line is indented under the check.

- [x] **Step 3: Run focused tests and confirm pass**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/core/doctor.test.ts tests/commands/workflow.test.ts
```

Expected: PASS.

### Task 3: Docs, Verification, Handoff

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`
- Modify: `docs/superpowers/plans/2026-06-21-readable-doctor-proof-suggestions.md`
- Update/archive AgentLoop task and generated handoff artifacts through commands only.

- [x] **Step 1: Record the polish**

Add concise changelog/devlog notes that Doctor now renders multiple proof suggestions as a readable list.

- [x] **Step 2: Run verification and gates**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/core/doctor.test.ts tests/commands/workflow.test.ts
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
git commit -m "Make doctor proof suggestions readable"
```
