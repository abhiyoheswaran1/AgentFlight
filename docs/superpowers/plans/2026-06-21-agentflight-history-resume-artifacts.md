# AgentFlight History Resume Artifacts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let `agentflight history` point engineers to stable local resume prompts for prior sessions.

**Architecture:** Preserve `.agentflight/current/resume-prompt.md` as the current-session pointer. Also write a session-specific `.agentflight/reports/<session-id>-resume.md` when `agentflight resume` runs, and have handoff/history display that stable path.

**Tech Stack:** TypeScript, Vitest, AgentFlight local artifact files.

---

### Task 1: Red Tests

**Files:**

- Modify: `tests/commands/evidence-output.test.ts`
- Modify: `tests/commands/history.test.ts`

- [x] Add a resume-command assertion that `agentflight resume` writes `.agentflight/reports/<session-id>-resume.md` while preserving `.agentflight/current/resume-prompt.md`.
- [x] Add a handoff assertion that the artifact list shows the stable resume path plus the current resume pointer.
- [x] Add a history assertion that an existing session resume path appears as `Resume: .agentflight/reports/<session-id>-resume.md`.
- [x] Assert missing resume artifacts show `Resume: missing`.
- [x] Run `npm test -- tests/commands/evidence-output.test.ts tests/commands/history.test.ts` and confirm the new assertions fail.

### Task 2: Session-Specific Resume Artifact

**Files:**

- Modify: `src/commands/resume.ts`

- [x] Add a `sessionResumePath` result field without changing the existing `resumePath` current-pointer field.
- [x] Write the rendered resume prompt to both `.agentflight/current/resume-prompt.md` and `.agentflight/reports/<session-id>-resume.md`.
- [x] Keep resume terminal output unchanged.

### Task 3: Handoff And History Display

**Files:**

- Modify: `src/commands/handoff.ts`
- Modify: `src/commands/history.ts`

- [x] Have handoff list the stable resume path and current resume pointer.
- [x] Have history look for `.agentflight/reports/<session-id>-resume.md`.
- [x] Add a `Resume:` line after `Replay:` while preserving handoff/report/replay behavior.

### Task 4: Docs And Verification

**Files:**

- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] Update history docs to mention handoff/report/replay/resume paths.
- [x] Run focused tests: `npm test -- tests/commands/evidence-output.test.ts tests/commands/history.test.ts`.
- [x] Run full checks: `npm run verify`, `npm run format:check`, `npm pack --dry-run`, `npm audit --audit-level=moderate`.
- [x] Run product checks: `npx projscan@latest doctor --format json`, `npx projscan@latest preflight --mode before_commit --format json`, `npx agentloopkit@latest verify`.
- [x] Dogfood `agentflight handoff` then `agentflight history --limit 1` and confirm the stable resume path appears.
- [ ] Complete and archive the AgentLoop task, then commit only intended files.
