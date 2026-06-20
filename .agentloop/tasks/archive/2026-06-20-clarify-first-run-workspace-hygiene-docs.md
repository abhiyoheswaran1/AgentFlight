# Clarify first-run workspace hygiene docs

- Created date: 2026-06-20
- Task type: docs
- Status: done

## Problem Statement
First-run real-app handoff can surface generated .projscan-memory/memory.json, which is correct but noisy for new users.

## Desired Outcome
User-facing docs explain that .projscan-memory/** may appear on first run and can be added to changedFileFilters.ignore when it is not meant for review.

## Constraints
- Documentation-only change.
- Do not change runtime filtering behavior.
- Do not version bump, tag, publish, or release.

## Non-Goals
- Workspace hygiene feature work.
- Hardcoding .projscan-memory/** as a built-in ignore.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- docs/development/changed-file-filters.md
- docs/development/v0.6.0-handoff-dogfood-findings.md
- README.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Docs mention first-run .projscan-memory/** guidance clearly.
- .projscan-memory/** remains suggestion-only, not a built-in ignore.

## Verification Commands
- npm run format:check
- npm run verify

## Post-Verification Gates
- No post-verification gate recorded. Use this for commands that need a fresh AgentLoop verification report.

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Re-check protected areas before changing migrations, auth, secrets, billing, deployment, or public APIs.

## Rollback Notes
Revert the documentation changes.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
