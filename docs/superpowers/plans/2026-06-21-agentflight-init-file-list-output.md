# AgentFlight Init File List Output Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or a stricter local TDD loop to implement this plan task-by-task.

**Goal:** Make `agentflight init` explicit about which local files it created or preserved.

**Architecture:** Keep core init behavior unchanged. Format the existing `created` and `skipped` arrays in the command output with repo-relative paths.

**Tech Stack:** TypeScript, Vitest, AgentFlight init command.

---

### Task 1: Red Tests

**Files:**

- Modify: `tests/commands/workflow.test.ts`

- [x] Assert fresh init lists `.agentflight/config.json` and `.agentflight/.gitignore` under created files.
- [x] Assert a second init lists the same files under skipped existing files.
- [x] Preserve existing local-files guidance assertions.
- [x] Run `npm test -- tests/commands/workflow.test.ts tests/core/config.test.ts` and confirm the new assertions fail.

### Task 2: Init Output Formatting

**Files:**

- Modify: `src/commands/init.ts`

- [x] Add a small path-list formatter for created/skipped files.
- [x] Use `none` for empty lists.
- [x] Keep output repo-relative and deterministic.

### Task 3: Verification And Handoff

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] Run targeted tests.
- [x] Run full checks and product checks.
- [x] Dogfood built `agentflight init` in a temp repo.
- [x] Complete and archive the AgentLoop task, then commit only intended files.
