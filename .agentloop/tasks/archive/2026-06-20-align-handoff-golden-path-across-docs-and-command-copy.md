# Align handoff golden path across docs and command copy

- Created date: 2026-06-20
- Task type: docs
- Status: done

## Problem Statement
AgentFlight now treats handoff as the local end-of-session review packet, but some docs, demos, and command next-action copy still teach report or replay as the primary final step.

## Desired Outcome
Current docs, demo assets, and ready-review command copy consistently position agentflight handoff as the golden path while keeping report, replay, and resume as generated supporting artifacts.

## Constraints
- No new product features.
- No release, version bump, tag, publish, or push.
- Keep historical development notes unchanged unless they are current user-facing guidance.

## Non-Goals
- Do not add PR comments, JSON/CI behavior, named verification profiles, hosted features, or export modes.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/report.ts
- src/commands/replay.ts
- src/commands/resume.ts
- tests/commands/evidence-output.test.ts
- docs/examples/basic-agentflight-session.md
- docs/assets/agentflight-cli-demo.svg
- docs/marketing/agentflight-terminal-demo-playback.sh
- README.md
- CHANGELOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Ready-review report, replay, and resume next-action copy points users to agentflight handoff or the generated handoff packet without recursive wording.
- Current user-facing docs and demo assets no longer present agentflight report as the primary final next action.
- Report/replay/resume remain described as useful supporting artifacts.
- Tests cover the updated command copy.

## Verification Commands
- npm test -- tests/commands/evidence-output.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts
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
Revert the command-copy, docs, demo, and test edits for this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
