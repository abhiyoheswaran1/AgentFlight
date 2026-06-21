# Show open-first artifact guidance in history

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
History lists prior session artifacts but does not tell engineers which one to open first, so users still have to infer replay versus report versus handoff from readiness.

## Desired Outcome
agentflight history shows a concise Open first line for each session using local readiness and artifact availability.

## Constraints
- Keep history read-only and local-only.
- Do not add session switching, search, export modes, PR comments, JSON/CI, release, or version bump scope.

## Non-Goals
- Do not generate missing artifacts from history.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/history.ts
- tests/commands/history.test.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Ready sessions with replay artifacts show Open first: replay.
- Blocked or not-ready sessions with reports show Open first: report.
- Sessions without recorded readiness but with handoff artifacts show Open first: handoff.

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
Revert the history Open first line, tests, and docs for this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
