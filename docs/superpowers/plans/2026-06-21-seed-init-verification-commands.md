# Seed Init Verification Commands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Seed newly generated `.agentflight/config.json` files with detected verification commands.

**Architecture:** Reuse existing package-script verification detection. Keep config schema unchanged: only populate `verification.commands` during first creation. Existing configs remain skipped and untouched; `verification.profiles` stays empty.

**Tech Stack:** TypeScript, Vitest, AgentFlight config/workflow tests.

---

### Task 1: Red Tests

**Files:**

- Modify: `tests/core/config.test.ts`
- Modify: `tests/commands/workflow.test.ts`

- [x] Add config coverage showing init writes detected commands into a new config.
- [x] Add coverage showing repos without proof scripts still get an empty `verification.commands` array.
- [x] Assert existing configs are still not overwritten.
- [x] Assert init output and generated config agree on the primary proof command.
- [x] Run `npm test -- tests/core/config.test.ts tests/commands/workflow.test.ts` and confirm the new expectations fail before implementation.

### Task 2: Minimal Implementation

**Files:**

- Modify: `src/core/config.ts`
- Modify: `src/commands/init.ts`

- [x] Let `initAgentFlight` detect package scripts before writing a new default config.
- [x] Populate `verification.commands` only for newly created configs.
- [x] Keep `verification.profiles` unchanged.
- [x] Have init output use `result.config.verification.commands` so display and config stay aligned.

### Task 3: Evidence Notes

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] Add a concise unreleased changelog note.
- [x] Add devlog evidence with product rationale, persona readout, implementation, and verification.

### Task 4: Verification and Handoff

**Files:**

- Archive: `.agentloop/tasks/archive/2026-06-21-seed-detected-verification-commands-in-init-config.md`
- Create: `.agentloop/handoffs/*`

- [x] Run focused config/workflow tests.
- [x] Run built CLI smoke confirming config/output alignment.
- [x] Run `npm run verify`.
- [x] Run `npm run format:check`.
- [x] Run `npm pack --dry-run`.
- [x] Run `npm audit --audit-level=moderate`.
- [x] Run ProjScan doctor/preflight/review and document any scale-only caution.
- [x] Run AgentLoopKit verification.
- [x] Generate handoffs, archive the task, and run gates.
