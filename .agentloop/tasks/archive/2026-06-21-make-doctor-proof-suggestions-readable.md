# Make doctor proof suggestions readable

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
agentflight doctor prints detected verification command suggestions as one long semicolon-separated line, making the warning noisy when several proof scripts exist.

## Desired Outcome
Doctor keeps the same full suggested proof commands but renders multiple suggestions as a compact readable list.

## Constraints
- Keep behavior local-only and deterministic.
- Do not release, version bump, push, tag, or publish.
- Keep scope limited to doctor verification-command suggested-fix copy/rendering and tests.

## Non-Goals
- Do not add verification profiles, config mutation, JSON/CI, PR comments, cloud, login, billing, or hosted features.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/core/doctor.ts
- src/commands/doctor.ts
- tests/core/doctor.test.ts
- tests/commands/workflow.test.ts
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Multiple detected proof commands render as a readable multiline suggested fix.
- Full suggested command text remains present.
- Single/no-command suggested fixes remain readable.

## Verification Commands
- npm test -- tests/core/doctor.test.ts tests/commands/workflow.test.ts
- npm run verify
- npm run format:check

## Post-Verification Gates
- npx projscan@latest doctor --format json
- npx projscan@latest preflight --mode before_commit --format json
- npx agentloopkit@latest verify

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Changing Doctor output can affect tests or scripts that match exact text; keep JSON-like result shape unchanged and only improve suggestedFix text/rendering.

## Rollback Notes
Revert doctor suggestion rendering and tests.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
