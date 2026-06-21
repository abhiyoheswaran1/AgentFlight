# Clean Status Risk Wording Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make clean-worktree status output report explicit no-risk wording instead of `Risk: unknown`.

**Architecture:** Treat zero changed files as an explicit shared risk state in `analyzeRisk([])`. Keep `unknown` valid for older stored metadata and genuinely unknown values, but do not use it for a known clean worktree.

**Tech Stack:** TypeScript, Vitest, AgentFlight status/risk model.

---

### Task 1: Red Tests

**Files:**

- Modify: `tests/core/risk.test.ts`
- Modify: `tests/commands/evidence-output.test.ts`

- [x] Update the zero-changed-file risk test to expect `level: "none"`.
- [x] Extend clean status text/JSON coverage to expect `Risk: none` and JSON `risk.level === "none"`.
- [x] Run `npm test -- tests/core/risk.test.ts tests/commands/evidence-output.test.ts` and confirm the new assertions fail against the current `unknown` behavior.

### Task 2: Minimal Implementation

**Files:**

- Modify: `src/types/index.ts`
- Modify: `src/core/risk.ts`
- Modify: `src/core/session.ts`

- [x] Add `"none"` to the `RiskLevel` union.
- [x] Return `level: "none"` from `analyzeRisk([])`.
- [x] Keep `readRiskLevel` accepting both `"none"` and old `"unknown"` recorded values.
- [x] Run the focused test command and confirm it passes.

### Task 3: Docs and Smoke

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`
- Modify: `docs/superpowers/plans/2026-06-21-clean-status-risk-wording.md`

- [x] Add an unreleased changelog note for clean status risk wording.
- [x] Add a devlog entry with the dogfood finding, persona readout, implementation, and verification evidence.
- [x] Build the CLI, run `agentflight status` after a clean commit, and confirm it shows `Risk: none` with `Readiness: Clean worktree`.

### Task 4: Verification and Handoff

**Files:**

- Archive: `.agentloop/tasks/archive/2026-06-21-report-clean-status-risk-explicitly.md`
- Create: `.agentloop/handoffs/*`

- [x] Run `npm run verify`.
- [x] Run `npm run format:check`.
- [x] Run `npm pack --dry-run`.
- [x] Run `npm audit --audit-level=moderate`.
- [x] Run `npx projscan@latest doctor --format json`.
- [x] Run `npx projscan@latest preflight --mode before_commit --format json` and document any scale-only caution.
- [x] Run `npx projscan@latest review --format json` and document any scale-only block.
- [x] Run `npx agentloopkit@latest verify`.
- [x] Generate AgentFlight and AgentLoopKit handoffs, archive the task, and run gates.
