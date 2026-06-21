# Clean Risk Reason Wording Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the zero-change risk reason `No changed files detected yet.` with current-state wording.

**Architecture:** Keep `RiskLevel` and readiness behavior unchanged. Update only the shared zero-change risk reason in `analyzeRisk([])` so status text and JSON use wording that matches a clean committed worktree.

**Tech Stack:** TypeScript, Vitest, AgentFlight status/risk model.

---

### Task 1: Red Tests

**Files:**

- Modify: `tests/core/risk.test.ts`
- Modify: `tests/commands/evidence-output.test.ts`

- [x] Update the zero-changed-file risk test to expect `No changed files are currently detected.`.
- [x] Extend clean status coverage to assert the old `No changed files detected yet.` wording is absent.
- [x] Run `npm test -- tests/core/risk.test.ts tests/commands/evidence-output.test.ts` and confirm the new assertions fail against the current wording.

### Task 2: Minimal Implementation

**Files:**

- Modify: `src/core/risk.ts`

- [x] Replace the zero-change reason string with `No changed files are currently detected.`.
- [x] Keep `RiskLevel`, categories, and non-empty risk reasons unchanged.
- [x] Run the focused test command and confirm it passes.

### Task 3: Docs and Smoke

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`
- Modify: `docs/superpowers/plans/2026-06-21-clean-risk-reason-wording.md`

- [x] Add an unreleased changelog note for the clean risk reason wording.
- [x] Add a devlog entry with dogfood finding, persona readout, implementation, and verification evidence.
- [x] Build the CLI, run `agentflight status` in a clean temp repo, and confirm the current-state reason appears.

### Task 4: Verification and Handoff

**Files:**

- Archive: `.agentloop/tasks/archive/2026-06-21-clarify-clean-risk-reason-wording.md`
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
