# AgentFlight Local Handoff Command Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local-only `agentflight handoff` command that tells a developer what to share next after an AI coding session.

**Architecture:** Implement a small command module that composes existing status, report, replay, and resume behavior. The command should not post anywhere, call network services, or duplicate report/replay rendering; it should summarize readiness, failed excerpts, proof gaps, review focus, and generated artifact paths.

**Tech Stack:** TypeScript, Commander, Vitest, existing AgentFlight command modules.

---

### Task 1: Define Handoff Behavior With Tests

**Files:**

- Modify: `tests/commands/evidence-output.test.ts`

- [ ] **Step 1: Add ready-path test**

Add a test that starts a repo, records passing verification, runs `runHandoffCommand`, and expects:

- `AgentFlight handoff`
- readiness `Ready for review`
- generated report, replay, and resume paths
- top review file
- no network or posting claim

- [ ] **Step 2: Add blocked-path test**

Add a test that records a failing verification with stdout noise and stderr signal, runs `runHandoffCommand`, and expects:

- readiness `Blocked by failed verification`
- stderr signal in the handoff output
- stdout noise absent from the handoff summary
- raw stdout/stderr evidence still present on disk

- [ ] **Step 3: Run tests red**

Run:

```bash
npm test -- tests/commands/evidence-output.test.ts
```

Expected: fail because `src/commands/handoff.ts` does not exist yet.

### Task 2: Implement The Command Module

**Files:**

- Create: `src/commands/handoff.ts`
- Modify: `src/cli.ts`

- [ ] **Step 1: Add `runHandoffCommand`**

The command should:

- read status JSON with `runStatusCommand({ format: "json" })`
- generate full report with `runReportCommand`
- generate replay with `runReplayCommand`
- generate resume prompt with `runResumeCommand`
- render a concise local handoff summary with artifact paths
- include failed run excerpts from stored `outputExcerpt`
- return exit code `1` only when readiness is blocked, otherwise `0`

- [ ] **Step 2: Register CLI command**

Add:

```ts
program
  .command("handoff")
  .description("Generate a local review handoff for the current session.")
  .action(async () => {
    await printResult(runHandoffCommand({ repoRoot: await getRepositoryRoot(process.cwd()) }));
  });
```

- [ ] **Step 3: Run tests green**

Run:

```bash
npm test -- tests/commands/evidence-output.test.ts
```

Expected: pass.

### Task 3: Update Docs And Verify

**Files:**

- Modify: `README.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Document the new golden path**

Mention `agentflight handoff` as the local end-of-session command after `verify`.

- [ ] **Step 2: Run focused verification**

Run:

```bash
npm test -- tests/commands/evidence-output.test.ts tests/commands/workflow.test.ts
npm run verify
npm run format:check
```

Expected: all pass.

### Self-Review

- Scope is one local command and documentation.
- No dependency, release, network, cloud, telemetry, PR-posting, or CI behavior is introduced.
- Tests cover ready and blocked handoff behavior.
