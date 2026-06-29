# Release AgentFlight v0.16.0

- Created date: 2026-06-29
- Task type: release
- Status: proposed

## Problem Statement
AgentFlight Guard is implemented and verified locally but has not been released.

## Desired Outcome
Release AgentFlight v0.16.0 with Guard, Review Passport target hints, docs, and pre-release evidence through the repo's tag-driven npm Trusted Publishing flow.

## Constraints
- Run the full release checklist before tagging.
- Do not add cloud, login, billing, GitHub App, or team features.
- Use the existing npm Trusted Publishing workflow; do not manually publish unless tag-driven release fails and an emergency publish is explicitly needed.

## Non-Goals
- Do not modify ProjScan or AgentLoopKit repositories.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- package.json
- package-lock.json
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md
- docs/development/v0.16.0-release-audit.md
- .agentloop/tasks/2026-06-29-release-agentflight-v0-16-0.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- package.json and package-lock.json version are 0.16.0.
- CHANGELOG.md documents v0.16.0 Guard release.
- Full verification, format check, package dry run, audit, ProjScan, and AgentLoopKit gates are recorded.
- Release commit and v0.16.0 tag are pushed.
- GitHub release workflow and npm latest are checked after push.

## Verification Commands
- npm run verify
- npm run format:check
- npm pack --dry-run
- npm audit
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
- Public CLI and package API release; verify output shape and npm package contents before tagging.
- ProjScan may require manual scale sign-off for release-sized change.

## Rollback Notes
For pre-push issues, amend or revert the release commit locally. For post-tag issues, cut a patch release or delete the tag/release only if the automated publish fails before npm publication.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
