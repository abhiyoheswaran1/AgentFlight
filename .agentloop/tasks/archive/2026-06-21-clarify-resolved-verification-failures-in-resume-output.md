# Clarify resolved verification failures in resume output

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
AgentFlight resume output still reports total failed verification runs beside Ready for review, even when later passing runs resolved those failures and other surfaces show 0 unresolved failures.

## Desired Outcome
Resume output uses the same unresolved-versus-historical verification wording as status/report/replay/handoff so ready sessions do not look blocked by resolved failures.

## Constraints
- Do not change captured verification evidence.
- Do not add export modes, CI, PR comments, hosted features, version changes, or release work.
- Keep the change scoped to resume wording and shared helpers if needed.

## Non-Goals
- Do not redesign the resume artifact.
- Do not change failed-run resolution semantics.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/resume.ts
- tests/commands/evidence-output.test.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- A resume artifact with only resolved historical failures shows 0 unresolved and historical/resolved failure context.
- A resume artifact with an unresolved failed verification still makes that failure visible.
- Raw verification runs and excerpts remain preserved.

## Verification Commands
- npm test -- tests/commands/evidence-output.test.ts tests/core/verification.test.ts
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
Revert resume wording changes and related tests.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
