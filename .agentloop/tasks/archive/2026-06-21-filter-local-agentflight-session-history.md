# Filter local AgentFlight session history

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
Engineers can list recent local sessions, but long histories still require manual scanning to find blocked work, ready handoffs, or a task by name.

## Desired Outcome
agentflight history can filter existing local session summaries by task text and recorded readiness state without adding indexes, sync, export, or session switching.

## Constraints
- Keep history read-only and local-only.
- Do not add JSON/CI, cloud, PR comments, session switching, or a search index.
- Keep output repo-relative and avoid exposing absolute paths.

## Non-Goals
- Do not change report/replay/handoff artifact generation.
- Do not implement hosted search or project dashboards.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/history.ts
- src/cli.ts
- src/core/session.ts
- tests/commands/history.test.ts
- README.md
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- history --task filters sessions by case-insensitive task text.
- history --state filters sessions by recorded readiness state including ready, blocked, needs_verification, unknown, and current.
- latest-action and previous-artifact guidance are derived from the filtered result set.
- empty filtered results give a clear local message without malformed-session loss.

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
Revert history command option parsing, filtering helper changes, tests, and docs for this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
