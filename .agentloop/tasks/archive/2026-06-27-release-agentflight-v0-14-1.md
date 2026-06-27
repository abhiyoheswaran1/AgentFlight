# Release AgentFlight v0.14.1

- Created date: 2026-06-27
- Task type: release
- Status: done

## Problem Statement
Publish the website/product capture update as an AgentFlight patch release after the asset commit has been pushed for the website team.

## Desired Outcome
AgentFlight v0.14.1 is tagged, pushed, published by the release workflow, and verified on npm/GitHub.

## Constraints
- Patch release only; no product behavior changes.
- Keep the already-pushed website asset commit separate from the release bump.
- Do not publish manually if the GitHub release workflow handles npm publishing.

## Non-Goals
- Do not add new features or change CLI behavior.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- package.json
- package-lock.json
- CHANGELOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- package.json and package-lock.json are bumped to 0.14.1.
- CHANGELOG.md includes v0.14.1 release notes.
- Release checks pass before tag push.
- GitHub release workflow succeeds and npm latest reports 0.14.1.

## Verification Commands
- npm run verify
- npm run format:check
- npm pack --dry-run
- npm audit

## Post-Verification Gates
- npx --no-install projscan --offline doctor
- npx --no-install projscan --offline preflight --mode before_commit
- agentloop verify
- agentloop check-gates
- agentloop npm-status

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Release automation may fail after tag push; inspect GitHub Actions and npm status before claiming availability.

## Rollback Notes
If publishing fails before npm release, fix workflow and rerun tag workflow. If npm publishes with a critical issue, ship a follow-up patch release.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
