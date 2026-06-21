# Clean Status Ledger Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align clean-worktree status ledger copy with the handoff-first review path.

**Architecture:** Change one status text helper and its command test expectation. Do not change artifact generation, evidence capture, JSON output, or readiness decisions.

**Tech Stack:** TypeScript, Vitest, AgentFlight command tests.

---

### Task 1: Add Red Copy Expectation

**Files:**

- Modify: `tests/commands/evidence-output.test.ts`

- [x] Update the clean-worktree status test to expect `open handoff/report/replay or JSON output for the full ledger`.
- [x] Preserve the unresolved-failed-verification assertion that the tucked-details copy is absent.
- [x] Run `node dist/cli.js verify -- npm test -- tests/commands/evidence-output.test.ts` and confirm the copy expectation fails before production changes.

### Task 2: Align Status Copy

**Files:**

- Modify: `src/commands/status.ts`

- [x] Update the tucked verification details string to mention handoff/report/replay or JSON output.
- [x] Do not change conditions for when verification details are tucked or visible.
- [x] Rerun `node dist/cli.js verify -- npm test -- tests/commands/evidence-output.test.ts` and confirm it passes.

### Task 3: Docs, Bug Pass, And Handoff

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] Add a concise changelog entry under `Unreleased`.
- [x] Record the dogfood finding and verification evidence in the devlog.
- [x] Run the full bug pass from the task contract.
- [x] Archive the AgentLoop task and write handoff evidence.
- [x] Prepare the scoped source, test, documentation, plan, task, and handoff files for commit.
