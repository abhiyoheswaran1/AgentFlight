# Generated Tool State Review Ranking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep generated ProjScan memory visible and actionable without letting it outrank real first-run review targets.

**Architecture:** Keep changed-file filtering unchanged and keep `.projscan-memory/**` suggestion-only. Narrow the ranking change to Review Intelligence by suppressing ProjScan risk-score boosting for files already classified as generated guidance.

**Tech Stack:** TypeScript, Vitest, Markdown docs, AgentFlight/AgentLoopKit/ProjScan dogfood.

---

### Task 1: Ranking Regression

**Files:**

- Modify: `tests/core/review-intelligence.test.ts`

- [x] Add a failing test where `.projscan-memory/memory.json` has a high ProjScan risk hint and still ranks below `.agentflight/config.json` and `README.md`.
- [x] Run `npm test -- tests/core/review-intelligence.test.ts` and confirm the new test fails for the expected ordering reason.

### Task 2: Minimal Scoring Fix

**Files:**

- Modify: `src/core/review-intelligence.ts`

- [x] Change focus scoring so generated guidance files do not receive ProjScan risk-score boost.
- [x] Keep the existing generated tool-state reason, focus text, and proof-gap suggestion.
- [x] Run the focused test and confirm it passes.

### Task 3: Evidence Notes

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] Add a concise changelog note for the ranking polish.
- [x] Add devlog evidence with dogfood rationale, persona readout, implementation summary, and verification results.

### Task 4: Bug Pass and Handoff

**Files:**

- Archive: `.agentloop/tasks/archive/2026-06-21-keep-generated-tool-state-below-review-targets.md`
- Create: `.agentloop/handoffs/*`

- [x] Run `npm test -- tests/core/review-intelligence.test.ts`.
- [x] Run `npm run verify`.
- [x] Run `npm run format:check`.
- [x] Run `npm pack --dry-run`.
- [x] Run `npm audit --audit-level=moderate`.
- [x] Run ProjScan doctor/preflight/review and document any scale-only caution.
- [x] Run AgentLoopKit verification.
- [x] Generate handoffs, archive the task, run gates, and commit only intended files.
