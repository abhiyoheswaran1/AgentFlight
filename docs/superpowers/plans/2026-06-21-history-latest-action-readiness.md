# History Latest Action Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the latest session's recorded readiness in the top-level `agentflight history` latest-action block.

**Architecture:** Reuse the existing `formatReadiness(...)` helper in `src/commands/history.ts`. Add one line to the `Latest action:` block without changing artifact selection or per-session rows.

**Tech Stack:** TypeScript, Vitest, AgentFlight CLI renderer tests.

---

### Task 1: Latest Action Readiness Line

**Files:**

- Modify: `tests/commands/history.test.ts`
- Modify: `src/commands/history.ts`

- [x] **Step 1: Write failing tests**

Update existing history tests to assert the top-level `Latest action:` block includes:

```text
Recorded readiness: Ready for review (risk medium, 1 changed file)
```

for a ready latest session and:

```text
Recorded readiness: not recorded
```

for a current latest session without generated artifacts.

- [x] **Step 2: Run focused test and verify RED**

Run: `node dist/cli.js verify -- npm test -- tests/commands/history.test.ts`

Expected: FAIL because the latest-action block does not include recorded readiness yet.

- [x] **Step 3: Implement minimal renderer change**

Add `Recorded readiness: ${formatReadiness(session)}` to `formatLatestAction(...)`.

- [x] **Step 4: Run focused test and verify GREEN**

Run: `node dist/cli.js verify -- npm test -- tests/commands/history.test.ts`

Expected: PASS.

### Task 2: Docs, Dogfood, And Commit

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`
- Modify: `docs/superpowers/plans/2026-06-21-history-latest-action-readiness.md`
- Update/archive AgentLoop task and generated handoff artifacts through commands only.

- [x] **Step 1: Update change notes**

Add an Unreleased changelog bullet for recorded readiness in the top-level history latest-action block.

- [x] **Step 2: Update devlog**

Record the research finding, persona readout, implementation, focused tests, full verification, ProjScan result, AgentLoopKit result, and smoke output.

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
node dist/cli.js history --limit 2
node dist/cli.js handoff
node dist/cli.js history --limit 2
npx agentloopkit@latest check-gates
```

Expected: the latest-action block includes recorded readiness both before and after handoff.

- [x] **Step 5: Commit intended files only**

Stage only source, tests, docs, changelog, devlog, and final AgentLoop task/handoff evidence. Do not stage `.agentflight/sessions`, `.agentflight/reports`, `.agentflight/current`, or `.agentflight/evidence`.

Commit message: `Show readiness in history latest action`.
