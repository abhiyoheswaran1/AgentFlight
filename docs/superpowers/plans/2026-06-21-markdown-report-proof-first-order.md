# Markdown Report Proof-First Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make full Markdown proof reports faster to review by putting proof and readiness sections before the timeline.

**Architecture:** Change only the full report template in `src/renderers/markdown-report.ts`. Keep compact and PR-comment modes unchanged, and preserve the complete timeline later in the full report.

**Tech Stack:** TypeScript, Vitest, AgentFlight Markdown renderer.

---

### Task 1: Add Failing Ordering Coverage

**Files:**

- Modify: `tests/renderers/markdown-report.test.ts`

- [x] Add assertions that `## Changed Files`, `## Risk Summary`, `## Verification Evidence`, `## Review First`, `## Proof Gaps`, `## Review Readiness`, `## Recommendation`, and `## Next Action` appear before `## Timeline` in the full report.
- [x] Assert `## Timeline` still appears before `## Tooling`.
- [x] Keep existing compact and PR-comment tests unchanged.
- [x] Run `node dist/cli.js verify -- npm test -- tests/renderers/markdown-report.test.ts` and confirm the new assertion fails before production changes.

### Task 2: Reorder Full Report Sections

**Files:**

- Modify: `src/renderers/markdown-report.ts`

- [x] Move the full report `## Timeline` section below `## Next Action` and above `## Tooling`.
- [x] Preserve the exact `renderTimeline(...)` output.
- [x] Do not modify compact or PR-comment renderers.
- [x] Rerun `node dist/cli.js verify -- npm test -- tests/renderers/markdown-report.test.ts` and confirm it passes.

### Task 3: Dogfood, Docs, Bug Pass, And Handoff

**Files:**

- Modify: `AGENTFLIGHT_DEVLOG.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/development/product-direction.md`

- [x] Dogfood `node dist/cli.js report` and confirm proof sections appear before the long timeline.
- [x] Record the finding and implementation in the devlog.
- [x] Add a concise changelog entry under `Unreleased`.
- [x] Run the full bug pass.
- [x] Archive the AgentLoop task and write handoff evidence.
