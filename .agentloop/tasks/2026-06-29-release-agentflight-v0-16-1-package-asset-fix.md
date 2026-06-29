# Release AgentFlight v0.16.1 package asset fix

- Created date: 2026-06-29
- Task type: release
- Status: review

## Problem Statement
AgentFlight v0.16.0 README references docs/assets/agentflight-finish.png, but the npm package allowlist does not include that asset, so the published README can render with a missing image.

## Desired Outcome
Release AgentFlight v0.16.1 as a focused patch that includes the finish screenshot in the npm tarball and records the packaging fix.

## Constraints
- Keep the release focused on package metadata, release notes, and regression coverage.
- Do not add product features, dependencies, cloud, login, billing, GitHub App, or team features.

## Non-Goals
- Do not modify ProjScan or AgentLoopKit repositories.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- package.json
- package-lock.json
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md
- tests/public-positioning.test.ts
- docs/development/v0.16.1-release-audit.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- npm pack --dry-run includes docs/assets/agentflight-finish.png.
- README asset references are covered by a regression test against package.json files allowlist.
- package.json and package-lock.json are bumped to 0.16.1 without dependency changes.
- CHANGELOG.md records the v0.16.1 packaging fix.
- Release commit, tag, CI/release workflow, and npm latest are verified.

## Verification Commands
- npm run verify
- npm run format:check
- npm pack --dry-run
- npm audit --audit-level=moderate
- npx projscan --offline doctor
- npx projscan --offline preflight --mode before_commit
- npx projscan --offline review --format json
- npx agentloop verify

## Post-Verification Gates
- npx agentloop check-gates
- npx agentloop release-notes --write
- npx agentloop npm-status

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Public package metadata patch; verify dry-run contents before tagging.

## Rollback Notes
Before push, amend or revert the release commit. After npm publication, cut a follow-up patch rather than rewriting published history.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
