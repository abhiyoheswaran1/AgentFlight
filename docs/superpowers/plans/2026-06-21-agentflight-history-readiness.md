# AgentFlight History Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve compact review-readiness metadata when AgentFlight generates report/replay artifacts and show that signal in `agentflight history`.

**Architecture:** Report and replay already compute risk, verification, and Review Intelligence. Add one shared session helper that records the compact artifact summary and one session-summary reader that extracts the latest valid recorded summary without recalculating old sessions.

**Tech Stack:** TypeScript, Vitest, local AgentFlight session JSON.

---

### Task 1: Red Tests For Recorded Readiness

**Files:**

- Modify: `tests/core/session.test.ts`
- Modify: `tests/commands/history.test.ts`
- Modify: `tests/commands/evidence-output.test.ts`

- [x] Add a session-summary test that saves report/replay events with readiness metadata and expects `listSessionSummaries()` to expose the latest valid summary.
- [x] Add a session-summary test that saves malformed readiness metadata and expects `latestReview` to remain undefined.
- [x] Add a history-command test expectation for a visible readiness line when metadata is present and a calm `not recorded` line for older sessions.
- [x] Add an evidence-output test that generates report and replay artifacts and expects both events to store path plus state, label, risk level, changed-file count, and verification counts.
- [x] Run `npm test -- tests/core/session.test.ts tests/commands/history.test.ts tests/commands/evidence-output.test.ts` and confirm the new tests fail because the metadata and history line do not exist yet.

### Task 2: Session Metadata Helper

**Files:**

- Modify: `src/core/session.ts`

- [x] Add a `SessionReviewSummary` interface with `state`, `label`, `riskLevel`, `changedFiles`, `verificationPassed`, `verificationFailed`, `artifactPath`, and `generatedAt`.
- [x] Add a `buildArtifactReviewMetadata()` helper that stores the compact summary under `metadata.readiness` while preserving the existing `metadata.path`.
- [x] Add guarded parsing for `metadata.readiness` so missing or malformed data is ignored rather than throwing.
- [x] Include `latestReview` on `SessionSummary` by scanning report/replay events from newest to oldest.

### Task 3: Persist Report And Replay Readiness

**Files:**

- Modify: `src/commands/report.ts`
- Modify: `src/commands/replay.ts`

- [x] Replace the hand-built report metadata with `buildArtifactReviewMetadata()`.
- [x] Replace the hand-built replay metadata with `buildArtifactReviewMetadata()`.
- [x] Keep existing artifact paths and rendered report/replay behavior unchanged.

### Task 4: History Output

**Files:**

- Modify: `src/commands/history.ts`

- [x] Add a `Readiness:` line to each session in history output.
- [x] When `latestReview` exists, show label, risk, and changed-file count; keep proof totals on the existing `Verification:` line.
- [x] When no recorded summary exists, show `Readiness: not recorded`.
- [x] Keep existing report/replay path checks and current-session marker unchanged.

### Task 5: Verification And Handoff

**Files:**

- Update task/handoff artifacts only through AgentLoopKit and AgentFlight commands.

- [x] Run focused tests: `npm test -- tests/core/session.test.ts tests/commands/history.test.ts tests/commands/evidence-output.test.ts`.
- [x] Run full checks: `npm run verify`, `npm run format:check`, `npm pack --dry-run`, `npm audit --audit-level=moderate`.
- [x] Run product checks: `npx projscan@latest doctor --format json`, `npx projscan@latest preflight --mode before_commit --format json`, `npx agentloopkit@latest verify`.
- [x] Dogfood the updated CLI with `node dist/cli.js report`, `node dist/cli.js replay`, `node dist/cli.js history`, and `node dist/cli.js handoff`.
- [ ] Complete and archive the AgentLoop task, then commit only intended files.
