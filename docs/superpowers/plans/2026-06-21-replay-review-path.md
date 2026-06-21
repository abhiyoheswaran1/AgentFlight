# Replay Review Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a compact review path near the top of HTML replay artifacts so reviewers know what to inspect first in long local sessions.

**Architecture:** Keep the change inside the HTML replay renderer. Build a small derived list from existing Review Intelligence, verification summary, and existing section/run anchors; do not add persisted state, scripts, exports, or new command modes.

**Tech Stack:** TypeScript, Vitest, AgentFlight HTML replay renderer.

---

## File Map

- Modify `tests/renderers/html-replay.test.ts` for red/green renderer coverage.
- Modify `src/renderers/html-replay.ts` to render a local-only `Review Path` section.
- Modify `README.md`, `CHANGELOG.md`, and `AGENTFLIGHT_DEVLOG.md` to document the replay scan improvement.
- Archive `.agentloop/tasks/2026-06-21-add-replay-review-path-guidance.md` after verification and handoff.

## Tasks

- [x] **Step 1: Add red replay tests**

  Add tests that expect:

  - a `Review Path` section after the jump navigation when review intelligence exists
  - blocked sessions to lead with proof gaps, then first unresolved failed run, then review focus
  - ready sessions with historical failed runs to lead with review focus and verification evidence, without urgent failed-run copy
  - escaped labels and existing anchor links only

  Run:

  ```bash
  node dist/cli.js verify -- npm test -- tests/renderers/html-replay.test.ts
  ```

  Expected: FAIL because the `Review Path` section does not exist yet.

- [x] **Step 2: Implement minimal replay renderer support**

  In `src/renderers/html-replay.ts`:

  - add `renderReviewPath(input, urgentFailedRunIndex)` after `renderJumpNav(...)`
  - derive path rows from existing `review.readiness`, `review.proofGaps`, `review.focus`, `verificationEvidence`, and existing anchors
  - keep copy short and deterministic
  - escape all labels and URLs through existing `escapeHtml(...)`
  - hide the section when `input.review` is absent

  Run:

  ```bash
  node dist/cli.js verify -- npm test -- tests/renderers/html-replay.test.ts
  ```

  Expected: PASS.

- [x] **Step 3: Update docs and changelog**

  Add a concise note that HTML replay now includes a review path for long local records. Keep the language local-first and avoid export/posting claims.

- [x] **Step 4: Bug pass and verification**

  Run:

  ```bash
  node dist/cli.js verify -- npm run verify
  node dist/cli.js verify -- npm run format:check
  node dist/cli.js verify -- npm pack --dry-run
  node dist/cli.js verify -- npm audit --audit-level=moderate
  node dist/cli.js verify -- npx projscan@latest doctor --format json
  node dist/cli.js verify -- npx projscan@latest preflight --mode before_commit --format json
  node dist/cli.js verify -- npx agentloopkit@latest verify
  ```

  If ProjScan requests full review, run:

  ```bash
  node dist/cli.js verify -- npx projscan@latest review --format json
  ```

- [x] **Step 5: Handoff, gates, commit**

  Generate AgentFlight and AgentLoopKit handoffs, run `agentloop check-gates`, mark/archive the task, stage intended files only, commit, and confirm the final worktree is clean.
