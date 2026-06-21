# Clean remaining public positioning references

- Created date: 2026-06-21
- Task type: docs
- Status: done

## Problem Statement
Remaining public docs and changelog entries still use AI coding wording after the current positioning copy was updated.

## Desired Outcome
Packaged/public docs and changelog entries avoid AI coding phrasing and use coding agent sessions or coding agents instead.

## Constraints
- Docs/copy only; no runtime behavior changes.
- Do not rewrite task contracts or devlog historical transcripts.
- Do not version bump, release, tag, push, or publish.

## Non-Goals
- No website deployment.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- CHANGELOG.md
- docs/development/dogfooding.md
- docs/roadmap/v0.4.0-review-intelligence-plan.md
- docs/marketing/launch-notes-v0.3.0.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Remaining public docs scan has no AI coding or AI-agent phrasing outside devlog/task archives.
- Copy uses coding agent sessions/coding agents consistently.

## Verification Commands
- npm run format:check
- npm run verify
- npm pack --dry-run

## Post-Verification Gates
- npx projscan@latest doctor --format json
- npx projscan@latest preflight --mode before_commit --format json
- npx agentloopkit@latest verify

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Historical release wording should stay accurate while avoiding stale positioning.

## Rollback Notes
Revert docs and changelog copy for this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
