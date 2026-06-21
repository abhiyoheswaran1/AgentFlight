# Doctor Concrete Verify Suggestions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `agentflight doctor` show concrete `agentflight verify -- ...` suggestions when config commands are empty but package proof scripts are available.

**Architecture:** Keep doctor read-only and config immutable. Pass detected package proof commands from the command layer into core doctor evaluation, then render a concise capped suggestion list in the existing warning. Reuse `detectVerificationCommands` so doctor and verify stay aligned.

**Tech Stack:** TypeScript, Vitest, AgentFlight command/core tests, Markdown docs.

---

### Task 1: Doctor Suggestion Data

**Files:**

- Modify: `tests/core/doctor.test.ts`
- Modify: `src/core/doctor.ts`

- [x] **Step 1: Write failing core tests**

Add assertions that the `verification commands` warning includes:

```text
Try one of: agentflight verify -- npm run typecheck; agentflight verify -- npm test.
```

when `configuredVerificationCommands` is `0` and detected commands are supplied. Keep the existing no-proof-script and configured-command tests unchanged in behavior.

- [x] **Step 2: Verify core tests fail**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/core/doctor.test.ts
```

Expected: fail because core doctor still renders `agentflight verify -- <command>`.

- [x] **Step 3: Implement core doctor suggestion rendering**

Add `detectedVerificationCommands?: string[]` to `DoctorEvaluationInput`. In `verificationCommandsCheck`, build the warning suggested fix from those commands when present:

```text
Try one of: agentflight verify -- npm run typecheck; agentflight verify -- npm test. To make this the default, add commands under verification.commands.
```

If no detected commands are present, keep the existing concise fallback.

- [x] **Step 4: Verify core tests pass**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/core/doctor.test.ts
```

Expected: pass.

### Task 2: Command Wiring And Docs

**Files:**

- Modify: `tests/commands/workflow.test.ts`
- Modify: `src/commands/doctor.ts`
- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] **Step 1: Write failing workflow test**

Update the existing empty-config doctor workflow test to expect concrete suggestions such as:

```text
agentflight verify -- npm run typecheck
agentflight verify -- npm test
```

and to reject the placeholder `agentflight verify -- <command>` text.

- [x] **Step 2: Verify workflow test fails**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/commands/workflow.test.ts
```

Expected: fail before `runDoctorCommand` passes detected commands into core doctor evaluation.

- [x] **Step 3: Wire detected commands**

Import `detectVerificationCommands` in `src/commands/doctor.ts`, compute it from the already-read `packageJson`, and pass it into `evaluateDoctorChecks`.

- [x] **Step 4: Document the behavior**

Add a changelog bullet and devlog entry with red/green evidence. Keep the docs focused on doctor guidance consistency and local-only behavior.

- [x] **Step 5: Verify focused tests pass**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/core/doctor.test.ts tests/commands/workflow.test.ts
```

Expected: pass.

### Task 3: Bug Pass And Handoff

**Files:**

- Modify: `docs/superpowers/plans/2026-06-21-doctor-concrete-verify-suggestions.md`
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

Run:

```bash
node dist/cli.js doctor
```

Expected: warning uses concrete detected proof commands and does not mutate config.

- [x] **Step 3: Generate handoff and gates**

Run:

```bash
node dist/cli.js handoff
npx agentloopkit@latest handoff --task .agentloop/tasks/2026-06-21-show-concrete-doctor-verify-suggestions.md --report <latest-report>
npx agentloopkit@latest check-gates
```

Expected: gates pass.

- [x] **Step 4: Commit intended files only**

Stage doctor source/tests, changelog/devlog, this plan, and AgentLoop task/handoff evidence. Do not stage `.agentflight/sessions`, `.agentflight/reports`, `.agentflight/current`, or `.agentflight/evidence`.

Commit message:

```bash
git commit -m "Show concrete doctor verify suggestions"
```
