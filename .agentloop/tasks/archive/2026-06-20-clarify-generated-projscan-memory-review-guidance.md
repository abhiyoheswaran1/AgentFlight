# Clarify generated ProjScan memory review guidance

- Created date: 2026-06-20
- Task type: feature
- Status: done

## Problem Statement
First-run dogfood shows .projscan-memory/memory.json remains visible as intended, but review focus can still describe it like an arbitrary unknown file. That makes first-run workspace hygiene feel noisier than necessary.

## Desired Outcome
Known ProjScan memory remains visible and suggestion-only, but Review Intelligence labels it as generated tool state with a low-priority review focus and no required proof.

## Constraints
- Do not hardcode .projscan-memory/** as a built-in ignored path.
- Do not add a broad workspace hygiene system.
- Keep the change focused on Review Intelligence wording/ranking behavior and tests.

## Non-Goals
- Do not modify ProjScan or AgentLoopKit.
- Do not release, version bump, push, tag, or publish.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/core/review-intelligence.ts
- tests/core/review-intelligence.test.ts
- tests/commands/evidence-output.test.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- .projscan-memory/memory.json remains present in status/report/replay/resume/handoff unless the user configures changedFileFilters.ignore.
- Review focus explains .projscan-memory/memory.json as generated tool state instead of arbitrary unknown code.
- Readiness remains ready when the only gap is the informational .projscan-memory/** suggestion.
- Tests cover the first-run guidance behavior.

## Verification Commands
- npm test -- tests/core/review-intelligence.test.ts tests/commands/evidence-output.test.ts
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
- Over-classifying generated files could hide review targets, so this must remain display guidance only.

## Rollback Notes
Revert the Review Intelligence and test changes plus the changelog note.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
