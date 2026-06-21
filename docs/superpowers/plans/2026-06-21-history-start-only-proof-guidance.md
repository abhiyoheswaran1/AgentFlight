# History Start-Only Proof Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `agentflight history` teach proof before handoff for current start-only sessions.

**Architecture:** Keep history read-only and artifact selection unchanged. Adjust only the top-level latest-action guidance when the current latest session has no artifacts, based on whether any verification run has been recorded.

**Tech Stack:** TypeScript, Vitest, AgentFlight history command tests.

---

### Task 1: Add Failing History Guidance Coverage

**Files:**

- Modify: `tests/commands/history.test.ts`

- [x] Update the current start-only/no-artifact test so a session with zero verification runs expects `Next: run agentflight verify, then agentflight handoff`.
- [x] Add or preserve coverage that a current session with verification runs but no artifacts still expects `Next: run agentflight handoff`.
- [x] Preserve previous-artifact fallback coverage for current sessions with no artifacts.
- [x] Run `node dist/cli.js verify -- npm test -- tests/commands/history.test.ts` and confirm the no-verification expectation fails before production changes.

### Task 2: Select Next Action From Verification Presence

**Files:**

- Modify: `src/commands/history.ts`

- [x] Add a small helper that detects whether a session has any recorded verification run from passed, failed, unresolved, or resolved counts.
- [x] Use that helper in `formatLatestAction` only when the current latest session has `Open first: none yet`.
- [x] Return `Next: run agentflight verify, then agentflight handoff` when there is no verification.
- [x] Keep `Next: run agentflight handoff` when verification exists but no handoff/report/replay artifact exists yet.
- [x] Rerun `node dist/cli.js verify -- npm test -- tests/commands/history.test.ts` and confirm it passes.

### Task 3: Docs, Bug Pass, And Handoff

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] Add a concise changelog entry under `Unreleased`.
- [x] Record the dogfood finding, implementation, and verification evidence in the devlog.
- [x] Run the full bug pass from the task contract.
- [x] Archive the AgentLoop task and write handoff evidence.
- [x] Prepare the scoped source, test, docs, plan, task, and handoff files for commit.
