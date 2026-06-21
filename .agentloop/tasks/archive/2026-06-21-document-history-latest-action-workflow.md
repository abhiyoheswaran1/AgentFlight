# Document history latest action workflow

- Created date: 2026-06-21
- Task type: docs
- Status: done

## Problem Statement
README and example docs describe history as a session list, but do not mention the top-level latest action with open-first artifact, recorded readiness, and clean-status handoff back to history.

## Desired Outcome
User-facing docs describe history as the way to reopen the latest local artifacts and mention the latest-action summary.

## Constraints
- Docs-only; do not change runtime behavior.
- Keep local-first/no-upload positioning.

## Non-Goals
- No release, version bump, tag, push, publish, website work, JSON/CI, PR comments, cloud, auth, billing, or hosted behavior.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- README.md
- docs/examples/basic-agentflight-session.md
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- README mentions that history shows a latest action with recorded readiness and open-first artifact guidance.
- The basic example points users to history for reopening latest local artifacts after handoff/status.

## Verification Commands
- npm run format:check
- npm run verify
- npm pack --dry-run
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
Revert the docs changes.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
