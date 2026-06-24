# Repo-Calibrated Proof Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deterministic local proof calibration that compares the current session against similar ready local handoffs.

**Architecture:** Introduce a small core calibration module that reads bounded local session metadata and attaches a `ProofCalibration` object to `ReviewIntelligence`. Render the same object through existing status, handoff, report, replay, and resume surfaces without adding commands, dependencies, network calls, or release work.

**Tech Stack:** TypeScript, Vitest, existing AgentFlight session JSON, existing renderers.

---

### Task 1: Core Types And Evaluator

**Files:**

- Modify: `src/types/index.ts`
- Create: `src/core/proof-calibration.ts`
- Test: `tests/core/proof-calibration.test.ts`

- [ ] Add `ProofCalibration`, `ProofCalibrationSuggestion`, and related summary types.
- [ ] Implement bounded local session loading from `.agentflight/sessions/*.json`.
- [ ] Implement pure calibration comparison from current categories/proof to historical ready sessions.
- [ ] Test under-proofed suggestions, no-history silence, readiness independence, and source-free behavior.

### Task 2: Review Intelligence Integration

**Files:**

- Modify: `src/core/review-intelligence.ts`
- Modify: `src/types/index.ts`
- Test: `tests/core/review-intelligence.test.ts`

- [ ] Add optional historical sessions to `BuildReviewIntelligenceOptions`.
- [ ] Attach `calibration` to `ReviewIntelligence`.
- [ ] Keep proof gaps and readiness unchanged by calibration-only suggestions.
- [ ] Add regression tests for under-proofed but ready current work.

### Task 3: Command Plumbing

**Files:**

- Modify: `src/commands/status.ts`
- Modify: `src/commands/report.ts`
- Modify: `src/commands/replay.ts`
- Modify: `src/commands/resume.ts`
- Modify: `src/commands/handoff.ts`

- [ ] Load bounded local calibration history in each existing review command.
- [ ] Pass history into `buildReviewIntelligence`.
- [ ] Include calibration in status JSON and handoff parsing.
- [ ] Keep command surface unchanged.

### Task 4: Renderer Output

**Files:**

- Modify: `src/core/output.ts`
- Modify: `src/renderers/markdown-report.ts`
- Modify: `src/renderers/html-replay.ts`
- Modify: `src/renderers/resume-prompt.ts`
- Test: `tests/renderers/markdown-report.test.ts`
- Test: `tests/renderers/html-replay.test.ts`
- Test: `tests/renderers/resume-prompt.test.ts`

- [ ] Add compact display helpers for calibration suggestions.
- [ ] Render `Repo Calibration` consistently.
- [ ] Preserve full commands in HTML titles when truncated.
- [ ] Escape historical command strings in HTML.

### Task 5: Docs And Product Copy

**Files:**

- Modify: `README.md`
- Modify: `docs/development/project-review-contract.md`
- Modify: `docs/examples/basic-agentflight-session.md`
- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [ ] Explain repo-calibrated proof guidance in public docs.
- [ ] Avoid assistant-style positioning and keep local-first boundaries clear.
- [ ] Document that calibration is suggestion-only and local metadata only.

### Task 6: Bug, Security, Performance, And Handoff Pass

**Files:**

- Modify: `.agentloop/tasks/2026-06-24-add-repo-calibrated-proof-guidance.md`
- Generate only local runtime evidence under `.agentflight/` and `.agentloop/`.

- [ ] Run targeted tests first.
- [ ] Run `npm run verify`.
- [ ] Run `npm run format:check`.
- [ ] Run `npm audit --audit-level=moderate`.
- [ ] Run ProjScan doctor and preflight.
- [ ] Run AgentLoopKit verify and gates.
- [ ] Generate AgentFlight and AgentLoop handoffs.
- [ ] Stop before release approval.
