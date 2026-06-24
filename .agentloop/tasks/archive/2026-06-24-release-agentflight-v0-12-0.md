# Release AgentFlight v0.12.0

- Created date: 2026-06-24
- Task type: release
- Status: done

## Problem Statement
Ship the completed Project Review Contract calibration and proof freshness attribution work as a minor AgentFlight release.

## Desired Outcome
AgentFlight v0.12.0 is version-bumped, verified, committed, tagged, pushed, published through Trusted Publishing, and confirmed on npm latest.

## Constraints
- Do not add product features during the release pass.
- Do not publish manually unless Trusted Publishing fails and recovery is explicitly approved.
- Preserve unrelated user work and stage only intended release files.

## Non-Goals
- No v0.13.0 planning or implementation.
- No new dependencies.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- package.json
- package-lock.json
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md
- README.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- package.json and package-lock.json report 0.12.0.
- CLI version reports 0.12.0 from dist.
- npm run verify, format check, pack dry-run, audit, ProjScan, and AgentLoopKit verification pass or have documented non-blocking cautions.
- main and tag v0.12.0 are pushed.
- npm view agentflight version reports 0.12.0.

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
If release workflow fails before npm publish, fix forward and retag only if needed. If npm publish succeeds with a critical issue, release a patch.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
