# Avoid absolute repository path in doctor output

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
agentflight doctor prints the absolute local repository root, which can leak usernames or local folder structure when users paste doctor output into a handoff or issue.

## Desired Outcome
Doctor confirms the repository root was detected without rendering the absolute path in terminal output.

## Constraints
- Do not change repository-root detection or command return shape beyond rendered doctor check text.
- Do not hide actionable errors when no repository root is available.
- Do not release, version bump, push, tag, or publish.

## Non-Goals
- Changing repository-root detection.
- Adding redaction flags or output modes.
- Changing status/report/replay/handoff path behavior.
- Release, version bump, push, tag, or publish.

## Assumptions
- Doctor output is commonly pasted into local handoffs, issues, or support
  conversations.
- The useful signal is that a repository root was found, not the user's absolute
  path.

## Likely Files or Areas
- `src/core/doctor.ts`
- `tests/core/doctor.test.ts`
- `tests/commands/workflow.test.ts`
- `AGENTFLIGHT_DEVLOG.md`
- `CHANGELOG.md`
- `docs/superpowers/plans/2026-06-21-doctor-path-safe-root-output.md`

## Files or Areas Not to Touch
- repository root detection in `src/commands/doctor.ts`
- report/replay/handoff artifact paths
- release, publishing, and CI workflow files

## Acceptance Criteria
- Doctor repository-root OK check uses path-safe wording.
- Doctor output does not include the temp repo absolute path in tests.
- Missing repository root error remains actionable.

## Verification Commands
- npm test -- tests/core/doctor.test.ts tests/commands/workflow.test.ts
- npm run verify
- npm run format:check

## Post-Verification Gates
- Run AgentLoopKit verification and gates before archiving.

## Implementation Plan
- Add failing doctor tests for path-safe repository-root output.
- Change only the OK check message for repository root.
- Keep the missing-root error unchanged.
- Verify with focused tests, full checks, and built CLI doctor smoke.

## Risk Notes
- Re-check protected areas before changing migrations, auth, secrets, billing, deployment, or public APIs.

## Rollback Notes
Revert the doctor message/test/docs changes. No generated artifacts or config
changes are required.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
