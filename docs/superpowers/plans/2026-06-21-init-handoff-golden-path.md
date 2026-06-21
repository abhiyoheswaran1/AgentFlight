# Init Handoff Golden Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `agentflight init` point first-run users at the local handoff loop as the primary path.

**Architecture:** Keep initialization behavior unchanged. Update only the user-facing init command copy and tests so the generated next-step guidance matches the product direction: start a session, capture verification, then generate a handoff.

**Tech Stack:** TypeScript, Vitest, AgentFlight CLI command tests.

---

### Task 1: Red Test

**Files:**

- Modify: `tests/commands/workflow.test.ts`

- [x] Add assertions that init output contains a primary workflow with `start`, `verify`, and `handoff`.
- [x] Add assertions that `status` and `doctor` remain available as supporting checks.
- [x] Run `npm test -- tests/commands/workflow.test.ts` and confirm the new assertions fail before implementation.

### Task 2: Minimal Copy Update

**Files:**

- Modify: `src/commands/init.ts`

- [x] Replace the old `Next commands` block with primary workflow guidance.
- [x] Keep `status` and `doctor` in a separate supporting checks block.
- [x] Do not change generated files, config defaults, package metadata, or runtime behavior.

### Task 3: Evidence Notes

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] Add a concise unreleased changelog note.
- [x] Add devlog evidence with research basis, persona readout, implementation, and verification.

### Task 4: Verification and Handoff

**Files:**

- Archive: `.agentloop/tasks/archive/2026-06-21-clarify-init-handoff-golden-path.md`
- Create: `.agentloop/handoffs/*`

- [x] Run focused workflow tests.
- [x] Run built CLI smoke for `agentflight init`.
- [x] Run `npm run verify`.
- [x] Run `npm run format:check`.
- [x] Run `npm pack --dry-run`.
- [x] Run `npm audit --audit-level=moderate`.
- [x] Run ProjScan doctor/preflight/review and document any scale-only caution.
- [x] Run AgentLoopKit verification.
- [x] Generate handoffs, archive the task, and run gates.
