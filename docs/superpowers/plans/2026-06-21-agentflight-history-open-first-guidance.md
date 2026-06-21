# AgentFlight History Open-First Guidance Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or a stricter local TDD loop to implement this plan task-by-task.

**Goal:** Make `agentflight history` tell engineers which existing local artifact to open first for each prior session.

**Architecture:** Keep history read-only. Use recorded readiness metadata when present, then artifact existence. Do not generate missing reports, replays, handoffs, or resumes.

**Tech Stack:** TypeScript, Vitest, AgentFlight local artifact files.

---

### Task 1: Red Tests

**Files:**

- Modify: `tests/commands/history.test.ts`

- [x] Add a ready session with report and replay artifacts; expect `Open first: replay`.
- [x] Add a blocked session with a report artifact; expect `Open first: report`.
- [x] Add a session with no recorded readiness but a handoff artifact; expect `Open first: handoff`.
- [x] Run `npm test -- tests/commands/history.test.ts` and confirm the new assertion fails.

### Task 2: History Guidance

**Files:**

- Modify: `src/commands/history.ts`

- [x] Add an `Open first:` line for each session.
- [x] Prefer replay for ready sessions when replay exists.
- [x] Prefer report for blocked or not-ready sessions when report exists.
- [x] Prefer handoff for unknown-readiness sessions when handoff exists.
- [x] Fall back to `missing` when no primary artifact exists.

### Task 3: Verification And Handoff

**Files:**

- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] Run focused tests: `npm test -- tests/commands/history.test.ts`.
- [x] Run adjacent tests: `npm test -- tests/commands/history.test.ts tests/cli-entrypoint.test.ts tests/commands/evidence-output.test.ts`.
- [x] Run full checks: `npm run verify`, `npm run format:check`, `npm pack --dry-run`, `npm audit --audit-level=moderate`.
- [x] Run product checks: `npx projscan@latest doctor --format json`, `npx projscan@latest preflight --mode before_commit --format json`, `npx agentloopkit@latest verify`.
- [x] Dogfood `agentflight history --limit 1` and confirm `Open first:` appears.
- [ ] Complete and archive the AgentLoop task, then commit only intended files.
