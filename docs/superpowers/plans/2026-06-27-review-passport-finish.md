# Review Passport Finish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a canonical local Review Passport artifact and an `agentflight finish` command that gives users one end-of-session trust decision and one next action.

**Architecture:** Add `src/core/review-passport.ts` for source-free passport creation, Markdown rendering, integrity fingerprints, and atomic artifact writes. Add `src/commands/finish.ts` as a thin orchestrator around existing report, replay, resume, handoff, Baseframe finalize, and passport creation code. Keep renderer and Review Intelligence behavior intact.

**Tech Stack:** TypeScript, Commander, Vitest, existing AgentFlight command/core modules, local JSON/Markdown artifacts.

---

### Task 1: Core Review Passport

**Files:**

- Create: `src/core/review-passport.ts`
- Modify: `src/types/index.ts`
- Test: `tests/core/review-passport.test.ts`

- [ ] Write failing tests for `createReviewPassport`, `writeReviewPassportArtifacts`, and Markdown rendering.
- [ ] Verify tests fail because the module and types do not exist.
- [ ] Add `ReviewPassportV1`, artifact, integrity, and summary types.
- [ ] Implement source-free passport creation from session, changed files, risk, verification, review, Baseframe result, and artifact paths.
- [ ] Hash command/status/path metadata with SHA-256, never source contents.
- [ ] Write JSON and Markdown artifacts to `.agentflight/reports/<session-id>-review-passport.json|md`.
- [ ] Verify targeted core tests pass.

### Task 2: Finish Command

**Files:**

- Create: `src/commands/finish.ts`
- Modify: `src/cli.ts`
- Test: `tests/commands/finish.test.ts`

- [ ] Write failing tests for standalone `finish`, Baseframe `finish`, and CLI help exposure.
- [ ] Verify tests fail because `finish` does not exist.
- [ ] Implement `runFinishCommand` by reading current status, generating report/replay/resume/handoff, refreshing Baseframe result when context exists, writing the passport, and appending a `review_passport_generated` event.
- [ ] Print readiness, blocking signals, passport paths, report/replay/resume/handoff paths, optional Baseframe result path, and exactly one next action.
- [ ] Register `agentflight finish` in Commander.
- [ ] Export `createReviewPassport` and `ReviewPassportV1`.
- [ ] Verify targeted command tests pass.

### Task 3: Docs And Stop-Slop Pass

**Files:**

- Modify: `README.md`
- Modify: `docs/development/product-direction.md`
- Create: `docs/development/review-passport.md`

- [ ] Add `finish` to the 60-second workflow and command descriptions.
- [ ] Document Review Passport contents, privacy boundary, artifact paths, and Baseframe behavior.
- [ ] Update product direction so Review Passport is the golden-path artifact.
- [ ] Run the stop-slop checklist against public docs: remove filler, passive voice, vague claims, and em dashes.

### Task 4: Bug Pass And Release

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `docs/development/v0.15.0-release-audit.md`

- [ ] Run targeted tests, full tests, typecheck, lint, format check, build, dry pack, audit, ProjScan doctor/preflight, AgentLoop verify, AgentLoop check-gates.
- [ ] Run at least two bug passes: inspect finish output from a standalone fixture and a Baseframe fixture, then inspect JSON/Markdown passport artifacts.
- [ ] Bump to `0.15.0`, update changelog, commit, tag, push, and verify GitHub Release plus npm latest.
