# Show concise tool warnings during start

- Created date: 2026-06-20
- Task type: bugfix
- Status: done

## Problem Statement
AgentFlight start stores ProjScan and AgentLoopKit warnings but the terminal output only says available or unavailable, so users do not see when optional startup work was skipped or degraded.

## Desired Outcome
Start output should show concise, bounded tool warning text when tools are available with warnings, without dumping long diagnostics.

## Constraints
- No new product features beyond clearer start diagnostics.
- No release, version bump, tag, publish, or push.
- Keep output concise and local-only.

## Non-Goals
- Do not add a verbose mode or new CLI flags.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/start.ts
- src/core/output.ts
- tests/commands/workflow.test.ts
- CHANGELOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Start output includes version/warning-aware tool status for ProjScan and AgentLoopKit.
- Long ProjScan baseline warnings are summarized instead of dumped.
- Existing init output using boolean detections stays unchanged.

## Verification Commands
- npm test -- tests/commands/workflow.test.ts tests/renderers/markdown-report.test.ts
- npm run verify
- npm run format:check
- npx projscan@latest review --format json
- npx projscan@latest preflight --mode before_commit --format json
- npx agentloopkit@latest verify

## Post-Verification Gates
- No post-verification gate recorded. Use this for commands that need a fresh AgentLoop verification report.

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Re-check protected areas before changing migrations, auth, secrets, billing, deployment, or public APIs.

## Rollback Notes
Revert start output, shared output helper, tests, changelog, and task evidence for this loop.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
