# History Latest Action Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the newest session's actionable open-first artifact near the top of `agentflight history` while preserving the full local session list.

**Architecture:** Reuse the existing history artifact-selection logic and renderer. Add a compact summary block above `Recent sessions:` only when at least one session exists, with no new command, mutable state, export mode, search index, or session switching.

**Tech Stack:** TypeScript, Vitest, AgentFlight CLI renderer tests.

---

### Task 1: History Top-Level Latest Action

**Files:**

- Modify: `tests/commands/history.test.ts`
- Modify: `src/commands/history.ts`

- [x] **Step 1: Write the failing renderer test**

Add assertions to the existing newest-first history test that the output includes a top-level block before `Recent sessions:`:

```text
Latest action:
Open first: replay .agentflight/reports/<session-id>-replay.html
Task: Newer review
```

Keep the existing per-session `Open first:` and artifact path assertions.

- [x] **Step 2: Run the focused test and verify RED**

Run: `npm test -- tests/commands/history.test.ts`

Expected: FAIL because `Latest action:` is not rendered yet.

- [x] **Step 3: Implement the renderer change**

In `src/commands/history.ts`, compute the latest session summary before the full list and render a compact `Latest action:` block using the same artifact path lookup and open-first selection used by each session block.

- [x] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- tests/commands/history.test.ts`

Expected: PASS.

### Task 2: Docs And Bug Pass

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`
- Modify: `docs/superpowers/plans/2026-06-21-history-latest-action.md`
- Update/archive AgentLoop task and generated handoff artifacts through commands only.

- [x] **Step 1: Update public change notes**

Add an Unreleased changelog bullet that `agentflight history` now surfaces the newest session's open-first action before the full list.

- [x] **Step 2: Update the devlog**

Record the research finding, persona opinions, implementation summary, test evidence, and any product/tooling feedback.

- [x] **Step 3: Run focused bug pass**

Run: `node dist/cli.js verify -- npm test -- tests/commands/history.test.ts`

Expected: PASS with AgentFlight evidence recorded.

- [x] **Step 4: Run full verification**

Run:

```bash
npm run verify
npm run format:check
npm pack --dry-run
npm audit --audit-level=moderate
npx projscan@latest doctor --format json
npx projscan@latest preflight --mode before_commit --format json
npx projscan@latest review --format json
npx agentloopkit@latest verify
```

Expected: normal checks pass; ProjScan may report the known accumulated scale caution without concrete blockers.

- [x] **Step 5: Dogfood the built CLI**

Run:

```bash
npm run build
node dist/cli.js history --limit 2
node dist/cli.js handoff
npx agentloopkit@latest check-gates
```

Expected: history shows `Latest action:` and the handoff/check-gates evidence remains local.

- [x] **Step 6: Commit intended files only**

Stage only source, tests, docs, changelog, devlog, and AgentLoop task/handoff evidence. Do not stage `.agentflight/sessions`, `.agentflight/reports`, `.agentflight/current`, or `.agentflight/evidence`.

Commit message: `Show latest action in history output`.
