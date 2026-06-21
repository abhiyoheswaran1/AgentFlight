# Clarify init handoff golden path

- Created date: 2026-06-21
- Task type: docs
- Status: done

## Problem Statement
agentflight init still sends first-run users to status before the handoff workflow, even though research and product direction make handoff the golden end-of-session path.

## Desired Outcome
First-run init output points users through start, verify, and handoff, while keeping status and doctor as supporting checks.

## Constraints
- Keep this to CLI copy and tests; do not add new commands, flags, release steps, hosted features, or broad workspace hygiene behavior.

## Non-Goals
- No version bump, release, PR comments, JSON/CI, cloud, login, billing, or named verification profiles.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/init.ts
- tests/commands/workflow.test.ts
- AGENTFLIGHT_DEVLOG.md
- CHANGELOG.md
- docs/superpowers/plans/2026-06-21-init-handoff-golden-path.md

## Files or Areas Not to Touch
- package.json
- package-lock.json

## Acceptance Criteria
- agentflight init output lists start, verify, and handoff as the primary next commands.
- agentflight init output still mentions status and doctor as supporting checks.
- tests cover the new first-run guidance.

## Verification Commands
- npm test -- tests/commands/workflow.test.ts
- npm run verify
- npm run format:check

## Post-Verification Gates
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
- Changing init copy affects first-run UX but should not affect runtime state or package metadata.

## Rollback Notes
Revert the init output copy, tests, changelog/devlog entry, plan, and task evidence.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
