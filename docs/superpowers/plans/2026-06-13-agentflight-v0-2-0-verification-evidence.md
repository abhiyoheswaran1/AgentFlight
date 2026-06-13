# AgentFlight v0.2.0 Verification Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real local verification evidence capture and make status, report, replay, and resume outputs use that proof honestly.

**Architecture:** Add a focused verification runner in `src/core/verification.ts` that uses safe `spawn`/argument arrays, writes raw stdout/stderr under `.agentflight/evidence/`, and appends structured runs to the current session. Keep `src/commands/verify.ts` thin, and update renderers/commands to compute review readiness from session proof plus changed-file risk.

**Tech Stack:** Node.js 20+, TypeScript, commander, Vitest, local JSON/Markdown/HTML artifacts, ProjScan, AgentLoopKit.

---

### Task 1: Verification Data Model

**Files:**

- Modify: `src/types/index.ts`
- Modify: `src/core/session.ts`
- Test: `tests/core/session.test.ts`

- [ ] Add `VerificationRun` with `command`, `startedAt`, `finishedAt`, `durationMs`, `exitCode`, `status`, `stdoutPath`, and `stderrPath`.
- [ ] Add optional `verificationRuns` to `AgentFlightSession`.
- [ ] Add a compatibility helper so v0.1 sessions without `verificationRuns` behave as an empty list.

### Task 2: Verification Runner

**Files:**

- Modify: `src/core/verification.ts`
- Test: `tests/core/verification.test.ts`

- [ ] Write failing tests for passing command capture.
- [ ] Write failing tests for failing command capture that records failure instead of throwing.
- [ ] Implement safe `spawn` execution without shell interpolation.
- [ ] Store stdout/stderr files under `.agentflight/evidence/<session-id>/`.

### Task 3: Verify Command

**Files:**

- Create: `src/commands/verify.ts`
- Modify: `src/cli.ts`
- Test: `tests/commands/verify.test.ts`

- [ ] Write failing tests for `agentflight verify -- <command>`.
- [ ] Write failing tests for `agentflight verify` using configured commands from `.agentflight/config.json`.
- [ ] Append verification runs to `.agentflight/current/session.json` and the session file under `.agentflight/sessions/`.
- [ ] Return a non-zero exit code when any verification command failed, after evidence is written.

### Task 4: Evidence-Aware Outputs

**Files:**

- Modify: `src/commands/status.ts`, `src/commands/report.ts`, `src/commands/replay.ts`, `src/commands/resume.ts`
- Modify: `src/renderers/markdown-report.ts`, `src/renderers/html-replay.ts`, `src/renderers/resume-prompt.ts`
- Test: existing command/renderer tests plus new evidence cases

- [ ] Status answers what changed, risk, proof present, proof missing, readiness, and next action.
- [ ] Report includes verification evidence and a recommendation: ready, not ready, blocked, or unknown.
- [ ] Replay shows verification cards and generated-by copy.
- [ ] Resume includes verification gaps and exact next command.

### Task 5: Docs, Dogfooding, And Checks

**Files:**

- Modify: `README.md`, `CHANGELOG.md`, `AGENTFLIGHT_DEVLOG.md`
- Modify: `docs/development/verification.md`, `docs/development/dogfooding.md`
- Modify: `.gitignore`

- [ ] Document `.agentflight/evidence/` as local ignored runtime data.
- [ ] Dogfood `agentflight verify -- npm run typecheck` and one failing command.
- [ ] Run `npm run verify`, `npm run format:check`, ProjScan, and AgentLoopKit checks.
- [ ] Do not publish, tag, or create a release.
