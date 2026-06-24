# Review Receipts And Handoff Staleness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local review receipt and handoff staleness layer so AgentFlight can show whether a handoff was accepted locally and whether that acceptance is still valid after the repo changed.

**Architecture:** Store optional source-free receipt metadata on the session record. Evaluate receipt state inside Review Intelligence using current changed files, commit, proof freshness, and the receipt snapshot. Render the same receipt state across existing surfaces: status, handoff, Markdown report, HTML replay, resume, and history.

**Tech Stack:** TypeScript, Node.js, Vitest, existing AgentFlight session JSON, existing local renderers, no new dependencies.

---

### Task 1: Receipt Data Model And Session Helpers

**Files:**

- Modify: `src/types/index.ts`
- Modify: `src/core/session.ts`
- Test: `tests/core/session.test.ts`

- [ ] **Step 1: Write failing session tests**

Add tests that build a session with review receipt metadata and verify that summaries expose the latest receipt state without affecting verification runs.

- [ ] **Step 2: Run failing tests**

Run:

```bash
npm test -- tests/core/session.test.ts
```

Expected: FAIL because receipt types/helpers do not exist yet.

- [ ] **Step 3: Add receipt types and helpers**

Add optional `reviewReceipts?: ReviewReceipt[]` to `AgentFlightSession`. Add `ReviewReceipt`, `ReviewReceiptState`, and `ReviewReceiptSnapshot` types. Add helpers to append receipts and read latest receipt summaries.

- [ ] **Step 4: Run session tests**

Run:

```bash
npm test -- tests/core/session.test.ts
```

Expected: PASS.

### Task 2: Receipt Evaluation In Review Intelligence

**Files:**

- Modify: `src/types/index.ts`
- Modify: `src/core/review-intelligence.ts`
- Modify: `src/core/output.ts`
- Test: `tests/core/review-intelligence.test.ts`
- Test: `tests/core/output.test.ts`

- [ ] **Step 1: Write failing review tests**

Add tests for accepted current receipts, accepted stale receipts when changed files differ, and stale receipt review queue items.

- [ ] **Step 2: Run failing tests**

Run:

```bash
npm test -- tests/core/review-intelligence.test.ts tests/core/output.test.ts
```

Expected: FAIL because receipt evaluation and display helpers are missing.

- [ ] **Step 3: Implement evaluation**

Build receipt state from the latest receipt and current review inputs. Keep the data source-free: receipt snapshot paths, commit, branch, readiness, proof counts, and current changed paths only.

- [ ] **Step 4: Extend Trust Delta and Review Queue**

Add a `stale_receipt` trust delta item and review queue action so stale receipt acceptance appears before manual file inspection.

- [ ] **Step 5: Run focused tests**

Run:

```bash
npm test -- tests/core/review-intelligence.test.ts tests/core/output.test.ts
```

Expected: PASS.

### Task 3: Handoff Receipt Recording And Terminal Surfaces

**Files:**

- Modify: `src/cli.ts`
- Modify: `src/commands/handoff.ts`
- Modify: `src/commands/status.ts`
- Modify: `src/commands/resume.ts`
- Test: `tests/commands/workflow.test.ts`
- Test: `tests/commands/evidence-output.test.ts`

- [ ] **Step 1: Write failing command tests**

Add tests for `handoff --accept`, current receipt display, stale receipt display, and status JSON receipt fields.

- [ ] **Step 2: Run failing command tests**

Run:

```bash
npm test -- tests/commands/workflow.test.ts tests/commands/evidence-output.test.ts
```

Expected: FAIL because the flag and rendering do not exist.

- [ ] **Step 3: Implement command behavior**

Add `agentflight handoff --accept` as a small flag on the existing command. It records a local receipt only after handoff generation and only when the current readiness is ready for review or clean worktree. Do not add a new top-level command.

- [ ] **Step 4: Render receipt state**

Show receipt state in status, handoff, and resume. Include the same state in `status --format json`.

- [ ] **Step 5: Run command tests**

Run:

```bash
npm test -- tests/commands/workflow.test.ts tests/commands/evidence-output.test.ts
```

Expected: PASS.

### Task 4: Report, Replay, History, And Calibration

**Files:**

- Modify: `src/renderers/markdown-report.ts`
- Modify: `src/renderers/html-replay.ts`
- Modify: `src/renderers/resume-prompt.ts`
- Modify: `src/commands/history.ts`
- Modify: `src/core/proof-calibration.ts`
- Test: `tests/renderers/markdown-report.test.ts`
- Test: `tests/renderers/html-replay.test.ts`
- Test: `tests/renderers/resume-prompt.test.ts`
- Test: `tests/commands/history.test.ts`
- Test: `tests/core/proof-calibration.test.ts`

- [ ] **Step 1: Write failing renderer/history/calibration tests**

Add tests for receipt sections, HTML escaping, history receipt lines, and calibration preference for accepted receipts.

- [ ] **Step 2: Run failing tests**

Run:

```bash
npm test -- tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts tests/commands/history.test.ts tests/core/proof-calibration.test.ts
```

Expected: FAIL because renderers/history/calibration do not read receipt state.

- [ ] **Step 3: Implement rendering and calibration**

Render compact receipt sections. Prefer accepted/current receipt sessions during calibration when available, but keep ready-only sessions as fallback for backward compatibility.

- [ ] **Step 4: Run focused tests**

Run:

```bash
npm test -- tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts tests/commands/history.test.ts tests/core/proof-calibration.test.ts
```

Expected: PASS.

### Task 5: Documentation, Bug Pass, Security Pass, Performance Pass

**Files:**

- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`
- Modify: `docs/development/project-review-contract.md`
- Modify: `docs/development/product-direction.md`

- [ ] **Step 1: Update docs**

Explain review receipts as local, source-free handoff acceptance state. Avoid implying cryptographic sign-off, hosted workflow, or identity verification.

- [ ] **Step 2: Run stop-slop review on public docs**

Review README and changed docs for vague AI phrasing, hype, and stale positioning. Keep “coding agent sessions” and “agentic engineering” phrasing where accurate.

- [ ] **Step 3: Run verification**

Run:

```bash
npm test -- tests/core/review-intelligence.test.ts tests/core/session.test.ts tests/core/proof-calibration.test.ts tests/commands/workflow.test.ts tests/commands/history.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts
npm run verify
npm run format:check
npx projscan@latest doctor --format json
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest verify
```

Expected: normal checks pass. ProjScan may retain a manual scale caution because this builds on the pending Trust Delta release-candidate diff; concrete blockers must be fixed.

- [ ] **Step 4: Dogfood AgentFlight**

Run local AgentFlight status/report/replay/resume/handoff against this work and confirm receipt sections appear in generated artifacts.

---

## Self-Review

- Spec coverage: the plan covers receipt recording, staleness, output surfaces, calibration, docs, and verification.
- Placeholder scan: no TODO/TBD placeholders remain.
- Scope check: this stays inside existing commands and local artifacts. It does not add a hosted workflow, PR comments, CI JSON, or a new release channel.
- Type consistency: `ReviewReceipt`, receipt evaluation, Trust Delta, and review queue names are consistent across tasks.
