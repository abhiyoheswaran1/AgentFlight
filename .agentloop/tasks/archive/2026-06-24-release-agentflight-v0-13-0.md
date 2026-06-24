# Release AgentFlight v0.13.0

- Created date: 2026-06-24
- Task type: release
- Status: done

## Problem Statement
The accumulated local review-workflow improvements are verified and need the usual AgentFlight release loop.

## Desired Outcome
AgentFlight v0.13.0 is versioned, audited, committed, pushed, tagged, published through the release workflow, and verified from npm latest.

## Constraints
- No additional product features during release prep.
- Do not manually publish to npm unless trusted publishing fails and manual recovery is explicitly requested.
- Keep the release local-first and source-free; preserve existing dirty work until it is intentionally committed.

## Non-Goals
- No additional product features, new commands, hosted workflow, PR automation,
  manual npm publish, or version beyond `0.13.0`.

## Assumptions
- The dirty implementation files were already reviewed under the archived
  maintenance and review-workflow task contracts and belong to this release.
- npm publishing is handled by the existing GitHub Actions Trusted Publishing
  workflow after the `v0.13.0` tag is pushed.

## Likely Files or Areas
- Release metadata: `package.json`, `package-lock.json`, `CHANGELOG.md`, and
  `docs/development/v0.13.0-release-audit.md`.
- Existing reviewed implementation and test files from the accumulated
  review-workflow improvement branch.
- AgentLoop task, handoff, and release-note evidence files.

## Files or Areas Not to Touch
- Do not modify `.agentflight/sessions/`, `.agentflight/reports/`,
  `.agentflight/evidence/`, or `.agentflight/current/` runtime evidence for the
  release commit.
- Do not modify `.env` files or print secret values.
- Do not add dependency changes, hosted services, telemetry, login, billing, or
  PR comment behavior.

## Acceptance Criteria
- package.json and lockfile report 0.13.0 and built CLI reports 0.13.0.
- npm run verify, npm run format:check, npm pack --dry-run, npm audit, ProjScan, AgentLoopKit, and AgentFlight dogfood pass or have documented scale-only signoff.
- main and tag v0.13.0 are pushed and npm latest reports 0.13.0.

## Verification Commands
- npm run verify
- npm run format:check

## Post-Verification Gates
- No post-verification gate recorded. Use this for commands that need a fresh AgentLoop verification report.

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Pre-existing dirty non-evidence files before task creation: 44 total; examples: `AGENTFLIGHT_DEVLOG.md`, `CHANGELOG.md`, `README.md`, `docs/development/product-direction.md`, `docs/development/project-review-contract.md`. Confirm they belong to this task before implementation.

## Rollback Notes
- If the release workflow fails before npm publish, fix the release commit or
  workflow and move/recreate the `v0.13.0` tag only after the corrected commit
  is pushed.
- If npm publishes and a critical issue is found, prepare a focused patch
  release instead of rewriting published npm history.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
