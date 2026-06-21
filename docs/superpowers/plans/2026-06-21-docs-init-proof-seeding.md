# Docs Init Proof Seeding Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align public docs with init-seeded verification commands and the handoff-first workflow.

**Architecture:** Docs-only. Update README and verification docs without changing CLI behavior, package metadata, or release state.

**Tech Stack:** Markdown docs, Prettier format check.

---

### Task 1: Public Docs

**Files:**

- Modify: `README.md`
- Modify: `docs/development/verification.md`

- [x] Update the 60-second workflow so `handoff` is the core post-verification path.
- [x] Mention `init` seeds detected verification commands into `.agentflight/config.json` when scripts exist.
- [x] Keep status, snapshot, history, report, replay, and resume as supporting commands/artifacts.
- [x] Avoid new claims about CI, hosted review, automatic PR comments, or release behavior.

### Task 2: Evidence Notes

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] Add a concise changelog note for docs alignment.
- [x] Add devlog evidence with product rationale, persona readout, implementation, and verification.

### Task 3: Verification and Handoff

**Files:**

- Archive: `.agentloop/tasks/archive/2026-06-21-align-docs-with-init-proof-seeding.md`
- Create: `.agentloop/handoffs/*`

- [x] Run `npm run format:check`.
- [x] Run `npm run verify`.
- [x] Run `npm pack --dry-run`.
- [x] Run `npm audit --audit-level=moderate`.
- [x] Run ProjScan doctor/preflight/review and document any scale-only caution.
- [x] Run AgentLoopKit verification.
- [x] Generate handoffs, archive the task, and run gates.
