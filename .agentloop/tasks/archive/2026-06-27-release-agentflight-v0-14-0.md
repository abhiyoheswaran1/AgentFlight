# Release AgentFlight v0.14.0

- Created date: 2026-06-27
- Task type: release
- Status: done

## Problem Statement
Ship the verified Baseframe Suite Integration v1 changes as a public AgentFlight release.

## Desired Outcome
Version metadata, changelog, git commit, tag, push, and publish evidence are complete for AgentFlight v0.14.0.

## Constraints
- Preserve existing verified Baseframe integration changes.
- Do not add dependencies unless required.
- Do not read or print secrets.

## Non-Goals
- None recorded yet.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- package.json
- package-lock.json
- CHANGELOG.md
- README.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Version is bumped to 0.14.0 consistently.
- CHANGELOG documents Baseframe Suite Integration v1.
- Full verification, package dry run, npm audit, ProjScan, and AgentLoopKit checks pass or are explicitly reported.
- Commit, tag, push, publish, and post-publish npm availability verification are completed.

## Verification Commands
- npm run test
- npm run lint
- npm run typecheck
- npm run build
- npm run format:check
- npm pack --dry-run
- npm audit
- npx --no-install projscan --offline doctor
- npx --no-install projscan --offline preflight --mode before_commit
- agentloop verify

## Post-Verification Gates
- agentloop check-gates

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Re-check protected areas before changing migrations, auth, secrets, billing, deployment, or public APIs.

## Rollback Notes
If publish fails before npm accepts the package, fix locally and rerun release verification. If npm publish succeeds with a critical issue, ship a patch release rather than rewriting published history.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
