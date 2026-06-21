# Show open-first path in history

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
History tells engineers which artifact to open first, but the artifact path is on a separate line, slowing review when many sessions are listed.

## Desired Outcome
History keeps listing all artifacts, and the Open first line includes the chosen artifact label plus its local path when available.

## Constraints
- Keep history read-only: no search index, sync, export, session switching, or artifact generation.
- Do not add new flags or product surfaces.
- Keep output local-only and repo-relative.

## Non-Goals
- No release, version bump, PR comments, JSON/CI, cloud, hosted features, login, billing, or Pro/Team work.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/history.ts
- tests/commands/history.test.ts
- AGENTFLIGHT_DEVLOG.md
- CHANGELOG.md
- docs/superpowers/plans/2026-06-21-history-open-first-path.md

## Files or Areas Not to Touch
- package.json
- package-lock.json

## Acceptance Criteria
- Ready sessions show Open first: replay <path> when replay exists.
- Blocked sessions show Open first: report <path> when report exists.
- Unknown-readiness sessions still fall back to handoff when available.
- Sessions without a primary artifact still show Open first: none yet.

## Verification Commands
- npm test -- tests/commands/history.test.ts
- npm run verify

## Post-Verification Gates
- npm run format:check
- npm pack --dry-run
- npm audit --audit-level=moderate
- npx projscan@latest doctor --format json
- npx projscan@latest preflight --mode before_commit --format json
- npx projscan@latest review --format json
- npx agentloopkit@latest verify

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- History output is a user-facing CLI surface; keep wording compact and update tests.

## Rollback Notes
Revert history output changes, tests, changelog/devlog notes, plan, and AgentLoop evidence.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
