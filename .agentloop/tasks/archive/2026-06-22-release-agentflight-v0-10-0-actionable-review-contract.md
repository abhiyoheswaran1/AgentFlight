# Release AgentFlight v0.10.0 actionable review contract

- Created date: 2026-06-22
- Task type: release
- Status: done

## Problem Statement
The actionable Review Contract work is implemented locally and needs a focused release audit, version bump, verification, commit, push, tag, Trusted Publishing, and npm/latest confirmation.

## Desired Outcome
AgentFlight v0.10.0 is committed, pushed, tagged, published through the trusted release workflow, confirmed on npm latest, and backed by local verification and release audit evidence.

## Constraints
- Release only the completed actionable Review Contract review-path work.
- Do not add product features during the release pass.
- Do not manually npm publish unless Trusted Publishing fails and manual recovery is explicitly approved.
- Preserve local-first, no telemetry, no source upload positioning.

## Non-Goals
- ProjScan-enriched ranking
- PR comments
- JSON/CI surfaces
- Named verification profiles
- Export modes
- Cloud, login, billing, database, hosted features, GitHub App

## Assumptions
- None recorded yet.

## Likely Files or Areas
- package.json
- package-lock.json
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md
- docs/development/v0.10.0-release-audit.md
- README.md
- src/core/review-contract.ts
- src/core/output.ts
- src/commands/status.ts
- src/commands/handoff.ts
- src/renderers/html-replay.ts
- src/renderers/markdown-report.ts
- src/renderers/resume-prompt.ts
- tests/core/review-contract.test.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- package.json reports 0.10.0 and node dist/cli.js --version reports 0.10.0.
- Release audit documents the ProjScan scale caution and manual sign-off.
- Full local verification, package dry run, audit, ProjScan, and AgentLoopKit checks pass or have documented non-blocking caution.
- main and tag v0.10.0 are pushed successfully.
- npm view agentflight version and npx --yes agentflight@latest --version report 0.10.0 after release workflow completes.

## Verification Commands
- npm test -- tests/core/review-contract.test.ts tests/core/review-intelligence.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts tests/commands/evidence-output.test.ts
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
- ProjScan may keep a manual release-signoff caution because the changed-file risk score exceeds the scale threshold.

## Rollback Notes
If release workflow fails before npm publish, fix on main and move/recreate the tag. If npm publish completes with a critical issue, ship a focused patch release rather than mutating the published version.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
