# History Malformed Session Paths Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `agentflight history` identify malformed local session files by repo-relative path.

**Architecture:** Keep `history` read-only and reuse `listSessionSummaries` skipped-file data. Format only repo-relative skipped paths in the command layer, cap visible paths, and avoid parser details in the high-density history output.

**Tech Stack:** TypeScript, Vitest, AgentFlight CLI command tests, Markdown docs.

---

### Task 1: Malformed Path Output

**Files:**

- Modify: `tests/commands/history.test.ts`
- Modify: `src/commands/history.ts`

- [x] **Step 1: Write failing tests**

Add history command tests that create malformed session JSON files and assert:

- a single malformed file prints `.agentflight/sessions/broken.json`
- the output does not include the absolute temp repo root
- four malformed files print the first three repo-relative paths plus `... 1 more malformed session file omitted.`

- [x] **Step 2: Verify the tests fail for the current count-only output**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/commands/history.test.ts
```

Expected: fail because `history` prints only the malformed count today.

- [x] **Step 3: Implement minimal history formatting**

Change `formatSkipped` in `src/commands/history.ts` to accept `repoRoot` and skipped entries, then render:

```text
Skipped malformed sessions:
- .agentflight/sessions/broken.json
... 1 more malformed session file omitted.
```

Use `formatRepoRelativePath(repoRoot, skipped.path)` and cap visible paths at three.

- [x] **Step 4: Verify focused tests pass**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/commands/history.test.ts
```

Expected: pass.

### Task 2: Docs, Bug Pass, And Handoff

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`
- Modify: `docs/superpowers/plans/2026-06-21-history-malformed-session-paths.md`
- Update/archive AgentLoop task and generated handoff artifacts through commands only.

- [x] **Step 1: Document the behavior**

Record the small history usability change in `CHANGELOG.md` and `AGENTFLIGHT_DEVLOG.md`.

- [x] **Step 2: Run verification and bug pass**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/commands/history.test.ts
node dist/cli.js verify -- npm run verify
node dist/cli.js verify -- npm run format:check
node dist/cli.js verify -- npm pack --dry-run
npx projscan@latest preflight --mode before_commit --format json
node dist/cli.js verify -- npx agentloopkit@latest verify
```

Expected: focused and full checks pass; ProjScan may report only accumulated scale caution.

- [x] **Step 3: Generate handoff and gates**

Run:

```bash
node dist/cli.js handoff
npx agentloopkit@latest handoff --task .agentloop/tasks/2026-06-21-show-malformed-history-paths.md --report <latest-report>
npx agentloopkit@latest check-gates
```

Expected: gates pass.

- [x] **Step 4: Commit intended files only**

Stage only history source/tests, changelog/devlog, this plan, and AgentLoop task/handoff evidence. Do not stage `.agentflight/sessions`, `.agentflight/reports`, `.agentflight/current`, or `.agentflight/evidence`.

Commit message:

```bash
git commit -m "Show malformed history session paths"
```
