# Classify AgentFlight source files for clearer review focus

- Created date: 2026-06-20
- Task type: bugfix
- Status: done

## Problem Statement
AgentFlight dogfood handoff classifies src/core/review-intelligence.ts as unknown, producing vague review guidance for first-party TypeScript source.

## Desired Outcome
First-party TypeScript source under src/ is recognized as application source with clearer review guidance instead of unknown, while existing categories still win for auth, frontend, config, dependencies, tests, and docs.

## Constraints
- Keep the change local and deterministic.
- Do not release, tag, push, publish, or bump version.

## Non-Goals
- Adding a full language classifier.
- Changing generated-file ignore behavior.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/types/index.ts
- src/core/risk.ts
- src/core/review-intelligence.ts
- tests/core/review-intelligence.test.ts
- tests/core/risk.test.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- src/core/*.ts and src/commands/*.ts are not categorized as unknown.
- Review focus gives source-specific guidance for AgentFlight source files.
- Existing higher-specificity categories still behave as before.

## Verification Commands
- npm test -- tests/core/review-intelligence.test.ts tests/core/risk.test.ts
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
Revert the source classification changes and tests.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
