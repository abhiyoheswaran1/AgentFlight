# Show concrete doctor verify suggestions

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
agentflight doctor warns when verification.commands is empty but package proof scripts exist, yet its suggested fix still says agentflight verify -- <command> instead of showing the concrete detected commands now used by verify.

## Desired Outcome
Doctor warning suggests concise copy-pasteable agentflight verify commands for detected package proof scripts while keeping config immutable.

## Constraints
- Keep the change local-only and read-only.
- Do not mutate .agentflight/config.json.
- Reuse existing verification command detection where practical.

## Non-Goals
- No named verification profiles.
- No JSON/CI/export modes.
- No release or version bump.

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
- Doctor warning includes concrete detected agentflight verify -- commands when config commands are empty.
- Repos without proof scripts keep concise guidance.
- Configured verification commands keep the OK doctor result.
- Config and raw evidence remain unchanged.

## Verification Commands
- npm test -- tests/core/doctor.test.ts tests/commands/workflow.test.ts
- npm run verify
- npm run format:check
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
- Doctor output is user-facing CLI copy; keep suggestions capped and readable.

## Rollback Notes
Revert doctor source/tests/docs for this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
