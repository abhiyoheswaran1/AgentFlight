# Dogfood next first-run workspace hygiene friction

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
First-run workspace hygiene remains the top documented product friction, but recent patches may have reduced it. Verify the current behavior in a clean temporary app before implementing any further change.

## Desired Outcome
Identify and implement the smallest evidence-based workspace-hygiene improvement, or document that no patch is needed. Dogfood showed `.projscan-memory/memory.json` no longer dominates review focus, but `.agentflight/.gitignore` still outranks a real README change in a first-run app.

## Constraints
- Keep this evidence-based: dogfood the current behavior before changing code.
- Preserve local-first behavior; do not add upload, telemetry, PR comments, JSON/CI, or hosted features.
- Keep `.projscan-memory/**` suggestion-only; do not hardcode it as a built-in ignored path.
- Keep runtime `.agentflight/` evidence filtered and `.agentflight/config.json` visible as project config.
- Do not release, version bump, tag, push, or publish.

## Non-Goals
- No named verification profiles.
- No export modes.
- No ProjScan-enriched ranking beyond existing deterministic guidance.
- No broad workspace hygiene system.

## Assumptions
- A clean temporary app can reproduce the first-run review-focus behavior without modifying sibling repos.
- If current behavior is already acceptable, the right outcome is documentation of findings rather than extra code.

## Likely Files or Areas
- src/core/review-intelligence.ts
- tests/core/review-intelligence.test.ts
- tests/commands/evidence-output.test.ts
- AGENTFLIGHT_DEVLOG.md
- CHANGELOG.md
- docs/development/product-direction.md

## Files or Areas Not to Touch
- package.json
- package-lock.json
- .agentflight/evidence/**
- .agentflight/reports/**

## Acceptance Criteria
- Current first-run behavior is dogfooded in a clean temporary app.
- If `.projscan-memory/memory.json` still outranks real review targets, add a narrow regression and fix it without hiding the generated file.
- Keep generated `.agentflight/.gitignore` visible, but rank it below real app changes and `.agentflight/config.json`.
- If the behavior is already fixed, record the evidence and avoid unnecessary product code.
- Keep `.projscan-memory/**` as suggested guidance only, not a built-in ignore.
- Run a bug pass after any implementation.

## Verification Commands
- npm test -- tests/core/review-intelligence.test.ts tests/commands/evidence-output.test.ts
- npm run verify
- npm run format:check
- npm pack --dry-run
- npx projscan@latest doctor --format json
- npx projscan@latest preflight --mode before_commit --format json
- npx agentloopkit@latest verify

## Post-Verification Gates
- npx agentloopkit@latest check-gates

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Re-check protected areas before changing migrations, auth, secrets, billing, deployment, or public APIs.

## Rollback Notes
Revert the review-intelligence, tests, and documentation changes from this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
