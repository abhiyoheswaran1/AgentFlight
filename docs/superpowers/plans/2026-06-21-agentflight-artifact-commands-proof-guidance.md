# AgentFlight Artifact Commands Proof Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent AgentFlight artifact/readout commands from being promoted as suggested proof while keeping captured verification evidence intact.

**Architecture:** Keep the behavior inside Review Intelligence, where proof kinds, proof gaps, and readiness decisions are already derived. Add a narrow classifier for AgentFlight readout/artifact commands and use it only when deciding whether an incomplete verification attempt should become a blocking proof gap.

**Tech Stack:** TypeScript, Vitest, existing AgentFlight session and Review Intelligence types.

---

### Task 1: Regression Tests

**Files:**

- Modify: `tests/core/review-intelligence.test.ts`

- [ ] **Step 1: Write failing tests**

Add tests that build a session with a changed source file, configured proof command, and an unfinished verification event for `node dist/cli.js replay` or `agentflight replay`. Assert that:

```ts
expect(review.proofGaps.map((gap) => gap.id)).not.toContain("incomplete-verification");
expect(review.proofGaps).toContainEqual(
  expect.objectContaining({
    id: "missing-source-proof",
    suggestedCommand: "npm test"
  })
);
expect(review.readiness).toMatchObject({
  state: "needs_verification",
  suggestedCommand: "npm test"
});
```

Add a guard test that an unfinished real command such as `npm test` still creates an `incomplete-verification` proof gap.

- [ ] **Step 2: Verify red**

Run:

```bash
npm test -- tests/core/review-intelligence.test.ts
```

Expected: the new artifact-command test fails because the current implementation reports `incomplete-verification` with `node dist/cli.js replay`.

### Task 2: Minimal Implementation

**Files:**

- Modify: `src/core/review-intelligence.ts`

- [ ] **Step 1: Add a narrow helper**

Add a private helper that recognizes AgentFlight readout/artifact commands:

```ts
function isAgentFlightReadoutCommand(command: string): boolean {
  const normalized = normalizeCommand(command).toLowerCase();
  return /(?:^|\s)(?:agentflight|node\s+dist\/cli\.js)\s+(?:status|report|replay|resume|handoff|history|doctor)\b/.test(
    normalized
  );
}
```

- [ ] **Step 2: Filter only incomplete artifact attempts**

Use the helper in `detectIncompleteVerificationAttempts` so unfinished AgentFlight readout/artifact commands do not become blocking proof gaps. Do not change failed-run handling, proof-kind classification, raw evidence, or command capture.

- [ ] **Step 3: Verify green**

Run:

```bash
npm test -- tests/core/review-intelligence.test.ts
```

Expected: the new and existing Review Intelligence tests pass.

### Task 3: Bug Pass

**Files:**

- Review: `src/core/review-intelligence.ts`
- Review: `tests/core/review-intelligence.test.ts`

- [ ] **Step 1: Inspect edge cases**

Confirm the filter does not hide:

```text
npm test
npm run build
npx agentflight verify -- npm test
failed verification runs
```

- [ ] **Step 2: Run verification**

Run:

```bash
npm run verify
npm run format:check
npm pack --dry-run
npm audit --audit-level=moderate
npx projscan@latest doctor --format json
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest verify
```

Expected: normal checks pass. ProjScan may return the known scale/manual-signoff caution, but no concrete blocker should appear.
