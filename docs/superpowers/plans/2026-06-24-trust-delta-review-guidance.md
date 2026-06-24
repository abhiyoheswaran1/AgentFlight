# Trust Delta Review Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a source-free Trust Delta and sharper review queue to the existing AgentFlight review surfaces.

**Architecture:** Compute Trust Delta once inside `buildReviewIntelligence` from existing proof gaps, proof freshness attribution, Project Review Contract requirements, review focus, unresolved failed proof, and repo calibration. Render the same model through status, handoff, Markdown report, HTML replay, and resume using shared output helpers.

**Tech Stack:** TypeScript, Vitest, existing AgentFlight CLI/report/replay renderers.

---

### Task 1: Model And Core Tests

**Files:**

- Modify: `src/types/index.ts`
- Modify: `src/core/review-intelligence.ts`
- Modify: `src/core/output.ts`
- Test: `tests/core/review-intelligence.test.ts`
- Test: `tests/core/output.test.ts`

- [ ] **Step 1: Write failing Trust Delta tests**

Add tests that expect `review.trustDelta` to summarize failed proof, stale proof-required files, manual-review stale files, missing proof, manual-review requirements, and repo-calibration suggestions. Add tests that expect `review.reviewQueue` to put proof reruns before manual inspection when proof blocks trust.

- [ ] **Step 2: Run focused tests and confirm failure**

Run:

```bash
npm test -- tests/core/review-intelligence.test.ts tests/core/output.test.ts
```

Expected: tests fail because `trustDelta`, `reviewQueue`, and their display helpers do not exist.

- [ ] **Step 3: Add the minimal model**

Add typed `TrustDelta`, `TrustDeltaItem`, `ReviewQueueItem`, and related status/kind unions to `src/types/index.ts`. Implement builder helpers in `src/core/review-intelligence.ts` that derive items from existing local metadata only.

- [ ] **Step 4: Add shared display helpers**

Add compact display helpers in `src/core/output.ts`:

```ts
formatTrustDeltaForDisplay(delta);
formatReviewQueueForDisplay(queue);
formatReviewQueueActionForDisplay(item);
```

They should cap dense lists, compact long commands, and return simple strings for terminal/Markdown surfaces.

- [ ] **Step 5: Run focused tests and refactor**

Run:

```bash
npm test -- tests/core/review-intelligence.test.ts tests/core/output.test.ts
```

Expected: pass.

### Task 2: Terminal, Handoff, And JSON Surfaces

**Files:**

- Modify: `src/commands/status.ts`
- Modify: `src/commands/handoff.ts`
- Test: `tests/commands/workflow.test.ts`

- [ ] **Step 1: Write failing renderer coverage**

Add workflow assertions that `status` and `handoff` include `Trust delta` and `Review queue` when proof is stale/missing, and that status JSON includes `review.trustDelta` and `review.reviewQueue`.

- [ ] **Step 2: Run focused command tests and confirm failure**

Run:

```bash
npm test -- tests/commands/workflow.test.ts
```

Expected: fail because the new sections are not rendered.

- [ ] **Step 3: Render Trust Delta and Review Queue**

Add concise sections after the decision/why block and before `Review first`, keeping existing `Review first` for file-oriented scan.

- [ ] **Step 4: Run focused command tests**

Run:

```bash
npm test -- tests/commands/workflow.test.ts
```

Expected: pass.

### Task 3: Markdown, Replay, And Resume Surfaces

**Files:**

- Modify: `src/renderers/markdown-report.ts`
- Modify: `src/renderers/html-replay.ts`
- Modify: `src/renderers/resume-prompt.ts`
- Test: `tests/renderers/markdown-report.test.ts`
- Test: `tests/renderers/html-replay.test.ts`
- Test: `tests/renderers/resume-prompt.test.ts`

- [ ] **Step 1: Write failing renderer tests**

Add tests that full/compact Markdown reports, HTML replay, and resume prompts show Trust Delta and Review Queue. For HTML, assert visible strings are escaped and jump navigation includes the new section only when review data exists.

- [ ] **Step 2: Run renderer tests and confirm failure**

Run:

```bash
npm test -- tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts
```

Expected: fail because sections are not rendered.

- [ ] **Step 3: Render sections**

Thread the shared display helpers into Markdown and resume. Add HTML-specific cards with escaped text and anchors before required proof.

- [ ] **Step 4: Run renderer tests**

Run:

```bash
npm test -- tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts
```

Expected: pass.

### Task 4: Documentation And Demo Copy

**Files:**

- Modify: `README.md`
- Modify: `docs/development/project-review-contract.md`
- Modify: `docs/development/product-direction.md`
- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [ ] **Step 1: Update user-facing docs**

Describe Trust Delta as source-free local review guidance: what changed the trust state, what proof became stale, what failed, and what remains unsafe to trust. Keep language away from “AI coding assistant.”

- [ ] **Step 2: Update changelog/devlog**

Add an unreleased section for Trust Delta review guidance. Do not bump version.

- [ ] **Step 3: Run docs/content checks**

Run:

```bash
npm run format:check
npm test -- tests/public-positioning.test.ts
```

Expected: pass.

### Task 5: Bug, Security, Performance, And Handoff Pass

**Files:**

- Review all changed source, tests, and docs.

- [ ] **Step 1: Focused regression**

Run:

```bash
npm test -- tests/core/review-intelligence.test.ts tests/core/output.test.ts tests/commands/workflow.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts
```

- [ ] **Step 2: Full verification**

Run:

```bash
npm run verify
npm run format:check
npx projscan@latest doctor --format json
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest verify
```

- [ ] **Step 3: Dogfood AgentFlight**

Run:

```bash
node dist/cli.js verify -- npm run verify
node dist/cli.js status
node dist/cli.js handoff
node dist/cli.js report
node dist/cli.js replay
node dist/cli.js resume
```

- [ ] **Step 4: Handoff**

Use AgentLoopKit to generate handoff evidence, check gates, mark the task ready for review, and stop for release approval. Do not release.
