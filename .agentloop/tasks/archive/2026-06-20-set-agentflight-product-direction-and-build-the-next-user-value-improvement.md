# Set AgentFlight product direction and build the next user-value improvement

- Created date: 2026-06-20
- Task type: feature
- Status: done

## Problem Statement
AgentFlight needs a clear product direction after v0.6.0 and should keep improving the local review handoff loop by removing real dogfood friction.

The first concrete friction is first-run workspace hygiene: `.projscan-memory/memory.json` stays visible, as intended, but can outrank real review targets in Review Intelligence because it is classified as an unknown file.

## Desired Outcome
Document the near-term product direction and make generated ProjScan memory less noisy in review priority without hiding it or making `.projscan-memory/**` a built-in ignore.

## Constraints
- Keep changes scoped and do not claim completion without proof.
- Use AgentFlight, AgentLoopKit, and ProjScan during development.
- Keep `.projscan-memory/**` suggestion-only.
- Do not version bump, tag, publish, or release.

## Non-Goals
- Cloud, login, billing, hosted review, GitHub App, or PR comment posting.
- Hardcoding `.projscan-memory/**` as a built-in ignored path.
- Broad workspace hygiene system.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- docs/development/product-direction.md
- src/core/review-intelligence.ts
- tests/core/review-intelligence.test.ts

## Files or Areas Not to Touch
- package version fields
- release tags or publishing config

## Acceptance Criteria
- Product direction is documented with prioritized work areas.
- `.projscan-memory/memory.json` remains visible when not ignored.
- `.projscan-memory/**` remains suggestion-only guidance.
- Generated ProjScan memory does not outrank normal docs or `.agentflight/config.json` review targets.
- Focused tests cover the ranking behavior.
- A bug pass runs after implementation.

## Verification Commands
- npm test -- tests/core/review-intelligence.test.ts
- npm run verify
- npm run format:check
- npx projscan@latest doctor --format json
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
Revert the product-direction doc and the review-intelligence scoring adjustment.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
