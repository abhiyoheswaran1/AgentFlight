# Parallel Artifact Event Preservation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve report, replay, and resume session events when artifact commands run concurrently.

**Architecture:** Keep artifact rendering unchanged. Use `appendSessionEvent(...)` for persistence so each command merges its event into the latest locked session, while still using a local `addSessionEvent(...)` copy for artifact timeline rendering.

**Tech Stack:** TypeScript, Vitest, AgentFlight session persistence.

---

### Task 1: Red Test

**Files:**

- Modify: `tests/commands/evidence-output.test.ts`

- [x] Add a test that runs `runReportCommand`, `runReplayCommand`, and `runResumeCommand` concurrently for the same session.
- [x] Assert the persisted current session contains `report_generated`, `replay_generated`, and `resume_generated` events.
- [x] Assert the returned artifact paths are present.
- [x] Run `npm test -- tests/commands/evidence-output.test.ts tests/core/session.test.ts` and confirm the new test fails with a missing artifact event.

### Task 2: Minimal Implementation

**Files:**

- Modify: `src/commands/report.ts`
- Modify: `src/commands/replay.ts`
- Modify: `src/commands/resume.ts`

- [x] Build the artifact event input once in each command.
- [x] Use `addSessionEvent(...)` only for local rendering.
- [x] Use `appendSessionEvent(...)` for persisted session updates.
- [x] Run the focused test command and confirm it passes.

### Task 3: Docs and Smoke

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`
- Modify: `docs/superpowers/plans/2026-06-21-parallel-artifact-event-preservation.md`

- [x] Add an unreleased changelog note for concurrent artifact event preservation.
- [x] Add a devlog entry with dogfood finding, persona readout, implementation, and verification evidence.
- [x] Dogfood parallel built `report`, `replay`, and `resume`, then confirm `history` shows the latest recorded readiness.

### Task 4: Verification and Handoff

**Files:**

- Archive: `.agentloop/tasks/archive/2026-06-21-preserve-artifact-events-during-parallel-commands.md`
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
