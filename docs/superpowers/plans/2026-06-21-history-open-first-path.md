# History Open First Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `agentflight history` faster to scan by putting the chosen artifact path directly on the `Open first` line.

**Architecture:** Keep history read-only and reuse the artifact-path lookup it already performs. Change only the display helper that chooses the first artifact, leaving all artifact lines intact for complete context.

**Tech Stack:** TypeScript, Vitest, Markdown docs, AgentFlight/AgentLoopKit/ProjScan dogfood.

---

### Task 1: Output Regression

**Files:**

- Modify: `tests/commands/history.test.ts`

- [x] Add failing expectations for `Open first: replay <path>`, `Open first: report <path>`, and `Open first: handoff <path>`.
- [x] Keep `Open first: none yet` covered for sessions without artifacts.
- [x] Run `npm test -- tests/commands/history.test.ts` and confirm the new expectations fail.

### Task 2: Minimal History Formatting

**Files:**

- Modify: `src/commands/history.ts`

- [x] Change the open-first formatter to return both artifact label and path when a path exists.
- [x] Preserve existing artifact path lines and repo-relative formatting.
- [x] Run the focused history test and confirm it passes.

### Task 3: Evidence Notes

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] Add a concise changelog note for the history scanability polish.
- [x] Add devlog evidence with dogfood rationale, persona readout, implementation summary, and verification results.

### Task 4: Bug Pass and Handoff

**Files:**

- Archive: `.agentloop/tasks/archive/2026-06-21-show-open-first-path-in-history.md`
- Create: `.agentloop/handoffs/*`

- [x] Run `npm test -- tests/commands/history.test.ts`.
- [x] Run `npm run verify`.
- [x] Run `npm run format:check`.
- [x] Run `npm pack --dry-run`.
- [x] Run `npm audit --audit-level=moderate`.
- [x] Run ProjScan doctor/preflight/review and document any scale-only caution.
- [x] Run AgentLoopKit verification.
- [x] Generate handoffs, archive the task, run gates, and commit only intended files.
