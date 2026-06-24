# Role-Aware Review Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add source-free reviewer routing so AgentFlight tells maintainers, verification reviewers, security reviewers, docs/DX reviewers, and release reviewers what they specifically need to inspect.

**Architecture:** Extend `buildReviewIntelligence` to derive reviewer routes from existing local metadata: changed-file categories, proof gaps, proof freshness, Project Review Contract status, Trust Delta, review queue, review receipt, readiness, and calibration. Render the same `reviewRoutes` data through existing status, handoff, report, replay, resume, and JSON surfaces without adding a new command or dependency.

**Tech Stack:** TypeScript, Vitest, existing AgentFlight CLI/renderers.

---

### Task 1: Model And Core Routing

**Files:**

- Modify: `src/types/index.ts`
- Modify: `src/core/review-intelligence.ts`
- Test: `tests/core/review-intelligence.test.ts`

- [ ] **Step 1: Write failing core tests**

Add tests showing:

```ts
expect(review.reviewRoutes?.items).toEqual(
  expect.arrayContaining([
    expect.objectContaining({
      role: "maintainer",
      status: "needs_review",
      priority: 1,
      relatedFiles: expect.arrayContaining(["src/auth/session.ts"])
    }),
    expect.objectContaining({
      role: "verification",
      status: "blocked",
      relatedProofGapIds: expect.arrayContaining(["failed-verification"]),
      suggestedCommand: "npm test"
    }),
    expect.objectContaining({
      role: "security",
      status: "needs_review",
      relatedFiles: expect.arrayContaining(["src/auth/session.ts"])
    })
  ])
);
```

Also cover docs-only, dependency/config release signals, and clean/no-route state.

- [ ] **Step 2: Verify RED**

Run:

```bash
npm test -- tests/core/review-intelligence.test.ts
```

Expected: failing tests because `reviewRoutes` does not exist.

- [ ] **Step 3: Add types and builder**

Add:

```ts
export type ReviewRouteRole = "maintainer" | "verification" | "security" | "docs_dx" | "release";
export type ReviewRouteStatus = "clear" | "needs_review" | "blocked";

export interface ReviewRouteItem {
  role: ReviewRouteRole;
  label: string;
  status: ReviewRouteStatus;
  priority: number;
  summary: string;
  reason: string;
  relatedFiles: string[];
  suggestedCommand?: string;
  relatedProofGapIds: string[];
}

export interface ReviewRoutes {
  summary: string;
  items: ReviewRouteItem[];
}
```

Build routes from existing review intelligence:

- `verification`: blocked for failed proof, needs review for stale/missing/under-proven proof, clear only when proof is current and relevant.
- `security`: needs review for auth, payment, security, database, dependency, config/CI, and local receipt metadata; blocked only when a blocking proof gap affects those files.
- `docs_dx`: needs review for docs, README, user-facing command/report/replay/resume copy, and docs-only manual review.
- `release`: needs review for package metadata, changelog/devlog/docs release notes, dependency/config changes, ProjScan caution context, or any release-readiness blockers.
- `maintainer`: always present when files changed; points to the highest-ranked review focus and summarizes the main trust state.

Keep outputs source-free: paths, categories, proof gaps, commands, and readiness only.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- tests/core/review-intelligence.test.ts
```

Expected: new and existing review intelligence tests pass.

### Task 2: Shared Display Helpers

**Files:**

- Modify: `src/core/output.ts`
- Test: `tests/core/output.test.ts`

- [ ] **Step 1: Write failing display tests**

Add tests for compact route display:

```ts
expect(formatReviewRoutesForDisplay(routes)).toContain("Maintainer");
expect(formatReviewRoutesForDisplay(routes)).toContain("Verification");
expect(formatReviewRoutesForDisplay(routes)).toContain(
  "Suggested proof: agentflight verify -- npm test"
);
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npm test -- tests/core/output.test.ts
```

Expected: failing test because formatter does not exist.

- [ ] **Step 3: Implement formatter**

Add `formatReviewRoutesForDisplay(routes)` and `formatReviewRouteStatusForDisplay(status)` using existing command compaction helpers. Do not duplicate route formatting inside individual commands.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- tests/core/output.test.ts
```

Expected: output helper tests pass.

### Task 3: CLI And Artifact Rendering

**Files:**

- Modify: `src/commands/status.ts`
- Modify: `src/commands/handoff.ts`
- Modify: `src/commands/resume.ts`
- Modify: `src/renderers/markdown-report.ts`
- Modify: `src/renderers/html-replay.ts`
- Modify: `src/renderers/resume-prompt.ts`
- Test: `tests/commands/workflow.test.ts`
- Test: `tests/renderers/markdown-report.test.ts`
- Test: `tests/renderers/html-replay.test.ts`
- Test: `tests/renderers/resume-prompt.test.ts`

- [ ] **Step 1: Write failing renderer tests**

Assert that status JSON includes `review.reviewRoutes`, terminal handoff/status output includes `Review routing`, Markdown report includes `## Review Routing`, HTML replay includes a `review-routes` section/nav item, and resume prompts include the same role summary.

- [ ] **Step 2: Verify RED**

Run:

```bash
npm test -- tests/commands/workflow.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts
```

Expected: failing tests because route sections are not rendered.

- [ ] **Step 3: Render shared route data**

Thread `review.reviewRoutes` through existing command/render input objects. Use the shared display helper for terminal, handoff, Markdown, and resume. For HTML replay, render a compact route list with escaped text and stable `#review-routes` anchor.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- tests/commands/workflow.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts
```

Expected: renderer and workflow tests pass.

### Task 4: Documentation And Product Copy

**Files:**

- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`
- Modify: `docs/development/product-direction.md`
- Modify: `docs/development/project-review-contract.md`

- [ ] **Step 1: Update docs**

Document role-aware review routing as an existing-surface improvement. Keep public language local-first and agentic-engineering oriented. Avoid “AI coding assistant” phrasing.

- [ ] **Step 2: Run stop-slop pass**

Review public docs for inflated claims, vague “AI” phrasing, and over-broad promises.

### Task 5: Bug, Security, Performance, And Release-Readiness Pass

**Files:**

- Review all changed files.

- [ ] **Step 1: Run focused tests**

```bash
npm test -- tests/core/review-intelligence.test.ts tests/core/output.test.ts tests/commands/workflow.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts
```

- [ ] **Step 2: Run full verification**

```bash
npm run verify
npm run format:check
npm audit --audit-level=moderate
npx projscan@latest doctor --format json
npx projscan@latest preflight --mode before_commit --format json
npx projscan@latest review --format json
npx agentloopkit@latest verify
```

- [ ] **Step 3: Dogfood AgentFlight**

```bash
node dist/cli.js verify -- npm run verify
node dist/cli.js verify -- npm run format:check
node dist/cli.js status
node dist/cli.js handoff
node dist/cli.js report
node dist/cli.js replay
node dist/cli.js resume
```

- [ ] **Step 4: Fix concrete findings**

Fix only concrete blockers, bugs, security risks, performance regressions, or confusing public copy found during the passes. Do not version bump, commit, push, tag, publish, or release.
