# Compact start-only history sessions

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
agentflight history gives non-current start-only sessions with no proof or artifacts the same multi-line artifact treatment as useful sessions, which adds scan noise and can push actionable report/replay paths down the page.

## Desired Outcome
Non-current start-only sessions remain visible but render compactly, while current sessions and sessions with artifacts/proof keep full actionable detail.

## Constraints
- Keep `agentflight history` read-only.
- Do not delete, hide, or mutate start-only session files.
- Preserve full detail for the current session, sessions with verification evidence, and sessions with any local review artifact.
- No version bump, release, tag, push, publish, cloud, PR comments, JSON/CI, or hosted features.

## Non-Goals
- No search index, session switching, export mode, or cleanup command.
- No changes to session storage format.
- No changes to report, replay, handoff, or resume generation.

## Assumptions
- A start-only session is a non-current session with no verification runs, no latest recorded review, and no handoff/report/replay/resume artifact.
- Current start-only sessions should keep existing actionable guidance because they may be active work.

## Likely Files or Areas
- src/commands/history.ts
- tests/commands/history.test.ts
- AGENTFLIGHT_DEVLOG.md
- CHANGELOG.md
- docs/development/product-direction.md

## Files or Areas Not to Touch
- package.json
- package-lock.json
- .agentflight/evidence/**
- .agentflight/reports/**

## Acceptance Criteria
- Non-current start-only sessions remain listed in `agentflight history`.
- Non-current start-only sessions render a compact "start only" note instead of repeated missing artifact lines.
- Current start-only sessions keep existing `Open first: none yet` and handoff guidance.
- Sessions with any verification evidence or review artifact keep the full detailed history block.
- History output stays repo-relative and local-only.

## Verification Commands
- npm test -- tests/commands/history.test.ts
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
Revert the history command, tests, and documentation changes from this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
