# Compact Start-Only History Sessions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `agentflight history` easier to scan by compacting non-current start-only sessions that have no proof or review artifacts.

**Architecture:** Keep history read-only and keep session ordering unchanged. Add a small command-layer predicate that identifies non-current start-only sessions after artifact lookup, then render a compact note instead of repeated missing artifact lines.

**Tech Stack:** TypeScript, Vitest, AgentFlight local session artifacts.

---

### Task 1: Add Failing History Coverage

**Files:**

- Modify: `tests/commands/history.test.ts`

- [x] Add or update a history test where an older non-current session has no verification, no recorded readiness, and no artifacts.
- [x] Assert that older start-only session remains visible by task title and ID.
- [x] Assert that older start-only session includes `Start only: no verification or review artifacts recorded.`
- [x] Assert that repeated `Handoff: missing`, `Report: missing`, `Replay: missing`, and `Resume: missing` lines do not appear for that older start-only block.
- [x] Assert that the current start-only session path still shows `Open first: none yet` and `Next: run agentflight handoff`.
- [x] Run `node dist/cli.js verify -- npm test -- tests/commands/history.test.ts` and confirm the new assertion fails before production changes.

### Task 2: Implement Compact Formatting

**Files:**

- Modify: `src/commands/history.ts`

- [x] Add a predicate for non-current start-only sessions based on current marker, verification counts, recorded review, and artifact presence.
- [x] In `formatSession`, return the compact start-only note for those sessions.
- [x] Keep current sessions and sessions with any artifact/proof on the existing detailed path.
- [x] Rerun `node dist/cli.js verify -- npm test -- tests/commands/history.test.ts` and confirm it passes.

### Task 3: Dogfood, Docs, Bug Pass, And Handoff

**Files:**

- Modify: `AGENTFLIGHT_DEVLOG.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/development/product-direction.md`
- Modify: `.agentloop/tasks/2026-06-21-compact-start-only-history-sessions.md`

- [x] Dogfood `node dist/cli.js history --limit 5` and confirm the abandoned start-only session is compact.
- [x] Record the finding and implementation in the devlog.
- [x] Add a concise changelog entry under `Unreleased`.
- [x] Run the full bug pass.
- [x] Archive the AgentLoop task and write handoff evidence.
