# Init Detected Proof Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `agentflight init` show a primary verify command that matches the repo's detected proof commands.

**Architecture:** Keep config generation and session behavior unchanged. Let `runInitCommand` detect package scripts for display only, then render the primary workflow with the first detected verification command or a clear placeholder when no proof command is available.

**Tech Stack:** TypeScript, Vitest, AgentFlight CLI command tests.

---

### Task 1: Red Tests

**Files:**

- Modify: `tests/commands/workflow.test.ts`

- [x] Update the first-run workflow test to expect `agentflight verify -- npm run typecheck` when typecheck is the first detected command.
- [x] Add a no-script fallback assertion for `agentflight verify -- <proof command>`.
- [x] Run `npm test -- tests/commands/workflow.test.ts` and confirm the new expectations fail before implementation.

### Task 2: Minimal Implementation

**Files:**

- Modify: `src/commands/init.ts`

- [x] Detect verification commands from `package.json` for init display.
- [x] Render the first detected command in the primary workflow.
- [x] Use `agentflight verify -- <proof command>` when no command is detected.
- [x] Do not change `.agentflight/config.json` defaults or package metadata.

### Task 3: Evidence Notes

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] Add a concise unreleased changelog note.
- [x] Add devlog evidence with dogfood/research basis, persona readout, implementation, and verification.

### Task 4: Verification and Handoff

**Files:**

- Archive: `.agentloop/tasks/archive/2026-06-21-use-detected-proof-command-in-init-guidance.md`
- Create: `.agentloop/handoffs/*`

- [x] Run focused workflow tests.
- [x] Run built CLI smoke for detected and fallback init guidance.
- [x] Run `npm run verify`.
- [x] Run `npm run format:check`.
- [x] Run `npm pack --dry-run`.
- [x] Run `npm audit --audit-level=moderate`.
- [x] Run ProjScan doctor/preflight/review and document any scale-only caution.
- [x] Run AgentLoopKit verification.
- [x] Generate handoffs, archive the task, and run gates.
