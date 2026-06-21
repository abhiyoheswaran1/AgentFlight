# Public Positioning Regression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep public AgentFlight copy aligned with coding-agent and agentic-engineering positioning.

**Architecture:** Add one focused Vitest regression test that scans current public/runtime surfaces for stale assistant-style phrases. Update the one stale public architecture doc phrase; leave historical devlog evidence and archived task contracts untouched.

**Tech Stack:** TypeScript, Vitest, Node filesystem APIs.

---

### Task 1: Add Failing Public Copy Scan

**Files:**

- Create: `tests/public-positioning.test.ts`

- [x] Add a Vitest test that reads a fixed list of public/runtime files and fails if they contain `AI-assisted`, `AI coding`, `AI-agent`, or `coding assistant`.
- [x] Include `docs/architecture/overview.md` in the scanned file list.
- [x] Exclude `AGENTFLIGHT_DEVLOG.md`, `.agentloop/tasks/archive/**`, and `docs/superpowers/plans/**` so historical evidence is preserved.
- [x] Run `node dist/cli.js verify -- npm test -- tests/public-positioning.test.ts` and confirm it fails on `docs/architecture/overview.md`.

### Task 2: Update Public Architecture Copy

**Files:**

- Modify: `docs/architecture/overview.md`

- [x] Replace `AI-assisted coding sessions` with `coding agent sessions`.
- [x] Do not broaden the architecture document or change runtime behavior.
- [x] Rerun `node dist/cli.js verify -- npm test -- tests/public-positioning.test.ts` and confirm it passes.

### Task 3: Docs, Bug Pass, And Handoff

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] Add a concise changelog entry under `Unreleased`.
- [x] Record the stale-copy finding, test scope, and verification evidence in the devlog.
- [x] Run the full bug pass from the task contract.
- [x] Archive the AgentLoop task and write handoff evidence.
- [x] Prepare the scoped docs, tests, plan, task, and handoff files for commit.
