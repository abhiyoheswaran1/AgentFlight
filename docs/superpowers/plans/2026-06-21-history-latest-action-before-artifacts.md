# History Latest Action Before Artifacts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the top-level `agentflight history` latest action useful before the current session has generated handoff/report/replay artifacts.

**Architecture:** Keep history read-only and reuse the existing artifact selection. Only the top-level `Latest action:` block gets an additional next-action line when the newest session is the current session and no open-first artifact exists.

**Tech Stack:** TypeScript, Vitest, AgentFlight CLI renderer tests.

---

### Task 1: Current Session No-Artifact Guidance

**Files:**

- Modify: `tests/commands/history.test.ts`
- Modify: `src/commands/history.ts`

- [x] **Step 1: Write the failing renderer test**

Add a history test where the current newest session has no handoff/report/replay artifacts. Assert the top-level block contains:

```text
Latest action:
Open first: none yet
Next: run agentflight handoff
Task: Current no artifacts
```

Also assert older sessions with replay artifacts do not cause the top-level action to point away from the current session.

- [x] **Step 2: Run focused test and verify RED**

Run: `node dist/cli.js verify -- npm test -- tests/commands/history.test.ts`

Expected: FAIL because the new next-action line is not rendered yet.

- [x] **Step 3: Implement minimal renderer change**

Pass `isCurrent` into the latest-action renderer. If `chooseOpenFirstArtifact(...)` returns `none yet` for the current session, append `Next: run agentflight handoff`.

- [x] **Step 4: Run focused test and verify GREEN**

Run: `node dist/cli.js verify -- npm test -- tests/commands/history.test.ts`

Expected: PASS.

### Task 2: Docs, Dogfood, And Commit

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`
- Modify: `docs/superpowers/plans/2026-06-21-history-latest-action-before-artifacts.md`
- Update/archive AgentLoop task and generated handoff artifacts through commands only.

- [x] **Step 1: Update change notes**

Add an Unreleased changelog bullet for the pre-handoff latest-action guidance.

- [x] **Step 2: Update devlog**

Record the smoke finding, persona readout, implementation, red/green evidence, full verification, ProjScan result, AgentLoopKit result, and any product/tooling feedback.

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
npm run build
node dist/cli.js history --limit 2
node dist/cli.js handoff
node dist/cli.js history --limit 2
npx agentloopkit@latest check-gates
```

Expected: before handoff, latest action says to run `agentflight handoff`; after handoff, latest action points to the replay/report artifact.

- [x] **Step 5: Commit intended files only**

Stage only source, tests, docs, changelog, devlog, and final AgentLoop task/handoff evidence. Do not stage `.agentflight/sessions`, `.agentflight/reports`, `.agentflight/current`, or `.agentflight/evidence`.

Commit message: `Guide history before artifacts exist`.
