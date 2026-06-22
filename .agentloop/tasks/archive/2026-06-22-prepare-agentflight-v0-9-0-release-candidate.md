# Prepare AgentFlight v0.9.0 release candidate

- Created date: 2026-06-22
- Task type: release
- Status: done

## Problem Statement
The Review Contract claim ledger work is implemented locally and needs a focused release-preparation pass before any actual cut.

## Desired Outcome
AgentFlight has a documented v0.9.0 release candidate with package metadata, release audit, verification evidence, and handoff evidence ready for approval.

## Constraints
- Do not commit, push, tag, publish, or manually release during preparation.
- Do not add new product features.
- Keep the release scope to the Review Contract claim ledger and dogfood bug fixes already implemented.

## Non-Goals
- Publishing to npm.
- Pushing main or creating a tag.
- Starting v0.10.0 work.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- package.json
- package-lock.json
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md
- docs/development/v0.9.0-release-audit.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Package metadata reports 0.9.0 locally.
- CHANGELOG has a dated v0.9.0 section.
- Release audit documents ProjScan caution and manual sign-off rationale if present.
- Verification, package dry-run, audit, ProjScan, AgentLoopKit, and AgentFlight handoff are refreshed.

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
Revert release-prep metadata/docs changes; keep the implemented feature unchanged unless release review finds a blocker.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
