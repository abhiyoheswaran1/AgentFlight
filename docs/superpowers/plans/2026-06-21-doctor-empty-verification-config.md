# Doctor Empty Verification Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `agentflight doctor` warn when an older config has no configured verification commands despite available package proof scripts.

**Architecture:** Keep detection split between command IO and pure doctor evaluation. `runDoctorCommand` reads config and package scripts, passes a configured-command count into `evaluateDoctorChecks`, and the core doctor adds one concise warning only when commands are empty and a proof script exists.

**Tech Stack:** TypeScript, Vitest, AgentFlight command/core tests, Markdown docs.

---

### Task 1: Core Doctor Warning

**Files:**

- Modify: `tests/core/doctor.test.ts`
- Modify: `src/core/doctor.ts`

- [x] **Step 1: Write failing core tests**

Add tests for:

- empty configured verification commands plus `test` script returns a warning named `verification commands`
- one configured verification command returns OK for `verification commands`
- no configured commands and no proof scripts returns OK for `verification commands`

- [x] **Step 2: Verify core tests fail**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/core/doctor.test.ts
```

Expected: fail because the doctor has no `verification commands` check yet.

- [x] **Step 3: Implement core doctor check**

Add `configuredVerificationCommands: number` to `DoctorEvaluationInput`. In `evaluateDoctorChecks`, compute whether any proof script exists from `test`, `build`, `typecheck`, or `lint`. Add:

- OK when at least one verification command is configured
- WARNING when zero commands are configured and at least one proof script exists
- OK when zero commands are configured and no proof scripts exist

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

- [x] **Step 1: Write failing command test**

Add or update a doctor workflow test so a repo with package proof scripts and an empty `.agentflight/config.json` verification command list prints:

```text
WARNING verification commands
```

and suggests adding commands or running `agentflight verify -- <command>`.

- [x] **Step 2: Verify command test fails**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/commands/workflow.test.ts
```

Expected: fail before `runDoctorCommand` passes config command count into the core doctor.

- [x] **Step 3: Wire configured command count**

Read `config?.verification.commands.length ?? 0` in `runDoctorCommand` after config load and pass it into `evaluateDoctorChecks`.

- [x] **Step 4: Document the behavior**

Add a changelog fixed/changed bullet and a devlog entry with red/green evidence.

- [x] **Step 5: Verify command and focused tests pass**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/core/doctor.test.ts tests/commands/workflow.test.ts
```

Expected: pass.

### Task 3: Bug Pass And Handoff

**Files:**

- Modify: `docs/superpowers/plans/2026-06-21-doctor-empty-verification-config.md`
- Update/archive AgentLoop task and generated handoff artifacts through commands only.

- [x] **Step 1: Run full verification and product checks**

Run:

```bash
node dist/cli.js verify -- npm run verify
node dist/cli.js verify -- npm run format:check
node dist/cli.js verify -- npm pack --dry-run
npx projscan@latest doctor --format json
npx projscan@latest preflight --mode before_commit --format json
node dist/cli.js verify -- npx agentloopkit@latest verify
```

Expected: checks pass; ProjScan may report only the accumulated scale caution.

- [x] **Step 2: Generate handoff and gates**

Run:

```bash
node dist/cli.js handoff
npx agentloopkit@latest handoff --task .agentloop/tasks/2026-06-21-warn-about-empty-verification-config.md --report <latest-report>
npx agentloopkit@latest check-gates
```

Expected: gates pass.

- [x] **Step 3: Commit intended files only**

Stage only doctor source/tests, changelog/devlog, this plan, and AgentLoop task/handoff evidence. Do not stage `.agentflight/sessions`, `.agentflight/reports`, `.agentflight/current`, or `.agentflight/evidence`.

Commit message:

```bash
git commit -m "Warn about empty verification config"
```
