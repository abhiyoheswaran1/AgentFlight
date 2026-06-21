# Clarify clean risk reason wording

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
Clean status now reports Risk: none, but the shared risk reason still says 'No changed files detected yet,' which sounds like pre-work rather than a clean committed state.

## Desired Outcome
Zero-change risk reasons use current-state wording in status text and JSON while preserving Risk: none semantics.

## Constraints
- No risk model changes beyond copy, no release/version changes, no status layout redesign.

## Non-Goals
- No risk-level changes.
- No status layout redesign.
- No Review Intelligence ranking or readiness changes.
- No release, version bump, tag, push, or publish.

## Assumptions
- `Risk: none` is already the intended clean-worktree risk level.
- The reason should describe the current inspected worktree, not imply that work has not started yet.
- Older session metadata may still contain the previous wording and does not need migration.

## Likely Files or Areas
- `src/core/risk.ts`
- `tests/core/risk.test.ts`
- `tests/commands/evidence-output.test.ts`
- `CHANGELOG.md`
- `AGENTFLIGHT_DEVLOG.md`
- `docs/superpowers/plans/2026-06-21-clean-risk-reason-wording.md`

## Files or Areas Not to Touch
- Risk levels/types.
- Review Intelligence scoring, proof gaps, or readiness state.
- Report/replay/resume/handoff layout beyond naturally using the shared reason if already wired.

## Acceptance Criteria
- analyzeRisk([]) reason no longer contains 'yet'.
- Clean status output says no changed files are currently detected.

## Verification Commands
- npm test -- tests/core/risk.test.ts tests/commands/evidence-output.test.ts
- npm run verify
- npm run format:check

## Post-Verification Gates
- npm pack --dry-run
- npm audit --audit-level=moderate
- npx projscan@latest doctor --format json
- npx projscan@latest preflight --mode before_commit --format json
- npx projscan@latest review --format json
- npx agentloopkit@latest verify
- agentloop check-gates after handoff

## Implementation Plan
- Add failing assertions for the zero-change risk reason and clean status text.
- Change only the shared zero-change risk reason string.
- Dogfood built `agentflight status` in a clean temp repo.

## Risk Notes
- Re-check protected areas before changing migrations, auth, secrets, billing, deployment, or public APIs.

## Rollback Notes
Restore the previous zero-change risk reason string in `src/core/risk.ts` and remove the focused assertions/docs for this wording change.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
