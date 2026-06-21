# Add replay review path guidance

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
Long replay artifacts have section navigation, but reviewers still need to infer the fastest path through readiness, proof gaps, failed runs, review focus, and verification evidence.

## Desired Outcome
HTML replay shows a compact local-only review path near the top that links to the right existing sections or failed run anchors without changing persisted evidence or adding export/posting behavior.

## Constraints
- Keep replay self-contained, local-only, and deterministic.
- Do not add new export modes, PR comments, JSON/CI, cloud, login, hosted surfaces, or session switching.
- Do not change evidence capture or raw stdout/stderr artifacts.
- Keep copy concise and useful in print/PDF.

## Non-Goals
- Do not redesign the whole replay UI.
- Do not change report, handoff, history, or resume behavior unless tests reveal a direct consistency bug.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/renderers/html-replay.ts
- tests/renderers/html-replay.test.ts
- README.md
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Replay includes a Review Path section near the top when Review Intelligence is present.
- Blocked replay paths lead with proof gaps and unresolved failed-run anchors.
- Ready replay paths lead with review focus and verification evidence, not historical failures.
- Review Path links use existing escaped section/run anchors and do not introduce scripts or external URLs.
- Focused renderer tests and full verification pass.

## Verification Commands
- npm test -- tests/renderers/html-replay.test.ts
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
Revert html replay renderer changes, tests, docs, plan, and AgentLoop evidence for this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
