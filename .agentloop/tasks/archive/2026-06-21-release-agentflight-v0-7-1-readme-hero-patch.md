# Release AgentFlight v0.7.1 README hero patch

- Created date: 2026-06-21
- Task type: release
- Status: done

## Problem Statement
The README hero GIF still shows the older start, verify, status, replay flow even though the current product flow is handoff-first with history available.

## Desired Outcome
Cut AgentFlight v0.7.1 with an accurate README hero asset/caption, reviewed README copy, passing verification, pushed main and v0.7.1 tag, release workflow completion, npm latest confirmation, and website update prompt.

## Constraints
- Keep this as a patch release; do not add product features.
- Preserve local-first positioning and avoid AI coding assistant/session wording.
- Do not manually publish to npm unless Trusted Publishing fails and manual recovery is explicitly approved.

## Non-Goals
- Do not start v0.8.0 or add new CLI behavior.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- README.md
- docs/assets/agentflight-terminal-demo.gif
- docs/marketing/agentflight-terminal-demo.tape
- docs/marketing/agentflight-terminal-demo-playback.sh
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md
- package.json
- package-lock.json

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- README hero asset and caption accurately show the current handoff-first flow.
- README is reviewed end-to-end for stale version/product-flow copy.
- node dist/cli.js --version reports 0.7.1 after build.
- npm view agentflight version reports 0.7.1 after release workflow.

## Verification Commands
- npm run verify
- npm run format:check
- npm pack --dry-run
- npm audit --audit-level=moderate
- npx projscan@latest doctor --format json
- npx projscan@latest preflight --mode before_commit --format json
- npx projscan@latest review --format json
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
Before tag publish, revert the release commit. After npm publish, cut a follow-up patch instead of moving v0.7.1.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
