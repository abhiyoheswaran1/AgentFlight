# AgentFlight Repo ProjScan Memory Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply AgentFlight's own suggestion-only ProjScan memory filter to this repo's project config.

**Architecture:** Do not change built-in filters. Store the repo policy in `.agentflight/config.json` through `changedFileFilters.ignore`.

**Tech Stack:** AgentFlight project config, AgentFlight doctor, AgentLoopKit.

---

### Task 1: Capture Current Warning

**Files:**

- Read: `.agentflight/config.json`

- [x] Run `node dist/cli.js doctor` and confirm the generated tool state warning appears.

### Task 2: Add Project Filter

**Files:**

- Modify: `.agentflight/config.json`

- [x] Add `.projscan-memory/**` to `changedFileFilters.ignore`.
- [x] Leave built-in changed-file filters unchanged.

### Task 3: Verify And Handoff

**Files:**

- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] Run `node dist/cli.js doctor` and confirm generated tool state is OK.
- [x] Run `npm run format:check`.
- [x] Run `npm run verify`.
- [x] Run ProjScan and AgentLoopKit checks.
- [x] Archive the AgentLoop task and commit only intended files.
