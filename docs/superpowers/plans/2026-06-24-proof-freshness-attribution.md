# Proof Freshness Attribution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show which changed files invalidated verification proof, and guide reviewers toward rerun proof or manual review based on those file categories.

**Architecture:** Keep attribution inside the existing proof freshness path in `review-intelligence`. Store a source-free summary on proof gaps and review intelligence, then render that same summary in status, handoff, report, replay, and resume.

**Tech Stack:** TypeScript, Vitest, existing AgentFlight CLI/renderers, local `.agentflight` session metadata.

---

## File Structure

- Modify `src/types/index.ts` to add proof freshness attribution types.
- Modify `src/core/review-intelligence.ts` to classify stale files by category and expose attribution on proof gaps and review intelligence.
- Modify `src/core/output.ts` to format compact attribution lines.
- Modify `src/commands/status.ts` and `src/commands/handoff.ts` to render and carry attribution through JSON.
- Modify `src/renderers/markdown-report.ts`, `src/renderers/html-replay.ts`, and `src/renderers/resume-prompt.ts` to show the same attribution.
- Modify tests in `tests/core/review-intelligence.test.ts`, `tests/commands/evidence-output.test.ts`, and renderer tests.
- Modify README and `docs/development/project-review-contract.md` to explain the user-facing behavior.

## Task 1: Core Attribution

- [ ] **Step 1: Add failing core tests**

Add tests in `tests/core/review-intelligence.test.ts` proving:

```ts
expect(review.proofFreshness?.state).toBe("stale");
expect(review.proofFreshness?.staleCategories).toEqual([
  { category: "docs", files: ["README.md"], proofRequired: false }
]);
expect(review.proofGaps.find((gap) => gap.id === "stale-verification-proof")?.message).toContain(
  "Manual review can cover docs changes"
);
```

and:

```ts
expect(review.proofFreshness?.staleCategories).toEqual([
  { category: "auth", files: ["src/auth/session.ts"], proofRequired: true }
]);
expect(review.proofGaps.find((gap) => gap.id === "stale-verification-proof")?.message).toContain(
  "Rerun verification for auth changes"
);
```

- [ ] **Step 2: Verify the tests fail**

Run:

```bash
npm test -- tests/core/review-intelligence.test.ts
```

Expected: failures because `review.proofFreshness` and attributed stale messages do not exist yet.

- [ ] **Step 3: Implement attribution**

Add types:

```ts
export interface ProofFreshnessCategory {
  category: RiskCategory;
  files: string[];
  proofRequired: boolean;
}

export interface ProofFreshnessAttribution {
  state: "current" | "stale" | "legacy" | "unavailable" | "none";
  reason: string;
  staleFiles: string[];
  staleCategories: ProofFreshnessCategory[];
}
```

Build attribution from `proofFreshness.staleFiles`, `categorizeFile`, and the existing proof-required category rules. Keep it source-free.

- [ ] **Step 4: Verify core tests pass**

Run:

```bash
npm test -- tests/core/review-intelligence.test.ts
```

Expected: pass.

## Task 2: Command And Renderer Output

- [ ] **Step 1: Add failing output tests**

Add tests proving:

```ts
expect(status.output).toContain("Proof freshness:");
expect(status.output).toContain("Docs changed after proof; manual review remains.");
expect(payload.review.proofFreshness).toMatchObject({ state: "stale" });
expect(handoff.output).toContain("Proof freshness:");
```

and HTML escaping:

```ts
expect(html).toContain("&lt;docs&gt;");
expect(html).not.toContain("<docs>");
```

- [ ] **Step 2: Verify renderer tests fail**

Run:

```bash
npm test -- tests/commands/evidence-output.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts
```

Expected: failures because proof freshness attribution is not rendered yet.

- [ ] **Step 3: Render attribution consistently**

Use one display helper in `src/core/output.ts`:

```ts
formatProofFreshnessAttributionForDisplay(attribution);
```

Use it in status, handoff, Markdown report, HTML replay, and resume.

- [ ] **Step 4: Verify output tests pass**

Run:

```bash
npm test -- tests/commands/evidence-output.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts
```

Expected: pass.

## Task 3: Docs And Verification

- [ ] **Step 1: Update docs**

Update README and `docs/development/project-review-contract.md` with a compact description of proof freshness attribution. Keep wording local-first and avoid hosted or policy-enforcement claims.

- [ ] **Step 2: Run focused verification**

Run:

```bash
npm test -- tests/core/review-intelligence.test.ts tests/commands/evidence-output.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts
```

Expected: pass.

- [ ] **Step 3: Run full verification and gates**

Run:

```bash
npm run verify
npm run format:check
npm audit --audit-level=moderate
npx projscan@latest doctor --format json
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest verify
agentloop check-gates
```

Expected: normal checks pass; ProjScan may keep a manual scale sign-off caution with no concrete blockers.

- [ ] **Step 4: Do not commit**

The active AgentLoop task forbids commit, push, tag, publish, release, and version bump before release approval.

## Self-Review

- Spec coverage: The plan covers core attribution, JSON propagation, renderer output, docs, and verification.
- Placeholder scan: No placeholder work remains.
- Type consistency: `ProofFreshnessAttribution` is the shared object threaded through review intelligence and renderers.
