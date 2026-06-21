# Handoff Open First Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `agentflight handoff` faster to act on by putting the selected artifact path directly on the `Open first` line.

**Architecture:** Keep artifact generation and readiness semantics unchanged. Change the handoff renderer to derive the open-first label and path from the existing ready/blocked decision and already formatted report/replay paths.

**Tech Stack:** TypeScript, Vitest, Markdown docs, AgentFlight/AgentLoopKit/ProjScan dogfood.

---

### Task 1: Output Regression

**Files:**

- Modify: `tests/commands/evidence-output.test.ts`

- [x] Add failing ready-handoff expectation for `Open first: replay <path>`.
- [x] Add failing blocked-handoff expectation for `Open first: report <path>`.
- [x] Confirm the artifact list and local-only wording remain covered.
- [x] Run `npm test -- tests/commands/evidence-output.test.ts` and confirm the new expectations fail.

### Task 2: Minimal Handoff Formatting

**Files:**

- Modify: `src/commands/handoff.ts`

- [x] Add a tiny formatter that returns `replay <replayPath>` for ready handoffs and `report <reportPath>` otherwise.
- [x] Preserve current report/replay generation, exit-code behavior, and artifact list.
- [x] Run the focused evidence-output test and confirm it passes.

### Task 3: Evidence Notes

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] Add a concise changelog note for handoff open-first path polish.
- [x] Add devlog evidence with dogfood rationale, persona readout, implementation summary, and verification results.

### Task 4: Bug Pass and Handoff

**Files:**

- Archive: `.agentloop/tasks/archive/2026-06-21-show-open-first-path-in-handoff.md`
- Create: `.agentloop/handoffs/*`

- [x] Run `npm test -- tests/commands/evidence-output.test.ts`.
- [x] Run `npm run verify`.
- [x] Run `npm run format:check`.
- [x] Run `npm pack --dry-run`.
- [x] Run `npm audit --audit-level=moderate`.
- [x] Run ProjScan doctor/preflight/review and document any scale-only caution.
- [x] Run AgentLoopKit verification.
- [x] Generate handoffs, archive the task, run gates, and commit only intended files.
