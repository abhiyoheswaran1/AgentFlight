# Init Configured Verify Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make first-run `agentflight init` point users at no-arg `agentflight verify` when init seeds verification commands into config.

**Architecture:** Keep init file generation unchanged. Change only the rendered primary workflow copy so seeded configs use the configured verification path, while repos with no detected proof scripts still show `agentflight verify -- <proof command>`. Align README and the basic example with the configured path without removing explicit-command examples from the CLI docs.

**Tech Stack:** TypeScript, Vitest, Markdown docs.

---

### Task 1: Init Workflow Copy

**Files:**

- Modify: `tests/commands/workflow.test.ts`
- Modify: `src/commands/init.ts`

- [x] **Step 1: Write failing workflow test**

Update the first-run init workflow test to expect:

```text
Primary workflow:
agentflight start --task "Describe the work"
agentflight verify
agentflight handoff
```

when `.agentflight/config.json` contains seeded verification commands. Keep the no-proof-script test expecting:

```text
agentflight verify -- <proof command>
```

- [x] **Step 2: Verify test fails**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/commands/workflow.test.ts
```

Expected: fail because init still prints `agentflight verify -- npm run typecheck`.

- [x] **Step 3: Render configured verify path**

In `src/commands/init.ts`, derive the workflow verify line:

```ts
const verificationStep =
  verificationCommands.length > 0 ? "agentflight verify" : "agentflight verify -- <proof command>";
```

Use that line in the primary workflow.

- [x] **Step 4: Verify workflow test passes**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/commands/workflow.test.ts
```

Expected: pass.

### Task 2: Docs And Evidence

**Files:**

- Modify: `README.md`
- Modify: `docs/examples/basic-agentflight-session.md`
- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] **Step 1: Update docs**

Change the 60-second workflow and basic example to show:

```bash
npx agentflight@latest verify
```

after `init` and `start`, while keeping command reference language that explains `verify -- <command>` for explicit proof runs.

- [x] **Step 2: Document evidence**

Add a changelog bullet and devlog entry with red/green evidence and the product rationale.

- [x] **Step 3: Verify docs formatting**

Run:

```bash
node dist/cli.js verify -- npm run format:check
```

Expected: pass.

### Task 3: Bug Pass And Handoff

**Files:**

- Modify: `docs/superpowers/plans/2026-06-21-init-configured-verify-workflow.md`
- Update/archive AgentLoop task and generated handoff artifacts through commands only.

- [x] **Step 1: Run full verification and product checks**

Run:

```bash
node dist/cli.js verify -- npm run verify
node dist/cli.js verify -- npm run format:check
node dist/cli.js verify -- npm pack --dry-run
node dist/cli.js verify -- npx projscan@latest doctor --format json
node dist/cli.js verify -- npx projscan@latest preflight --mode before_commit --format json
node dist/cli.js verify -- npx projscan@latest review --format json
node dist/cli.js verify -- npx agentloopkit@latest verify
```

Result: checks passed; ProjScan returned only the accumulated scale caution/manual review block.

- [x] **Step 2: Live smoke**

Run `node dist/cli.js init` in a temp repo with package proof scripts.

Expected: primary workflow shows no-arg `agentflight verify`, and generated config still contains the detected commands.

- [x] **Step 3: Generate handoff and gates**

Run:

```bash
node dist/cli.js handoff
npx agentloopkit@latest handoff --task .agentloop/tasks/2026-06-21-use-configured-verify-in-init-workflow.md --report <latest-report>
npx agentloopkit@latest check-gates
```

Expected: gates pass.

- [x] **Step 4: Commit intended files only**

Stage init source/test, README/example docs, changelog/devlog, this plan, and AgentLoop task/handoff evidence. Do not stage `.agentflight/sessions`, `.agentflight/reports`, `.agentflight/current`, or `.agentflight/evidence`.

Commit message:

```bash
git commit -m "Use configured verify in init workflow"
```
