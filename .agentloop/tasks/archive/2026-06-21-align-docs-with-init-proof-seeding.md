# Align docs with init proof seeding

- Created date: 2026-06-21
- Task type: docs
- Status: done

## Problem Statement
README and verification docs do not yet explain that agentflight init seeds detected verification commands into .agentflight/config.json, and the 60-second workflow still over-emphasizes status before handoff.

## Desired Outcome
Public docs describe the handoff-first workflow and the new init config seeding behavior without adding new product claims.

## Constraints
- Docs-only change; do not add features, version bumps, release steps, JSON/CI claims, PR comments, hosted features, or new profiles.

## Non-Goals
- No code changes, no package metadata changes, no release.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- README.md
- docs/development/verification.md
- AGENTFLIGHT_DEVLOG.md
- CHANGELOG.md
- docs/superpowers/plans/2026-06-21-docs-init-proof-seeding.md

## Files or Areas Not to Touch
- package.json
- package-lock.json

## Acceptance Criteria
- README 60-second workflow reflects start, verify, handoff as the core path.
- README command description notes init seeds detected verification commands when package scripts exist.
- Verification docs mention init-created configs can contain detected commands, while manual config remains supported.

## Verification Commands
- npm run format:check
- npm run verify

## Post-Verification Gates
- npm pack --dry-run
- npm audit --audit-level=moderate
- npx projscan@latest doctor --format json
- npx projscan@latest preflight --mode before_commit --format json
- npx projscan@latest review --format json
- npx agentloopkit@latest verify

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Docs must not claim hosted, CI, automatic PR comment, or release behavior that does not exist.

## Rollback Notes
Revert README/verification docs, changelog/devlog entry, plan, and AgentLoop evidence.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
