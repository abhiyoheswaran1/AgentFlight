# Verify Empty Command Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `agentflight verify` suggest detected package proof commands when config commands are empty.

**Architecture:** Keep config immutable. When no explicit command/profile is provided and configured commands resolve to empty, read package scripts, reuse `detectVerificationCommands`, and add concise retry examples to the error output.

**Tech Stack:** TypeScript, Vitest, AgentFlight command tests, Markdown docs.

---

### Task 1: Verify Error Guidance

**Files:**

- Modify: `tests/commands/verify.test.ts`
- Modify: `src/commands/verify.ts`

- [x] **Step 1: Write failing tests**

Add tests that:

- create package `typecheck` and `test` scripts, clear `verification.commands`, run `runVerifyCommand` without command args, and expect `agentflight verify -- npm run typecheck` plus `agentflight verify -- npm test`
- create no package proof scripts and expect the existing concise no-command error without `Try one of:`
- keep named profile errors unchanged

- [x] **Step 2: Verify tests fail**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/commands/verify.test.ts
```

Expected: fail because empty-command output has no detected command suggestions yet.

- [x] **Step 3: Implement minimal command suggestions**

Import `readPackageJson` and `detectVerificationCommands`. Extend `CommandSetResolution` with `suggestedCommands?: string[]`. Only populate it for the no-profile/no-explicit-command path when configured commands are empty.

- [x] **Step 4: Verify focused tests pass**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/commands/verify.test.ts
```

Expected: pass.

### Task 2: Docs, Bug Pass, And Handoff

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`
- Modify: `docs/superpowers/plans/2026-06-21-verify-empty-command-guidance.md`
- Update/archive AgentLoop task and generated handoff artifacts through commands only.

- [x] **Step 1: Document the behavior**

Add a changelog bullet and devlog entry with red/green evidence.

- [x] **Step 2: Run verification and product checks**

Run:

```bash
node dist/cli.js verify -- npm test -- tests/commands/verify.test.ts
node dist/cli.js verify -- npm run verify
node dist/cli.js verify -- npm run format:check
node dist/cli.js verify -- npm pack --dry-run
npx projscan@latest doctor --format json
npx projscan@latest preflight --mode before_commit --format json
node dist/cli.js verify -- npx projscan@latest review --format json
node dist/cli.js verify -- npx agentloopkit@latest verify
```

Result: checks passed; ProjScan reported only the accumulated scale caution and
scale-only manual review block.

- [x] **Step 3: Generate handoff and gates**

Run:

```bash
node dist/cli.js handoff
npx agentloopkit@latest handoff --task .agentloop/tasks/2026-06-21-guide-empty-verify-command.md --report <latest-report>
npx agentloopkit@latest check-gates
```

Expected: gates pass.

- [x] **Step 4: Commit intended files only**

Stage only verify source/tests, changelog/devlog, this plan, and AgentLoop task/handoff evidence. Do not stage `.agentflight/sessions`, `.agentflight/reports`, `.agentflight/current`, or `.agentflight/evidence`.

Commit message:

```bash
git commit -m "Guide empty verify command"
```
