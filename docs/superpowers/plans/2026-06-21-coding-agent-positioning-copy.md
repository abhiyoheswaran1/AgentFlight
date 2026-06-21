# Coding Agent Positioning Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace current public/runtime "AI coding" positioning with "coding agent sessions" and agentic engineering language.

**Architecture:** Treat this as a copy-only task. Update CLI/package metadata and current public docs that market or explain AgentFlight. Avoid rewriting historical task contracts or devlog command transcripts except for the new evidence entry.

**Tech Stack:** TypeScript, Vitest, Markdown docs, npm package metadata.

---

### Task 1: CLI And Metadata Copy

**Files:**

- Modify: `tests/cli-entrypoint.test.ts`
- Modify: `src/cli.ts`
- Modify: `package.json`
- Modify: `src/adapters/projscan.ts`

- [x] **Step 1: Write failing CLI copy test**

Update the CLI description test to expect:

```text
Local-first review layer for coding agent sessions.
```

- [x] **Step 2: Verify test fails**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/cli-entrypoint.test.ts
```

Expected: fail because CLI still says `AI coding sessions`.

- [x] **Step 3: Update runtime and package copy**

Update CLI description, start command description, package description, package ProjScan intent, and ProjScan adapter default intent to use coding agent sessions.

- [x] **Step 4: Verify CLI test passes**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/cli-entrypoint.test.ts
```

Expected: pass.

### Task 2: Public Docs Copy

**Files:**

- Modify: `README.md`
- Modify: `PRODUCT.md`
- Modify: `docs/development/product-direction.md`
- Modify: `docs/roadmap/index.md`
- Modify: `docs/marketing/agentflight-v0.6.0-website-update-prompt.md`
- Modify: `docs/assets/agentflight-cli-demo.svg`
- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] **Step 1: Update current public docs**

Replace current marketing/product phrasing with `coding agent sessions`, `coding agents`, or `agentic engineering` where appropriate.

- [x] **Step 2: Check remaining stale current copy**

Run:

```bash
rg -n "AI coding|AI-agent|coding assistant" README.md PRODUCT.md package.json src tests docs/development/product-direction.md docs/roadmap/index.md docs/marketing/agentflight-v0.6.0-website-update-prompt.md docs/assets/agentflight-cli-demo.svg
```

Expected: no matches in current public/runtime surfaces.

### Task 3: Bug Pass And Handoff

**Files:**

- Modify: `docs/superpowers/plans/2026-06-21-coding-agent-positioning-copy.md`
- Update/archive AgentLoop task and generated handoff artifacts through commands only.

- [x] **Step 1: Run full verification and product checks**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/cli-entrypoint.test.ts
node dist/cli.js verify -- npm run verify
node dist/cli.js verify -- npm run format:check
node dist/cli.js verify -- npm pack --dry-run
node dist/cli.js verify -- npx projscan@latest doctor --format json
node dist/cli.js verify -- npx projscan@latest preflight --mode before_commit --format json
node dist/cli.js verify -- npx projscan@latest review --format json
node dist/cli.js verify -- npx agentloopkit@latest verify
```

Result: checks passed; ProjScan returned only the accumulated scale caution/manual review block.

- [x] **Step 2: Generate handoff and gates**

Run:

```bash
node dist/cli.js handoff
npx agentloopkit@latest handoff --task .agentloop/tasks/2026-06-21-align-coding-agent-positioning-copy.md --report <latest-report>
npx agentloopkit@latest check-gates
```

Expected: gates pass.

- [x] **Step 3: Commit intended files only**

Stage copy, tests, package metadata, this plan, and AgentLoop task/handoff evidence. Do not stage `.agentflight/sessions`, `.agentflight/reports`, `.agentflight/current`, or `.agentflight/evidence`.

Commit message:

```bash
git commit -m "Align coding agent positioning copy"
```
