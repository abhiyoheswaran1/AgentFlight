# AgentFlight History Handoff Artifacts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let `agentflight history` point engineers to stable local handoff artifacts for prior sessions.

**Architecture:** Preserve `.agentflight/current/handoff.md` as the current-session pointer. Also write a session-specific `.agentflight/reports/<session-id>-handoff.md` when `agentflight handoff` runs, then have `history` display that path when it exists.

**Tech Stack:** TypeScript, Vitest, AgentFlight local artifact files.

---

### Task 1: Red Tests

**Files:**

- Modify: `tests/commands/evidence-output.test.ts`
- Modify: `tests/commands/history.test.ts`

- [x] Add a handoff-command assertion that `agentflight handoff` writes `.agentflight/reports/<session-id>-handoff.md` while preserving `.agentflight/current/handoff.md`.
- [x] Add a history assertion that an existing session handoff path appears as `Handoff: .agentflight/reports/<session-id>-handoff.md`.
- [x] Assert missing handoff artifacts show `Handoff: missing`.
- [x] Run `npm test -- tests/commands/evidence-output.test.ts tests/commands/history.test.ts` and confirm the new assertions fail.

### Task 2: Session-Specific Handoff Artifact

**Files:**

- Modify: `src/commands/handoff.ts`

- [x] Add a `sessionHandoffPath` result field without changing the existing `handoffPath` current-pointer field.
- [x] Write the rendered handoff to both `.agentflight/current/handoff.md` and `.agentflight/reports/<session-id>-handoff.md`.
- [x] Include both the stable handoff path and current handoff pointer in the artifact list.

### Task 3: History Display

**Files:**

- Modify: `src/commands/history.ts`

- [x] Look for `.agentflight/reports/<session-id>-handoff.md`.
- [x] Add a `Handoff:` line before `Report:` and `Replay:`.
- [x] Preserve report/replay path behavior, current marker, readiness, malformed-session handling, and invalid-limit behavior.

### Task 4: Docs And Verification

**Files:**

- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] Update history docs to mention handoff/report/replay paths.
- [x] Run focused tests: `npm test -- tests/commands/evidence-output.test.ts tests/commands/history.test.ts`.
- [x] Run full checks: `npm run verify`, `npm run format:check`, `npm pack --dry-run`, `npm audit --audit-level=moderate`.
- [x] Run product checks: `npx projscan@latest doctor --format json`, `npx projscan@latest preflight --mode before_commit --format json`, `npx agentloopkit@latest verify`.
- [x] Dogfood `agentflight handoff` then `agentflight history --limit 1` and confirm the stable handoff path appears.
- [x] Complete and archive the AgentLoop task, then commit only intended files.
