# Share first-run file guidance helpers

- Created date: 2026-06-21
- Task type: refactor
- Status: done

## Problem Statement
agentflight init and start --yes now both render AgentFlight generated-file guidance and path ordering with separate local helpers, creating drift risk in the first-run workspace-hygiene path.

## Desired Outcome
Init and start --yes use shared output helpers for generated AgentFlight file lists and local file guidance while preserving repo-relative output and current behavior.

## Constraints
- Local-first only; no release, version bump, push, tag, publish, dependency changes, cloud, login, billing, hosted features, JSON/CI, PR comments, or verification profiles.

## Non-Goals
- Do not change generated config contents.
- Do not add new CLI commands, flags, JSON output, CI behavior, or release scope.
- Do not change built-in ignored paths or hide `.agentflight/config.json`.

## Assumptions
- `init` and `start --yes` should tell the same first-run local-file story.
- A shared output helper is enough; no new workspace hygiene system is needed.

## Likely Files or Areas
- `src/core/output.ts`
- `src/commands/init.ts`
- `src/commands/start.ts`
- `tests/core/output.test.ts`
- `tests/commands/workflow.test.ts`
- `CHANGELOG.md`
- `AGENTFLIGHT_DEVLOG.md`

## Files or Areas Not to Touch
- Package version, lockfile, dependencies, release automation, hosted/cloud/auth/billing code.

## Acceptance Criteria
- Generated AgentFlight file ordering is covered by shared helper tests.
- init uses the shared helper for created/skipped file lists and local-file guidance.
- start --yes uses the shared helper for its initialized-files note.

## Verification Commands
- npm test -- tests/core/output.test.ts tests/commands/workflow.test.ts
- npm run verify
- npm run format:check

## Post-Verification Gates
- npx projscan@latest doctor --format json
- npx projscan@latest preflight --mode before_commit --format json
- npx agentloopkit@latest verify

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Output must remain repo-relative and must not expose absolute local paths.
- The refactor must not imply `.agentflight/config.json` is ignored.
- `start` without `--yes` must keep the existing missing-init error.

## Rollback Notes
Revert the shared output helpers, restore the local init/start formatters, and revert related tests/docs/changelog entries.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
