# Apply AgentFlight repo ProjScan memory filter

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
AgentFlight doctor now correctly warns that local ProjScan memory exists and remains reviewable in this repo. The AgentFlight repo treats that memory as generated local evidence, so the project config should opt into filtering it.

## Desired Outcome
AgentFlight repo config ignores .projscan-memory/** through changedFileFilters.ignore, while the product still keeps the path suggestion-only and not built in.

## Constraints
- Do not change built-in filters or product runtime behavior.
- Do not hide AgentFlight project config or task contracts.
- Do not release, version bump, push, tag, or publish.

## Non-Goals
- Product behavior changes.
- Built-in ignore changes.
- Release, version bump, push, tag, or publish.

## Assumptions
- In this repo, `.projscan-memory/memory.json` is generated local ProjScan
  evidence and does not need review.
- Project-level filtering is the intended opt-in path for that decision.

## Likely Files or Areas
- `.agentflight/config.json`
- `AGENTFLIGHT_DEVLOG.md`
- `docs/superpowers/plans/2026-06-21-agentflight-repo-projscan-memory-filter.md`

## Files or Areas Not to Touch
- `src/core/changed-files.ts`
- `src/core/review-intelligence.ts`
- product command/runtime code
- release, publishing, and CI workflow files

## Acceptance Criteria
- agentflight doctor no longer warns about generated ProjScan memory in this repo.
- .projscan-memory/** is present only in project config, not built-in ignores.

## Verification Commands
- node dist/cli.js doctor
- npm run format:check
- npm run verify

## Post-Verification Gates
- Run AgentLoopKit verification and gates before archiving.

## Implementation Plan
- Capture the current doctor warning.
- Add `.projscan-memory/**` to `.agentflight/config.json`
  `changedFileFilters.ignore`.
- Verify doctor reports generated tool state as OK.
- Confirm built-in ignore code remains unchanged.

## Risk Notes
- Re-check protected areas before changing migrations, auth, secrets, billing, deployment, or public APIs.

## Rollback Notes
Remove `.projscan-memory/**` from `.agentflight/config.json`.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
