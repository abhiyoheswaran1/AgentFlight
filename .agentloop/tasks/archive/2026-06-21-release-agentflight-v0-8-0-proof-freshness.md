# Release AgentFlight v0.8.0 proof freshness

- Created date: 2026-06-21
- Task type: release
- Status: done

## Problem Statement
Proof freshness work is implemented locally and needs a clean v0.8.0 release audit, version bump, verification, commit, tag, and Trusted Publishing release.

## Desired Outcome
AgentFlight v0.8.0 is released with proof freshness, current proof evidence, documented ProjScan sign-off, and a clean worktree.

## Constraints
- Do not add new product features during the release pass.
- Do not bump beyond 0.8.0.
- Do not manually publish to npm unless Trusted Publishing fails and manual recovery is explicitly approved.

## Non-Goals
- Claim Ledger or v0.9.0 feature work.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- package.json
- package-lock.json
- CHANGELOG.md
- docs/development/v0.8.0-release-audit.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- package and CLI report 0.8.0
- release verification passes
- ProjScan caution is documented as manual sign-off only
- main and tag v0.8.0 are pushed
- npm latest reports 0.8.0

## Verification Commands
- npm run verify
- npm run format:check
- npm pack --dry-run
- npm audit --audit-level=moderate
- npx projscan@latest doctor --format json
- npx projscan@latest preflight --mode before_commit --format json
- npx projscan@latest review --format json
- npx agentloopkit@latest verify

## Post-Verification Gates
- No post-verification gate recorded. Use this for commands that need a fresh AgentLoop verification report.

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Re-check protected areas before changing migrations, auth, secrets, billing, deployment, or public APIs.

## Rollback Notes
Revert the release commit and delete tag v0.8.0 if release verification or publishing fails before npm confirmation.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
