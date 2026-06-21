# Surface handoff artifacts in history output

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
AgentFlight history lists report and replay artifact paths, but handoff is now the golden local review packet and is not discoverable from history.

## Desired Outcome
History shows an existing local handoff artifact path for each session when available, while preserving report/replay paths and local-only read-only behavior.

## Constraints
- Do not add session switching, search, export, sync, JSON, PR comments, hosted features, version changes, or release work.
- Keep artifact paths repo-relative and local-only.
- Do not change session storage or captured evidence.

## Non-Goals
- Do not redesign history output.
- Do not generate missing handoff artifacts from history.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/history.ts
- tests/commands/history.test.ts
- README.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- History shows Handoff: <repo-relative path> when a session handoff artifact exists.
- History shows Handoff: missing when the artifact is absent.
- Report/replay path behavior, malformed-session handling, and invalid limit behavior remain unchanged.

## Verification Commands
- npm test -- tests/commands/history.test.ts
- npm run verify
- npm run format:check

## Post-Verification Gates
- No post-verification gate recorded. Use this for commands that need a fresh AgentLoop verification report.

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Re-check protected areas before changing migrations, auth, secrets, billing, deployment, or public APIs.

## Rollback Notes
Revert history handoff path display, tests, and docs.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
