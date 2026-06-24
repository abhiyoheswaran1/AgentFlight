# Project Review Contract Explainability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the existing Project Review Contract so reviewers can see why each requirement matched, what proof satisfied it, and what remains unsafe to trust.

**Architecture:** Add explainability metadata in the core evaluator, then render the same decision details through existing AgentFlight surfaces. Keep the feature local, deterministic, and source-free.

**Tech Stack:** TypeScript, Vitest, Commander CLI, local Markdown/HTML renderers, AgentLoopKit, ProjScan, AgentFlight.

---

### Task 1: Core Requirement Explainability

**Files:**

- Modify: `src/types/index.ts`
- Modify: `src/core/project-review-contract.ts`
- Test: `tests/core/review-intelligence.test.ts`

- [ ] Add `matchedCategories`, `matchReason`, `satisfiedProof`, `proofReason`, and `remainingReview` to `ProjectReviewRequirementStatus`.
- [ ] Write failing tests that verify auth/session changes explain the matched category, files, current proof command, and remaining manual review.
- [ ] Write failing tests that verify missing proof keeps suggested commands and explains the missing proof state.
- [ ] Implement metadata generation in `evaluateRule`.
- [ ] Preserve legacy-session behavior when `verificationCommands` is missing.
- [ ] Run `npm test -- tests/core/review-intelligence.test.ts`.

### Task 2: Review Contract Evidence

**Files:**

- Modify: `src/core/review-contract.ts`
- Test: `tests/core/review-contract.test.ts`

- [ ] Write failing tests that project requirement claims include match reason, proof reason, satisfied proof evidence, and remaining review evidence.
- [ ] Add proof references for project requirement anchors without source uploads.
- [ ] Run `npm test -- tests/core/review-contract.test.ts`.

### Task 3: Shared Decision Display

**Files:**

- Modify: `src/core/output.ts`
- Modify: `src/commands/status.ts`
- Modify: `src/commands/handoff.ts`
- Test: `tests/commands/evidence-output.test.ts`

- [ ] Add shared helpers for Project Review Contract decision text and requirement detail lines.
- [ ] Write failing command tests for status required-proof details.
- [ ] Write failing handoff tests for the decision-first output.
- [ ] Update status and handoff to use the shared helpers.
- [ ] Run `npm test -- tests/commands/evidence-output.test.ts`.

### Task 4: Report, Replay, Resume Rendering

**Files:**

- Modify: `src/renderers/markdown-report.ts`
- Modify: `src/renderers/html-replay.ts`
- Modify: `src/renderers/resume-prompt.ts`
- Test: `tests/renderers/markdown-report.test.ts`
- Test: `tests/renderers/html-replay.test.ts`

- [ ] Write failing Markdown tests for match reason, satisfied proof, proof reason, and remaining review lines.
- [ ] Write failing HTML tests for the same fields plus escaping.
- [ ] Update renderers to use shared detail helpers where practical.
- [ ] Run `npm test -- tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts`.

### Task 5: Docs and Demo Asset

**Files:**

- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`
- Modify: `docs/development/project-review-contract.md`
- Create: `docs/assets/agentflight-review-contract-decision.svg`

- [ ] Update README positioning around local trust protocol and explainable required proof.
- [ ] Add or update a screenshot-style SVG demo that shows decision, why, and review-first output.
- [ ] Document the new requirement metadata in `docs/development/project-review-contract.md`.
- [ ] Add unreleased changelog/devlog notes.

### Task 6: Bug, Security, Performance, Dogfood

**Files:**

- No planned product file edits unless a bug is found.

- [ ] Run targeted tests.
- [ ] Run `npm run verify`.
- [ ] Run `npm run format:check`.
- [ ] Run `npm pack --dry-run`.
- [ ] Run `npm audit --audit-level=moderate`.
- [ ] Run ProjScan doctor, preflight, and review.
- [ ] Run AgentLoopKit verify.
- [ ] Run AgentFlight status/report/replay/resume/handoff against the current session.
- [ ] Run a synthetic 1,000-file performance benchmark for Review Intelligence and Project Review Contract evaluation.
- [ ] Run a security grep for new command execution, filesystem writes, eval, and unsafe HTML injection paths.
- [ ] Document any remaining ProjScan caution precisely.
