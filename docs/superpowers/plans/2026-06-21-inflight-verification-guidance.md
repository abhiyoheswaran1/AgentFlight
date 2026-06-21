# In-Flight Verification Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make incomplete-verification guidance honest when status is sampled while a verify command is still running.

**Architecture:** Keep the existing incomplete-verification detection. Change only the shared Review Intelligence message and next action so status/report/replay/resume explain that the command may still be running, with rerun as the fallback when no result appears.

**Tech Stack:** TypeScript, Vitest, AgentFlight CLI fixtures.

---

### Task 1: In-Flight Copy

**Files:**

- Modify: `src/core/review-intelligence.ts`
- Modify: `tests/core/review-intelligence.test.ts`
- Modify: `tests/commands/evidence-output.test.ts`
- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] **Step 1: Write failing tests**

Update incomplete-verification expectations to use:

```text
Verification is still running or did not record a completed result: npm test
```

Update readiness next-action expectations to use:

```text
Wait for the command to finish; if no result appears, rerun agentflight verify -- npm test
```

- [x] **Step 2: Verify red**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/core/review-intelligence.test.ts tests/commands/evidence-output.test.ts
```

Expected: tests fail on the old `was started but no completed result was recorded` wording.

Observed: AgentFlight-captured run failed with three assertions still seeing
the old incomplete-verification wording and rerun-first next action.

- [x] **Step 3: Implement the copy change**

Change the incomplete proof-gap message and incomplete readiness next action in `src/core/review-intelligence.ts`. Do not change completion matching or verification run storage.

- [x] **Step 4: Verify green**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/core/review-intelligence.test.ts tests/commands/evidence-output.test.ts
```

Expected: both files pass.

Observed: the first implementation exposed one missed Review Intelligence
assertion on the old wording. After updating that assertion, the
AgentFlight-captured focused run passed with 2 files / 59 tests.

- [x] **Step 5: Bug pass**

Run:

```bash
node dist/cli.js verify -- npm run verify
node dist/cli.js verify -- npm run format:check
node dist/cli.js verify -- npm pack --dry-run
node dist/cli.js verify -- npx projscan@latest doctor --format json
node dist/cli.js verify -- npx projscan@latest preflight --mode before_commit --format json
node dist/cli.js verify -- npx projscan@latest review --format json
node dist/cli.js verify -- npx agentloopkit@latest verify
agentloop check-gates
node dist/cli.js status
git diff --check
```

Expected: normal checks pass; ProjScan may keep the known scale/manual-signoff block without concrete blockers.

Observed:

- AgentFlight-captured `npm run verify` passed with 23 files / 212 tests plus
  build.
- AgentFlight-captured `npm run format:check` passed.
- AgentFlight-captured `npm pack --dry-run` passed.
- `git diff --check` passed.
- AgentFlight-captured ProjScan doctor passed with score 100/A.
- AgentFlight-captured ProjScan preflight requested full review.
- AgentFlight-captured ProjScan review returned the known scale/manual-signoff
  block: max changed-file risk score 216.1 >= 80, with empty cycle,
  risky-function, contract, taint, and dataflow arrays.
- AgentFlight-captured AgentLoopKit verification passed.
- AgentFlight status after verification completion showed `Proof gaps: none`.
