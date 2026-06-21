# Public Positioning Reference Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove remaining stale `AI coding` and `AI-agent` positioning from public docs and changelog entries.

**Architecture:** Keep this docs-only. Update packaged/public docs and marketing notes to use `coding agent sessions` or `coding agents`. Do not rewrite devlog evidence or archived task contracts.

**Tech Stack:** Markdown docs, npm formatting and verification.

---

### Task 1: Public Docs Copy

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `docs/development/dogfooding.md`
- Modify: `docs/roadmap/v0.4.0-review-intelligence-plan.md`
- Modify: `docs/marketing/launch-notes-v0.3.0.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] **Step 1: Update stale public copy**

Replace stale phrases with `coding agent sessions`, `coding agents`, or `agentic engineering` where appropriate.

- [x] **Step 2: Scan public docs**

Run:

```bash
rg -n "AI coding|AI-agent|coding assistant" README.md CHANGELOG.md PRODUCT.md package.json docs/development docs/roadmap docs/marketing docs/assets src tests
```

Expected: no matches outside devlog/task archives.

- [x] **Step 3: Document evidence**

Add a devlog note with the scan result and verification.

### Task 2: Bug Pass And Handoff

**Files:**

- Modify: `docs/superpowers/plans/2026-06-21-public-positioning-reference-cleanup.md`
- Update/archive AgentLoop task and generated handoff artifacts through commands only.

- [x] **Step 1: Run verification**

Run:

```bash
node dist/cli.js verify -- npm run format:check
node dist/cli.js verify -- npm run verify
node dist/cli.js verify -- npm pack --dry-run
node dist/cli.js verify -- npx projscan@latest doctor --format json
node dist/cli.js verify -- npx projscan@latest preflight --mode before_commit --format json
node dist/cli.js verify -- npx projscan@latest review --format json
node dist/cli.js verify -- npx agentloopkit@latest verify
```

Expected: checks pass; ProjScan may return only the accumulated scale caution/manual review block.

- [x] **Step 2: Generate handoff and gates**

Run:

```bash
node dist/cli.js handoff
npx agentloopkit@latest handoff --task .agentloop/tasks/2026-06-21-clean-remaining-public-positioning-references.md --report <latest-report>
npx agentloopkit@latest check-gates
```

Expected: gates pass.

- [x] **Step 3: Commit intended files only**

Stage docs, changelog/devlog, this plan, and AgentLoop task/handoff evidence. Do not stage `.agentflight/sessions`, `.agentflight/reports`, `.agentflight/current`, or `.agentflight/evidence`.

Commit message:

```bash
git commit -m "Clean remaining public positioning references"
```
