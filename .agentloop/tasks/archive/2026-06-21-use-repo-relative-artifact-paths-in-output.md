# Use repo-relative artifact paths in output

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
AgentFlight handoff/start/report/replay terminal output prints absolute .agentflight artifact paths, which are noisy and can leak local usernames or workspace folder names when pasted into review.

## Desired Outcome
User-facing terminal and handoff artifact text should display repo-relative .agentflight paths while command return values keep absolute paths for local file access.

## Constraints
- Do not change where artifacts are written.
- Do not change JSON evidence paths or raw evidence capture.
- Do not add export modes, PR comments, cloud, telemetry, or hosted features.

## Non-Goals
- No public release work.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/core/paths.ts
- src/commands/start.ts
- src/commands/report.ts
- src/commands/replay.ts
- src/commands/handoff.ts
- tests/commands/workflow.test.ts
- tests/commands/evidence-output.test.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Start output shows .agentflight/current/handoff.md without the absolute repo root.
- Report and replay outputs show repo-relative artifact paths while returning absolute paths.
- Handoff artifact list uses repo-relative paths and does not include the absolute repo root.

## Verification Commands
- npm test -- tests/commands/workflow.test.ts tests/commands/evidence-output.test.ts
- npm run verify
- npm run format:check

## Post-Verification Gates
- No post-verification gate recorded. Use this for commands that need a fresh AgentLoop verification report.

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Path display changes can affect users copying terminal output.

## Rollback Notes
Revert display-path helper, command output changes, docs, and tests for this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
