# First-Run Generated Gitignore Priority Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `.agentflight/.gitignore` visible in first-run review focus while ranking it below real app changes and `.agentflight/config.json`.

**Architecture:** Reuse the existing generated-guidance-file scoring path in `src/core/review-intelligence.ts`. Treat `.agentflight/.gitignore` as a low-priority generated helper with AgentFlight-specific reviewer focus instead of the ProjScan memory guidance.

**Tech Stack:** TypeScript, Vitest, AgentFlight Review Intelligence.

---

### Task 1: Add The Failing Ranking Test

**Files:**

- Modify: `tests/core/review-intelligence.test.ts`
- Modify: `tests/commands/evidence-output.test.ts`

- [x] Add a core Review Intelligence test where changed files are `[".agentflight/.gitignore", ".agentflight/config.json", "README.md", ".projscan-memory/memory.json"]` and expected focus order is `[".agentflight/config.json", "README.md", ".agentflight/.gitignore", ".projscan-memory/memory.json"]`.
- [x] Add command-output coverage showing handoff review focus keeps `.agentflight/.gitignore` below `README.md` when both appear.
- [x] Run `node dist/cli.js verify -- npm test -- tests/core/review-intelligence.test.ts tests/commands/evidence-output.test.ts` and confirm the new assertion fails before production code changes.

### Task 2: Implement Narrow Generated-Helper Scoring

**Files:**

- Modify: `src/core/review-intelligence.ts`

- [x] Add `.agentflight/.gitignore` to the generated guidance file set.
- [x] Split generated guidance display copy so `.projscan-memory/memory.json` keeps the current filter suggestion and `.agentflight/.gitignore` says it keeps AgentFlight runtime evidence out of git while leaving config visible.
- [x] Keep `.agentflight/config.json` classified as AgentFlight project config and keep `.projscan-memory/**` suggestion-only.
- [x] Rerun the focused test command and confirm it passes.

### Task 3: Docs, Bug Pass, And Handoff

**Files:**

- Modify: `AGENTFLIGHT_DEVLOG.md`
- Modify: `CHANGELOG.md`
- Modify: `.agentloop/tasks/2026-06-21-dogfood-next-first-run-workspace-hygiene-friction.md`

- [x] Record temp-app dogfood evidence and the final behavior in the devlog.
- [x] Add a concise changelog entry under `Unreleased`.
- [x] Run `npm run verify`, `npm run format:check`, `npm pack --dry-run`, ProjScan doctor/preflight, and AgentLoopKit verify.
- [x] Archive the AgentLoop task and write handoff evidence.
