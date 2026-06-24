# Project Review Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a repo-specific, local Project Review Contract that tells reviewers which proof this change type requires, which proof exists, what is stale or failed, and which manual checks remain before the work can be trusted.

**Architecture:** Keep the Review Contract as the shared review spine. Add a small Project Review Contract config model, evaluate it inside Review Intelligence, then render the same requirement status through status, handoff, Markdown report, HTML replay, and resume.

**Tech Stack:** TypeScript, Vitest, existing AgentFlight config/session/review-intelligence/rendering modules.

---

### Task 1: Contract Model And Defaults

**Files:**

- Modify: `src/types/index.ts`
- Modify: `src/core/config.ts`
- Test: `tests/core/config.test.ts`

- [ ] Define `ProjectReviewContractConfig`, `ProjectReviewContractRule`, `ProjectReviewRequirement`, and `ProjectReviewRequirementStatus` types.
- [ ] Add `projectReviewContract?: ProjectReviewContractConfig` to `AgentFlightConfig`.
- [ ] Add a default enabled contract in `createDefaultConfig()` with rules for auth/security/payment, database, backend/API, dependencies, config, source, tests, frontend, docs, and AgentFlight config.
- [ ] Keep loading old config files safe by making the field optional everywhere.
- [ ] Add config tests that assert new configs include defaults and old config-shaped objects without the field still type and load safely.

### Task 2: Requirement Evaluation

**Files:**

- Create: `src/core/project-review-contract.ts`
- Modify: `src/core/review-intelligence.ts`
- Test: `tests/core/review-intelligence.test.ts`

- [ ] Evaluate rules against changed file categories and related files.
- [ ] For each matched rule, report required proof as `current`, `covered`, `stale`, `failed`, or `missing`.
- [ ] Preserve the existing failed-verification and stale-proof behavior.
- [ ] Add manual review checks as `needs_review` items that do not hide required automated proof gaps.
- [ ] Prefer configured verification commands as suggested proof when they match required proof kinds.
- [ ] Add tests for auth/session proof, stdout/stderr evidence preservation by non-interference, stale proof, failed proof, manual review checks, docs/manual-only rules, and disabled contract config.

### Task 3: Review Contract Claims

**Files:**

- Modify: `src/core/review-contract.ts`
- Modify: `src/core/output.ts`
- Test: `tests/core/review-contract.test.ts`

- [ ] Add Project Review Contract requirement claims before per-file claims.
- [ ] Include proof references from requirement claims to changed files, proof gaps, and suggested commands.
- [ ] Keep review-path sorting focused on failed, stale, unsupported, then manual-review claims.
- [ ] Update display helpers to label required proof and manual checks compactly.

### Task 4: Command And Renderer Surfaces

**Files:**

- Modify: `src/commands/status.ts`
- Modify: `src/commands/report.ts`
- Modify: `src/commands/replay.ts`
- Modify: `src/commands/resume.ts`
- Modify: `src/commands/handoff.ts`
- Modify: `src/renderers/markdown-report.ts`
- Modify: `src/renderers/html-replay.ts`
- Modify: `src/renderers/resume-prompt.ts`
- Test: `tests/renderers/markdown-report.test.ts`
- Test: `tests/renderers/html-replay.test.ts`
- Test: `tests/renderers/resume-prompt.test.ts`
- Test: `tests/commands/workflow.test.ts`

- [ ] Pass `config?.projectReviewContract` into `buildReviewIntelligence()` in every command that builds review state.
- [ ] Add a compact `Required proof` block to status, handoff, report, replay, and resume.
- [ ] Ensure HTML replay escapes requirement labels, commands, and file paths.
- [ ] Keep JSON output additive by including `review.projectReviewContract`.

### Task 5: Docs And Product Surfaces

**Files:**

- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `DECISIONS.md`
- Create: `docs/development/project-review-contract.md`

- [ ] Explain Project Review Contract as a local proof standard for agentic engineering.
- [ ] Document the `.agentflight/config.json` shape and the default baseline.
- [ ] State that AgentFlight remains local-first with no telemetry, cloud sync, source upload, or model-based extraction.
- [ ] Add an Unreleased changelog section without bumping version.

### Task 6: Bug, Security, Performance, And Verification Passes

**Files:**

- Modify only files needed for fixes discovered during the pass.

- [ ] Run targeted tests and fix failures by root cause.
- [ ] Review diff for misleading readiness, unsafe HTML, noisy output, and config compatibility.
- [ ] Check that no new shell execution path or secret-reading path was added.
- [ ] Check that requirement evaluation is O(rules \* files) and uses small in-memory arrays only.
- [ ] Run `npm run verify`, `npm run format:check`, ProjScan doctor/preflight, and AgentLoopKit verify.
- [ ] Generate AgentLoop handoff and stop for release approval.
