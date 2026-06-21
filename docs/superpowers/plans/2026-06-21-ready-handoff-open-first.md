# Ready Handoff Open-First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ready-session review surfaces point engineers to the local handoff packet first.

**Architecture:** Keep report, replay, and resume generation unchanged. Change only open-first artifact selection for ready sessions and the ready `agentflight handoff` terminal output, while keeping blocked and needs-verification paths report-first.

**Tech Stack:** TypeScript, Vitest, AgentFlight command tests.

---

### Task 1: Add Failing Ready Open-First Coverage

**Files:**

- Modify: `tests/commands/evidence-output.test.ts`
- Modify: `tests/commands/history.test.ts`

- [x] Change the ready handoff command test so it expects `Open first: handoff .agentflight/reports/...-handoff.md` instead of replay.
- [x] Change the clean-worktree status/resume test so status and resume point back to the ready handoff packet after a ready handoff has been generated.
- [x] Change the ready history tests so latest action and ready session entries prefer the handoff artifact when it exists.
- [x] Preserve existing blocked/needs-verification assertions that expect `Open first: report`.
- [x] Run `node dist/cli.js verify -- npm test -- tests/commands/history.test.ts tests/commands/evidence-output.test.ts` and confirm the new expectations fail before production changes.

### Task 2: Prefer Handoff For Ready Artifact Selection

**Files:**

- Modify: `src/core/artifacts.ts`
- Modify: `src/commands/handoff.ts`

- [x] In `chooseOpenFirstArtifact`, change the `ready_for_review` artifact order from `["replay", "handoff", "report"]` to `["handoff", "replay", "report"]`.
- [x] Update ready `agentflight handoff` output to render `Open first: handoff <session handoff path>` while keeping blocked output as `Open first: report <report path>`.
- [x] Do not change artifact creation or raw report/replay/resume paths.
- [x] Rerun `node dist/cli.js verify -- npm test -- tests/commands/history.test.ts tests/commands/evidence-output.test.ts` and confirm it passes.

### Task 3: Docs, Dogfood, Bug Pass, And Handoff

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`
- Modify: `docs/development/product-direction.md`

- [x] Add a concise changelog entry under `Unreleased`.
- [x] Record the dogfood finding and team persona notes in the devlog.
- [x] Update product direction to say ready discovery should open the handoff packet first, with replay/report retained for deeper inspection.
- [x] Dogfood `node dist/cli.js history --limit 1` or generated handoff output and confirm ready sessions point at the handoff packet.
- [x] Run the full bug pass from the task contract.
- [x] Archive the AgentLoop task and write handoff evidence.
- [x] Prepare the scoped source, test, documentation, plan, task, and handoff files for commit.
