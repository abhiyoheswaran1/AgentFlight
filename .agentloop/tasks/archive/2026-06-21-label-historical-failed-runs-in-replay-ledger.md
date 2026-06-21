# Label historical failed runs in replay ledger

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
HTML replay correctly removes urgent navigation for resolved historical failures, but resolved failed ledger rows still look like current FAIL rows even when the summary says zero unresolved failures remain.

## Desired Outcome
HTML replay labels failed verification rows as historical when all failures are resolved, while unresolved failed runs keep the current urgent FAIL treatment.

## Constraints
- Do not change verification storage, raw stdout/stderr evidence, report output, status output, handoff output, or readiness logic.
- Do not attempt per-run resolution when unresolved and resolved failures are mixed.
- Do not release, version bump, push, tag, or publish.

## Non-Goals
- Per-run resolution logic for mixed unresolved/resolved failures.
- Changes to verification storage, raw evidence files, report, status, handoff,
  or readiness logic.
- Replay redesign, export modes, PR comments, release, version bump, push, tag,
  or publish.

## Assumptions
- When `verificationSummary.unresolvedFailed` is `0`, every failed row in the
  replay ledger is historical.
- When unresolved failures exist, the replay should keep the current `FAIL`
  treatment because AgentFlight cannot yet mark individual failed rows as
  resolved or unresolved.

## Likely Files or Areas
- `src/renderers/html-replay.ts`
- `tests/renderers/html-replay.test.ts`
- `AGENTFLIGHT_DEVLOG.md`
- `CHANGELOG.md`
- `docs/superpowers/plans/2026-06-21-replay-historical-failed-ledger-label.md`

## Files or Areas Not to Touch
- `src/core/verification.ts`
- `src/core/review-intelligence.ts`
- report/status/handoff command output
- release, publishing, and CI workflow files

## Acceptance Criteria
- Resolved historical failed rows have a distinct historical label/style in replay.
- Unresolved failed replay rows still render as FAIL and keep urgent navigation.
- Existing excerpt escaping remains safe.

## Verification Commands
- npm test -- tests/renderers/html-replay.test.ts tests/commands/evidence-output.test.ts
- npm run verify
- npm run format:check

## Post-Verification Gates
- Run AgentLoopKit verification and gates before archiving.

## Implementation Plan
- Add failing replay renderer tests for historical failed row labeling.
- Add a display-only helper for historical failed rows when all failures are
  resolved.
- Preserve unresolved failed row output and urgent navigation.
- Verify with focused tests, full checks, and built replay smoke.

## Risk Notes
- Re-check protected areas before changing migrations, auth, secrets, billing, deployment, or public APIs.

## Rollback Notes
Revert the replay renderer, tests, changelog, devlog, and plan changes. No
session data or evidence files require cleanup because this is display-only.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
