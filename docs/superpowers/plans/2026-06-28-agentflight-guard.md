# AgentFlight Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `agentflight guard` as a local live trust monitor, then complete five quality loops before any later automated release.

**Architecture:** Reuse the existing status/review-intelligence pipeline as the source of truth. Add a small `src/core/guard.ts` summary/renderer that turns status JSON into a calm guard view, and a `src/commands/guard.ts` command layer that supports one-shot and polling watch mode without running verification commands automatically.

**Tech Stack:** TypeScript, Commander, Vitest, existing AgentFlight session/review/Baseframe APIs.

**Release Constraint:** Do not version bump, tag, publish, or create a GitHub/npm release in this task. Leave release-readiness evidence only.

---

### Task 1: Baseline Stability

**Files:**

- Modify: `tests/commands/finish.test.ts`

- [x] **Step 1: Reproduce baseline**

Run: `npm test`

Observed: one pre-existing full-suite timeout in `tests/commands/finish.test.ts`.

- [x] **Step 2: Verify isolated behavior**

Run: `npx vitest run tests/commands/finish.test.ts -t "keeps generated Baseframe output out of scope drift during finish"`

Observed: isolated test passes in about 13 seconds.

- [x] **Step 3: Align explicit timeout**

Change the test timeout from `20_000` to `30_000`, matching `vitest.config.ts`.

- [x] **Step 4: Verify baseline**

Run: `npm test`

Expected: 32 test files pass.

### Task 2: Guard Core, Test First

**Files:**

- Create: `tests/core/guard.test.ts`
- Create: `src/core/guard.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Write failing tests**

Add tests for:

- failed verification produces a blocking guard signal
- Baseframe missing/failed/incomplete gates produce guard signals
- scope drift produces a blocking or warning signal
- clean or ready states produce a clear guard summary

Run: `npx vitest run tests/core/guard.test.ts`

Expected: fail because `src/core/guard.ts` does not exist.

- [ ] **Step 2: Implement minimal core**

Add exported types:

- `AgentFlightGuardSignal`
- `AgentFlightGuardSummary`

Add functions:

- `createAgentFlightGuardSummary(input)`
- `renderAgentFlightGuardSummary(summary)`

The core must be source-free and only consume existing status metadata.

- [ ] **Step 3: Verify core tests**

Run: `npx vitest run tests/core/guard.test.ts`

Expected: pass.

### Task 3: Guard Command, Test First

**Files:**

- Create: `tests/commands/guard.test.ts`
- Create: `src/commands/guard.ts`
- Modify: `src/cli.ts`

- [ ] **Step 1: Write failing command tests**

Add tests for:

- `runGuardCommand({ once: true })` prints the Guard view
- JSON format returns the structured Guard summary
- Baseframe sessions include gate/scope signals
- older sessions without Baseframe context still work
- CLI help exposes `guard`

Run: `npx vitest run tests/commands/guard.test.ts`

Expected: fail because `runGuardCommand` and CLI wiring do not exist.

- [ ] **Step 2: Implement command layer**

Add `runGuardCommand` with options:

- `repoRoot`
- `once`
- `format`
- `intervalMs`
- `changedFiles`
- `now`

For one-shot mode, call `runStatusCommand({ format: "json" })`, build a Guard summary, render text or JSON, and set exit code using existing readiness semantics.

For watch mode, poll at the interval, clear the terminal by default, render the latest summary, and stop cleanly on `SIGINT`.

- [ ] **Step 3: Wire CLI**

Add:

```bash
agentflight guard
agentflight guard --once
agentflight guard --format json --once
agentflight guard --interval 5000
agentflight guard --no-clear
```

Export `createAgentFlightGuardSummary` and Guard types from package API.

- [ ] **Step 4: Verify command tests**

Run: `npx vitest run tests/commands/guard.test.ts`

Expected: pass.

### Task 4: Integration And Docs

**Files:**

- Modify: `tests/commands/workflow.test.ts`
- Modify: `README.md`
- Create: `docs/development/guard.md`
- Create: `docs/marketing/agentflight-guard-website-update-prompt.md`
- Modify: `package.json`

- [ ] **Step 1: Add workflow coverage**

Update workflow tests so `agentflight guard --once` appears alongside status, finish, and handoff.

- [ ] **Step 2: Update README**

Describe Guard as the live local trust monitor and keep `finish` as the final Review Passport command.

- [ ] **Step 3: Add Guard docs**

Document behavior, watch mode, one-shot mode, JSON output, exit codes, privacy boundary, and what Guard does not do.

- [ ] **Step 4: Add website prompt**

Write a website update prompt that moves the flagship story to Guard plus Review Passport. Explicitly say website changelog is automated and should wait for the later automated release.

- [ ] **Step 5: Include Guard docs in package files**

Add `docs/development/guard.md` to `package.json` `files`.

### Task 5: Quality Loop 1 - Targeted Guard Behavior

**Files:**

- Review: `src/core/guard.ts`
- Review: `src/commands/guard.ts`
- Review: `tests/core/guard.test.ts`
- Review: `tests/commands/guard.test.ts`

- [ ] **Step 1: Run targeted Guard tests**

Run:

- `npx vitest run tests/core/guard.test.ts`
- `npx vitest run tests/commands/guard.test.ts`

- [ ] **Step 2: Inspect output paths**

Run synthetic standalone sessions and confirm no absolute paths appear in text output.

### Task 6: Quality Loop 2 - Baseframe And Session Edges

**Files:**

- Review: `src/core/guard.ts`
- Review: `src/commands/guard.ts`
- Review: `tests/commands/guard.test.ts`

- [ ] **Step 1: Test Baseframe signals**

Run Baseframe guard tests for missing gates, failed gates, incomplete gates, skipped gates, and scope drift.

- [ ] **Step 2: Test session compatibility**

Run older-session tests with no Baseframe integration and no review receipts.

### Task 7: Quality Loop 3 - Docs And DX

**Files:**

- Review: `README.md`
- Review: `docs/development/guard.md`
- Review: `docs/marketing/agentflight-guard-website-update-prompt.md`

- [ ] **Step 1: Run docs/copy pass**

Check public copy for clear local-first behavior, no exaggerated release claims, and no manual website changelog instruction.

- [ ] **Step 2: Run format check**

Run: `npm run format:check`

### Task 8: Quality Loop 4 - Security And Privacy

**Files:**

- Review: `src/core/guard.ts`
- Review: `src/commands/guard.ts`
- Review: `src/cli.ts`

- [ ] **Step 1: Verify no hidden execution**

Confirm Guard reads status metadata and does not run verification commands automatically.

- [ ] **Step 2: Verify privacy boundary**

Confirm Guard renders paths, counts, commands, statuses, and summaries only; no source contents, env values, uploads, telemetry, or PR posting.

### Task 9: Quality Loop 5 - Full Verification And Release-Readiness Audit

**Files:**

- Create: `docs/development/agentflight-guard-release-readiness.md`

- [ ] **Step 1: Run full verification**

Run:

- `npm run verify`
- `npm run format:check`
- `npm pack --dry-run`
- `npm audit`
- `npx --no-install projscan --offline doctor`
- `npx --no-install projscan --offline preflight --mode before_commit`
- `agentloop verify`
- `agentloop check-gates`

- [ ] **Step 2: Inspect public output**

Run a synthetic local session and inspect:

- `agentflight guard --once`
- `agentflight guard --format json --once`

Confirm no source, secrets, private absolute paths, hidden command execution, or noisy output.

- [ ] **Step 3: Write readiness audit**

Write `docs/development/agentflight-guard-release-readiness.md` with completed loop evidence, known risks, and explicit note that no release was performed.
