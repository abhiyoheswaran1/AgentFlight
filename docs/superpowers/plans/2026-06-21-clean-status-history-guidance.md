# Clean Status History Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make clean-worktree `agentflight status` point users to the latest local artifacts via `agentflight history --limit 1`.

**Architecture:** Keep Review Intelligence and JSON status unchanged. Override only the text status next-action line when readiness is `clean_worktree`, preserving all non-clean status behavior.

**Tech Stack:** TypeScript, Vitest, AgentFlight command tests.

---

### Task 1: Clean Status Text Guidance

**Files:**

- Modify: `tests/commands/evidence-output.test.ts`
- Modify: `src/commands/status.ts`

- [x] **Step 1: Write failing test**

Update the clean-worktree status test to expect:

```text
Next action:
Run agentflight history --limit 1 to reopen the latest local artifacts.
Start a new AgentFlight session when you begin the next task.
```

Keep the JSON assertion expecting `payload.nextAction` to stay `Start a new AgentFlight session when you begin the next task.`

- [x] **Step 2: Run focused test and verify RED**

Run: `node dist/cli.js verify -- npm test -- tests/commands/evidence-output.test.ts`

Expected: FAIL because clean status text does not mention `agentflight history --limit 1` yet.

- [x] **Step 3: Implement text-only next-action override**

In `src/commands/status.ts`, keep `nextAction` for JSON. Add a `statusTextNextAction` value that returns the two-line history/start guidance only when `review.readiness.state === "clean_worktree"`.

- [x] **Step 4: Run focused test and verify GREEN**

Run: `node dist/cli.js verify -- npm test -- tests/commands/evidence-output.test.ts`

Expected: PASS.

### Task 2: Docs, Dogfood, And Commit

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`
- Modify: `docs/superpowers/plans/2026-06-21-clean-status-history-guidance.md`
- Update/archive AgentLoop task and generated handoff artifacts through commands only.

- [x] **Step 1: Update change notes**

Add an Unreleased changelog bullet for clean status pointing to history.

- [x] **Step 2: Update devlog**

Record the dogfood finding, persona readout, implementation, focused tests, full verification, ProjScan result, AgentLoopKit result, and status smoke output.

- [x] **Step 3: Run full bug pass**

Run:

```bash
node dist/cli.js verify -- npm run verify
node dist/cli.js verify -- npm run format:check
node dist/cli.js verify -- npm pack --dry-run
node dist/cli.js verify -- npm audit --audit-level=moderate
node dist/cli.js verify -- npx projscan@latest doctor --format json
node dist/cli.js verify -- npx projscan@latest preflight --mode before_commit --format json
node dist/cli.js verify -- npx projscan@latest review --format json
node dist/cli.js verify -- npx agentloopkit@latest verify
```

Expected: normal checks pass; ProjScan may keep the known scale/manual-signoff verdict without concrete blockers.

- [x] **Step 4: Dogfood built CLI**

Run:

```bash
node dist/cli.js handoff
git status --short
node dist/cli.js status
```

Expected: after commit/post-commit clean status shows `agentflight history --limit 1`.

- [x] **Step 5: Commit intended files only**

Stage only source, tests, docs, changelog, devlog, and final AgentLoop task/handoff evidence. Do not stage `.agentflight/sessions`, `.agentflight/reports`, `.agentflight/current`, or `.agentflight/evidence`.

Commit message: `Point clean status to history`.
