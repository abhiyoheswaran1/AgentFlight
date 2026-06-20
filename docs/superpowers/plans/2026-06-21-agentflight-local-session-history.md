# AgentFlight Local Session History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a small read-only `agentflight history` command so engineers can find recent local sessions and their report/replay artifacts.

**Architecture:** Keep history listing in `src/core/session.ts` as deterministic session-file reading and sorting. Add a thin `src/commands/history.ts` renderer that formats recent sessions without mutating current state. Wire the command into `src/cli.ts` and cover malformed session files so one bad local JSON file does not crash history.

**Tech Stack:** TypeScript, Commander, Vitest, Node `fs/promises`, existing AgentFlight path/session helpers.

---

### Task 1: Core Session Listing

**Files:**

- Modify: `src/core/session.ts`
- Test: `tests/core/session.test.ts`

- [ ] **Step 1: Write failing core tests**

Add tests that create two valid session JSON files and one malformed JSON file under `.agentflight/sessions/`, then assert `listSessionSummaries(repoRoot)` returns valid sessions newest first with one skipped file.

- [ ] **Step 2: Verify red**

Run: `npm test -- tests/core/session.test.ts`
Expected: fail because `listSessionSummaries` is not exported.

- [ ] **Step 3: Implement minimal core helper**

Add `listSessionSummaries(repoRoot, { limit }?)` to read `.json` files from `.agentflight/sessions/`, parse valid sessions, skip malformed sessions, sort by `startedAt` descending, and return `{ sessions, skipped }`.

- [ ] **Step 4: Verify green**

Run: `npm test -- tests/core/session.test.ts`
Expected: pass.

### Task 2: History Command

**Files:**

- Create: `src/commands/history.ts`
- Modify: `tests/commands/history.test.ts`

- [ ] **Step 1: Write failing command tests**

Cover: newest-first output, current-session marker, verification pass/fail counts, report/replay paths when files exist, missing artifacts shown calmly, malformed sessions summarized without crashing, and empty history.

- [ ] **Step 2: Verify red**

Run: `npm test -- tests/commands/history.test.ts`
Expected: fail because `runHistoryCommand` does not exist.

- [ ] **Step 3: Implement minimal command**

`runHistoryCommand({ repoRoot, limit })` should call the core helper, read the current session if present, check report/replay artifact existence, and render text only. It should not mutate session files or generate artifacts.

- [ ] **Step 4: Verify green**

Run: `npm test -- tests/commands/history.test.ts`
Expected: pass.

### Task 3: CLI, Docs, And Bug Pass

**Files:**

- Modify: `src/cli.ts`
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`
- Modify: `docs/development/product-direction.md`

- [ ] **Step 1: Add CLI command**

Wire `agentflight history` with optional `--limit <count>`.

- [ ] **Step 2: Update docs**

Document `history` as local-only session discovery, not search, export, or cloud sync.

- [ ] **Step 3: Run focused verification**

Run: `node dist/cli.js verify -- npm test -- tests/core/session.test.ts tests/commands/history.test.ts`
Expected: pass after build/CLI wiring.

- [ ] **Step 4: Bug pass**

Run a built-CLI smoke that creates multiple sessions, corrupts one archived session JSON file, and confirms `agentflight history` still completes.

- [ ] **Step 5: Full verification**

Run: `npm run verify`, `npm run format:check`, `npm pack --dry-run`, `npm audit --audit-level=moderate`, `npx projscan@latest doctor --format json`, `npx projscan@latest preflight --mode before_commit --format json`, and `npx agentloopkit@latest verify`.
