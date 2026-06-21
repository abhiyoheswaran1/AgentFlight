# Ready Handoff Sharing Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ready handoff terminal guidance match the current handoff-first review workflow.

**Architecture:** Keep the behavior inside the existing handoff formatter. The ready state should name the handoff packet as the primary artifact and keep report/replay as supporting evidence without changing artifact generation, readiness, or blocked-state behavior.

**Tech Stack:** TypeScript, Vitest, AgentFlight CLI fixtures.

---

### Task 1: Ready Handoff Copy

**Files:**

- Modify: `tests/commands/evidence-output.test.ts`
- Modify: `src/commands/handoff.ts`
- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] **Step 1: Write the failing test**

Update the ready handoff test to expect:

```ts
expect(handoff.output).toContain(
  "Share the local handoff packet for scoped review; use report/replay for details."
);
expect(handoff.output).not.toContain("Share this handoff with the report/replay");
```

Keep the blocked handoff assertion that the old ready-only line is absent.

- [x] **Step 2: Run the focused test and verify it fails**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/commands/evidence-output.test.ts
```

Expected: the ready handoff test fails because the old copy is still rendered.

Observed: AgentFlight-captured run failed at
`tests/commands/evidence-output.test.ts:743` because the new handoff-packet
copy was not present yet.

- [x] **Step 3: Implement the minimal formatter change**

Change only the ready branch in `formatNextAction`:

```ts
if (readiness.state === "ready_for_review") {
  return "Share the local handoff packet for scoped review; use report/replay for details.";
}
```

- [x] **Step 4: Run the focused test and verify it passes**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/commands/evidence-output.test.ts
```

Expected: all tests in the file pass.

Observed: AgentFlight-captured run passed with 1 file / 35 tests.

- [x] **Step 5: Update docs**

Add brief bullets to `CHANGELOG.md` and `AGENTFLIGHT_DEVLOG.md` explaining that ready handoff copy now points to the local handoff packet first.

- [x] **Step 6: Bug pass**

Run:

```bash
node dist/cli.js verify -- npm run verify
node dist/cli.js verify -- npm run format:check
node dist/cli.js verify -- npm pack --dry-run
npx projscan@latest doctor --format json
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest verify
agentloop check-gates
node dist/cli.js status
git diff --check
```

Expected: checks pass or only documented scale/signoff cautions remain.

Observed:

- AgentFlight-captured `npm run verify` passed with 23 files / 212 tests plus
  build.
- AgentFlight-captured `npm run format:check` failed once on this plan doc,
  then passed after Prettier formatting.
- AgentFlight-captured `npm pack --dry-run` passed.
- `git diff --check` passed.
- AgentFlight-captured ProjScan doctor passed with score 100/A.
- AgentFlight-captured ProjScan preflight requested full review.
- AgentFlight-captured ProjScan review returned the known scale/manual-signoff
  block: max changed-file risk score 215.8 >= 80, with empty cycle,
  risky-function, contract, taint, and dataflow arrays.
- AgentFlight-captured AgentLoopKit verification passed.
