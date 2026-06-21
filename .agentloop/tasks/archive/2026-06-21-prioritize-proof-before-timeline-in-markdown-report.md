# Prioritize proof before timeline in Markdown report

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
Long sessions make the full Markdown proof report hard to scan because the timeline appears before changed files, risk, and verification evidence.

## Desired Outcome
Full Markdown reports show changed files, risk, verification, review focus, proof gaps, readiness, recommendation, and next action before the timeline, while preserving the full timeline later in the report.

## Constraints
- Keep this as a report ordering/readability change only.
- Preserve the full timeline in full Markdown reports.
- Do not change compact report or local PR-comment draft modes.
- Do not change report/replay generation, evidence capture, or session storage.
- No version bump, release, tag, push, publish, cloud, PR comments, JSON/CI, or hosted features.

## Non-Goals
- No timeline filtering or deletion.
- No replay UI redesign.
- No export modes or report modes.

## Assumptions
- Full Markdown reports should optimize for quick proof review before chronology.
- Replay remains the better artifact for inspecting the full chronological flight record.

## Likely Files or Areas
- src/renderers/markdown-report.ts
- tests/renderers/markdown-report.test.ts
- AGENTFLIGHT_DEVLOG.md
- CHANGELOG.md
- docs/development/product-direction.md

## Files or Areas Not to Touch
- package.json
- package-lock.json
- .agentflight/evidence/**
- .agentflight/reports/**

## Acceptance Criteria
- Full Markdown report sections render changed files, risk summary, verification evidence, review first, proof gaps, review readiness, recommendation, and next action before `## Timeline`.
- Full Markdown report still includes `## Timeline` before `## Tooling`.
- Compact report and PR-comment draft output stay unchanged.
- Verification evidence and failure excerpts remain intact.

## Verification Commands
- npm test -- tests/renderers/markdown-report.test.ts
- npm run verify
- npm run format:check
- npm pack --dry-run
- npx projscan@latest doctor --format json
- npx projscan@latest preflight --mode before_commit --format json
- npx projscan@latest review --format json
- npx agentloopkit@latest verify

## Post-Verification Gates
- npx agentloopkit@latest check-gates

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Re-check protected areas before changing migrations, auth, secrets, billing, deployment, or public APIs.

## Rollback Notes
Revert the Markdown report section-order change, tests, and documentation notes from this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
