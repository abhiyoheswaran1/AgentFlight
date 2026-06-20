# Reduce first-run AgentFlight runtime git noise

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
agentflight init creates .gitkeep files inside runtime evidence directories, which can add first-run Git noise even though AgentFlight later filters those runtime paths from review analysis.

## Desired Outcome
agentflight init keeps .agentflight/config.json visible while adding local .agentflight/.gitignore rules for runtime directories instead of creating runtime .gitkeep files.

## Constraints
- Do not hide .agentflight/config.json.
- Do not hardcode .projscan-memory/** as a built-in ignore.
- Do not change changed-file analysis filters except tests/docs needed to describe init behavior.
- Keep the change limited to init/config behavior, docs, and tests.

## Non-Goals
- Do not build a full workspace hygiene system.
- Do not modify project root .gitignore automatically.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/core/config.ts
- src/commands/init.ts
- tests/core/config.test.ts
- tests/commands/workflow.test.ts
- docs/development/changed-file-filters.md
- README.md
- AGENTFLIGHT_DEVLOG.md
- CHANGELOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- init writes .agentflight/.gitignore with sessions, reports, evidence, and current ignored.
- init does not create runtime .gitkeep files in fresh repos.
- .agentflight/config.json remains visible project config.
- existing config files are not overwritten.

## Verification Commands
- npm test -- tests/core/config.test.ts tests/commands/workflow.test.ts tests/core/changed-files.test.ts
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
Revert init/config/docs/test changes to restore prior .gitkeep behavior.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
