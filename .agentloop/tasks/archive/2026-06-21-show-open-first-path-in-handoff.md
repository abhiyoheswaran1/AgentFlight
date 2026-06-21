# Show open-first path in handoff

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
Handoff tells engineers whether to open replay or report first, but the artifact path is lower in the output, adding lookup work in the golden path.

## Desired Outcome
Handoff output includes the chosen artifact label and repo-relative path on the Open first line while preserving the artifact list.

## Constraints
- Keep handoff local-only and deterministic.
- Do not add flags, export modes, PR comments, cloud, hosted features, or new workflow surfaces.
- Do not change artifact generation behavior or exit-code readiness semantics.

## Non-Goals
- No release, version bump, JSON/CI, login, billing, Pro/Team, or GitHub App work.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/handoff.ts
- tests/commands/evidence-output.test.ts
- AGENTFLIGHT_DEVLOG.md
- CHANGELOG.md
- docs/superpowers/plans/2026-06-21-handoff-open-first-path.md

## Files or Areas Not to Touch
- package.json
- package-lock.json

## Acceptance Criteria
- Ready handoffs print Open first: replay <replay path>.
- Blocked handoffs print Open first: report <report path>.
- Artifact list and local-only wording remain unchanged.

## Verification Commands
- npm test -- tests/commands/evidence-output.test.ts
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
- Handoff is a primary CLI surface; keep wording compact and tests exact enough to catch regressions.

## Rollback Notes
Revert handoff output changes, tests, changelog/devlog notes, plan, and AgentLoop evidence.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
