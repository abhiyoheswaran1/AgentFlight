# Release AgentFlight v0.7.0

- Created date: 2026-06-21
- Task type: release
- Status: done

## Problem Statement
The published v0.6.0 release is already tagged and on npm, while local main contains the next unreleased minor-release work.

## Desired Outcome
Cut AgentFlight v0.7.0 with release audit evidence, passing verification, pushed main, pushed tag, release workflow completion, npm latest confirmation, and published smoke verification.

## Constraints
- Do not add product features during the release pass.
- Do not manually publish to npm unless Trusted Publishing fails and manual recovery is explicitly approved.
- Do not move or reuse the existing v0.6.0 tag.

## Non-Goals
- None recorded yet.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md
- docs/development/v0.7.0-release-audit.md
- package.json
- package-lock.json

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- package.json and package-lock.json report 0.7.0.
- node dist/cli.js --version reports 0.7.0 after build.
- Release audit documents ProjScan caution as manual scale signoff only if it remains.
- npm view agentflight version reports 0.7.0 after the release workflow.

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
Before publishing, revert the release commit or reset the branch to the last
reviewed commit. After tag creation, do not move `v0.7.0`; if Trusted
Publishing succeeds and a regression is found, cut a follow-up patch release
from a reverted or fixed commit.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
