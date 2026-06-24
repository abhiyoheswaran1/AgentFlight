# Release AgentFlight v0.11.0 Project Review Contract

- Created date: 2026-06-24
- Task type: release
- Status: done

## Problem Statement
Project Review Contract explainability and calibration is implemented locally and needs a release pass with public-doc review, stop-slop cleanup, version bump, verification, commit, push, tag, release monitoring, npm verification, and website update prompt.

## Desired Outcome
AgentFlight v0.11.0 is released through the normal trusted publishing flow with npm latest verified, clean npx smoke checks, and website update guidance ready.

## Constraints
- Do not add product features during release.
- Use stop-slop on user-facing docs before version bump.
- Do not manually run npm publish unless trusted publishing fails and manual recovery is explicitly required.
- Preserve local-first positioning and avoid AI coding assistant phrasing in current user-facing copy.

## Non-Goals
- New feature work beyond release-doc cleanup.
- Cloud, login, billing, hosted dashboards, PR comments, JSON/CI expansion, or GitHub App work.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- package.json
- package-lock.json
- CHANGELOG.md
- README.md
- docs/development/project-review-contract.md
- docs/development/v0.11.0-release-audit.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- README and public docs are reviewed with stop-slop and current positioning.
- package version and CLI report 0.11.0.
- Full verification, package dry-run, audit, ProjScan, AgentLoopKit, and AgentFlight smoke checks pass or documented scale signoff remains non-concrete.
- main and tag v0.11.0 are pushed.
- npm view agentflight version and npx agentflight@latest --version report 0.11.0.
- Website update prompt covers overview and docs pages.

## Verification Commands
- npm test -- tests/core/review-intelligence.test.ts tests/core/review-contract.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/commands/evidence-output.test.ts
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
- Release includes broad review-surface changes already flagged by ProjScan as manual scale signoff.

## Rollback Notes
If release verification fails before tag push, fix locally or revert the release commit. If tag push or publishing fails, do not manually publish without explicit recovery approval.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
