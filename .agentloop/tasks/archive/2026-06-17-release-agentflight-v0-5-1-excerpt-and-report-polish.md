# Release AgentFlight v0.5.1 excerpt and report polish

- Created date: 2026-06-17
- Task type: release
- Status: done

## Problem Statement
AgentFlight v0.5.1 patch candidate is implemented locally and needs audit sign-off, version bump, verification, commit, push, tag, and post-release validation.

## Desired Outcome
Release v0.5.1 through the trusted publishing workflow and verify npm latest reports 0.5.1.

## Constraints
- Do not add product features or start v0.6.0.
- Do not publish manually unless trusted publishing fails and manual recovery is explicitly requested.
- Do not bump beyond 0.5.1.

## Non-Goals
- ProjScan-enriched ranking, PR comments, JSON/CI, named verification profiles, export modes, cloud/login/billing/Pro/Team/database/hosted/GitHub App features.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- package.json
- package-lock.json
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md
- docs/development/v0.5.1-release-audit.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- package.json and CLI report 0.5.1.
- Release audit note documents ProjScan manual sign-off caution.
- Verification, packaging, audit, ProjScan, and AgentLoopKit checks run.
- main and tag v0.5.1 are pushed, npm latest is verified as 0.5.1.

## Verification Commands
- npm test -- tests/commands/verify.test.ts tests/commands/evidence-output.test.ts tests/core/review-intelligence.test.ts
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
If release validation fails before tag push, fix locally and rerun verification. If tag push succeeds but publishing fails, do not run npm publish without explicit recovery approval.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
