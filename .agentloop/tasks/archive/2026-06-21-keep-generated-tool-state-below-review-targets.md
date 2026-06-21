# Keep generated tool state below review targets

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
Dogfood showed first-run .projscan-memory/memory.json can outrank real first-run files when generated tool state receives ProjScan risk hints.

## Desired Outcome
Generated tool state remains visible with filter guidance, but it does not dominate Review Focus over project config or user changes.

## Constraints
- Do not hardcode .projscan-memory/** as a built-in ignored path.
- Do not add a workspace hygiene system or new feature surface.
- Keep changes focused on review ranking and evidence notes.

## Non-Goals
- No release, version bump, PR comments, JSON/CI, cloud, hosted features, login, billing, or Pro/Team work.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/core/review-intelligence.ts
- tests/core/review-intelligence.test.ts
- AGENTFLIGHT_DEVLOG.md
- CHANGELOG.md
- docs/superpowers/plans/2026-06-21-generated-tool-state-review-ranking.md

## Files or Areas Not to Touch
- package.json
- package-lock.json

## Acceptance Criteria
- A generated ProjScan memory file with a high ProjScan risk hint ranks below .agentflight/config.json and normal user changes.
- The generated memory file remains visible with the existing changedFileFilters.ignore suggestion.
- Normal ProjScan hints for non-generated files still affect review focus.
- .projscan-memory/** remains suggestion-only and not a built-in ignore.

## Verification Commands
- npm test -- tests/core/review-intelligence.test.ts
- npm run verify

## Post-Verification Gates
- npm run format:check
- npm pack --dry-run
- npm audit --audit-level=moderate
- npx projscan@latest doctor --format json
- npx projscan@latest preflight --mode before_commit --format json
- npx projscan@latest review --format json
- npx agentloopkit@latest verify

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Changing ranking can affect review trust; keep generated-tool-state handling narrow and covered by regression tests.

## Rollback Notes
Revert review-intelligence scoring changes, tests, changelog/devlog notes, plan, and AgentLoop evidence.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
