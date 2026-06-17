# Prepare AgentFlight v0.5.1 dogfood patch

- Created date: 2026-06-17
- Task type: bugfix
- Status: done

## Problem Statement
Dogfood of AgentFlight v0.5.0 found terminal/report noise issues that need a focused v0.5.1 patch candidate.

## Desired Outcome
Terminal failure excerpts match report/replay stderr preference, dense review surfaces are less noisy, AgentLoopKit tooling diagnostics are concise, first-run ProjScan memory guidance remains suggestion-only, sibling dogfood artifacts are cleaned where safe, docs/tests are updated, and verification passes.

## Constraints
- Do not start v0.6.0.
- Do not add named verification profiles, export modes, PR comments, JSON/CI, cloud, login, billing, Pro/Team, GitHub App, or hosted features.
- Do not version bump, commit, push, tag, publish, or release.
- Keep v0.5.1 small and shippable.
- Do not read or print secrets.

## Non-Goals
- No broad workspace hygiene system, release automation, package publish, or feature expansion.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src
- tests
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md
- docs/development/v0.5.0-dogfood-findings.md
- docs/development/changed-file-filters.md

## Files or Areas Not to Touch
- package.json
- package-lock.json

## Acceptance Criteria
- Inline terminal failure excerpt prefers stderr over stdout and stdout fallback remains intact.
- Captured stdout/stderr evidence files remain intact.
- Failure excerpts remain capped and HTML escaping remains safe if touched.
- Long suggested proof commands are compact in dense review surfaces where implemented.
- AgentLoopKit unavailable/not-configured report output is concise while preserving signal.
- .projscan-memory/** remains suggested but not hardcoded as built-in ignore.
- fifa-predictor untracked dogfood artifacts are cleaned if accessible.
- Requested verification commands pass or concrete blockers are documented.

## Verification Commands
- npm test -- tests/commands/verify.test.ts tests/commands/evidence-output.test.ts tests/core/review-intelligence.test.ts
- npm run verify
- npm run format:check
- npm pack --dry-run
- npm audit --audit-level=moderate
- npx projscan@latest doctor --format json
- npx projscan@latest preflight --mode before_commit --format json
- npx agentloopkit@latest verify

## Post-Verification Gates
- No post-verification gate recorded. Use this for commands that need a fresh AgentLoop verification report.

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Patch touches CLI output/report surfaces and command text rendering; verify security escaping and command evidence preservation.

## Rollback Notes
Revert source, test, and docs changes from this patch task; remove sibling repo dogfood artifacts only because they are untracked generated evidence.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
