# Surface resume artifacts in history output

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
AgentFlight resume prompts are only written to .agentflight/current/resume-prompt.md, so prior sessions lose their continuation prompt even though resume is part of the local handoff packet.

## Desired Outcome
Resume writes a stable session-specific artifact, handoff points to it, and history lists it alongside handoff/report/replay paths.

## Constraints
- Do not add session switching, search, export, sync, JSON, PR comments, hosted features, version changes, or release work.
- Keep artifact paths repo-relative and local-only.
- Preserve .agentflight/current/resume-prompt.md compatibility.

## Non-Goals
- Do not redesign resume prompt contents.
- Do not generate missing resume artifacts from history.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/resume.ts
- src/commands/handoff.ts
- src/commands/history.ts
- tests/commands/evidence-output.test.ts
- tests/commands/history.test.ts
- README.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- runResumeCommand writes both current resume prompt and .agentflight/reports/<session-id>-resume.md.
- handoff output points to the stable resume artifact and preserves the current pointer.
- history shows Resume: <repo-relative path> when present and Resume: missing when absent.

## Verification Commands
- npm test -- tests/commands/evidence-output.test.ts tests/commands/history.test.ts
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
Revert resume artifact path display, tests, and docs.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
