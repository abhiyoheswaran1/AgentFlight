# Idempotent Init Detected Proof Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make idempotent `agentflight init` show a concrete proof command when existing config commands are empty but package proof scripts are detectable.

**Architecture:** Keep existing config immutable. Return detected package proof commands from `initAgentFlight` alongside the loaded config, then let `runInitCommand` choose the correct workflow line: no-arg `agentflight verify` for seeded/configured commands, explicit `agentflight verify -- <detected command>` for older empty configs, and `<proof command>` only when nothing is detected.

**Tech Stack:** TypeScript, Vitest, AgentFlight command/core tests, Markdown docs.

---

### Task 1: Detection Data From Init

**Files:**

- Modify: `tests/core/config.test.ts`
- Modify: `src/core/config.ts`

- [x] **Step 1: Write failing core test**

Add or update a config init test to assert `initAgentFlight` returns:

```ts
detectedVerificationCommands: ["npm run typecheck", "npm test"];
```

when package scripts include `typecheck` and `test`, even if config already exists.

- [x] **Step 2: Verify core test fails**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/core/config.test.ts
```

Expected: fail because `InitAgentFlightResult` does not expose detected commands yet.

- [x] **Step 3: Return detected commands**

Add `detectedVerificationCommands: string[]` to `InitAgentFlightResult` and return the already computed `verificationCommands`.

- [x] **Step 4: Verify core test passes**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/core/config.test.ts
```

Expected: pass.

### Task 2: Init Workflow Fallback

**Files:**

- Modify: `tests/commands/workflow.test.ts`
- Modify: `src/commands/init.ts`

- [x] **Step 1: Write failing workflow test**

Create a temp repo with package `typecheck` and `test` scripts, run `init`, then edit `.agentflight/config.json` so `verification.commands = []`. Run `init` again and assert:

```text
agentflight verify -- npm run typecheck
```

is shown, `agentflight verify -- <proof command>` is not shown, and the config file still has an empty commands array.

- [x] **Step 2: Verify workflow test fails**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/commands/workflow.test.ts
```

Expected: fail because idempotent init still prints `<proof command>`.

- [x] **Step 3: Use detected fallback command**

In `src/commands/init.ts`, choose the workflow line with this precedence:

1. configured commands present: `agentflight verify`
2. detected package proof command present: `agentflight verify -- ${detectedCommand}`
3. no detected command: `agentflight verify -- <proof command>`

- [x] **Step 4: Verify workflow test passes**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/commands/workflow.test.ts
```

Expected: pass.

### Task 3: Docs, Bug Pass, And Handoff

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`
- Modify: `docs/superpowers/plans/2026-06-21-idempotent-init-detected-proof.md`
- Update/archive AgentLoop task and generated handoff artifacts through commands only.

- [x] **Step 1: Document the behavior**

Add a changelog bullet and devlog entry with red/green evidence.

- [x] **Step 2: Run full verification and product checks**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/core/config.test.ts tests/commands/workflow.test.ts
node dist/cli.js verify -- npm run verify
node dist/cli.js verify -- npm run format:check
node dist/cli.js verify -- npm pack --dry-run
node dist/cli.js verify -- npx projscan@latest doctor --format json
node dist/cli.js verify -- npx projscan@latest preflight --mode before_commit --format json
node dist/cli.js verify -- npx projscan@latest review --format json
node dist/cli.js verify -- npx agentloopkit@latest verify
```

Result: checks passed; ProjScan returned only the accumulated scale caution/manual review block.

- [x] **Step 3: Live smoke**

Run `node dist/cli.js init` in this repo or another repo with empty existing config and package proof scripts.

Expected: primary workflow shows a concrete explicit proof command and does not mutate config.

- [x] **Step 4: Generate handoff and gates**

Run:

```bash
node dist/cli.js handoff
npx agentloopkit@latest handoff --task .agentloop/tasks/2026-06-21-guide-idempotent-init-with-detected-proof.md --report <latest-report>
npx agentloopkit@latest check-gates
```

Expected: gates pass.

- [x] **Step 5: Commit intended files only**

Stage init/config source/tests, changelog/devlog, this plan, and AgentLoop task/handoff evidence. Do not stage `.agentflight/sessions`, `.agentflight/reports`, `.agentflight/current`, or `.agentflight/evidence`.

Commit message:

```bash
git commit -m "Guide idempotent init with detected proof"
```
