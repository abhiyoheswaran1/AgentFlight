# Report clean status risk explicitly

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
agentflight status reports readiness as Clean worktree after commit, but the Risk line still says unknown when there are no changed files.

## Desired Outcome
Clean-worktree status output uses explicit no-risk wording while preserving non-clean risk behavior and Review Intelligence readiness.

## Constraints
- Do not add ranking, JSON/CI modes, releases, version changes, or unrelated status redesign.

## Non-Goals
- No status layout redesign.
- No Review Intelligence ranking changes.
- No JSON/CI mode changes.
- No release, version bump, tag, push, or publish.

## Assumptions
- A zero changed-file worktree is not unknown risk; it is explicitly no changed-file risk.
- The existing `unknown` risk level should remain valid for older artifact metadata or genuinely missing/unknown metadata.
- Clean-worktree readiness should remain the primary next-action signal after a commit.

## Likely Files or Areas
- `src/types/index.ts`
- `src/core/risk.ts`
- `src/core/session.ts`
- `tests/core/risk.test.ts`
- `tests/commands/evidence-output.test.ts`
- `CHANGELOG.md`
- `AGENTFLIGHT_DEVLOG.md`
- `docs/superpowers/plans/2026-06-21-clean-status-risk-wording.md`

## Files or Areas Not to Touch
- Review Intelligence ranking/scoring logic.
- Report, replay, handoff, resume layout beyond values naturally produced by the shared risk model.
- Release/version files.

## Acceptance Criteria
- Status output for zero changed files no longer says Risk: unknown.
- Status output still shows Clean worktree readiness when no files changed.
- Non-empty changed-file risk output remains unchanged.

## Verification Commands
- npm test -- tests/commands/status.test.ts tests/core/risk.test.ts
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
- Add failing risk/status tests for zero changed files.
- Add an explicit no-risk level for zero changed files while preserving `unknown` for legacy metadata.
- Keep non-empty changed-file risk output unchanged.
- Dogfood built `agentflight status` in a clean worktree after implementation.

## Risk Notes
- Re-check protected areas before changing migrations, auth, secrets, billing, deployment, or public APIs.

## Rollback Notes
Revert the `none` risk-level type addition, restore `analyzeRisk([])` to `unknown`, and remove the focused risk/status assertions and docs added for this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
