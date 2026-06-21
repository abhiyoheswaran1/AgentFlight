# Explain start yes generated files

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
agentflight start --yes safely initializes AgentFlight but does not explain the generated .agentflight/config.json and .agentflight/.gitignore files, so first-run users miss the workspace-hygiene guidance shown by init.

## Desired Outcome
start --yes prints a concise initialized-files note that keeps project config visible and runtime evidence local, without changing init behavior or adding new configuration features.

## Constraints
- Local-first only; no release, version bump, push, tag, publish, dependency changes, cloud, login, billing, hosted features, JSON/CI, PR comments, or verification profiles.

## Non-Goals
- Do not change generated config contents.
- Do not add built-in ignores, hidden workspace hygiene behavior, flags, JSON output, or release scope.
- Do not change `agentflight init` output beyond keeping its existing guidance consistent.

## Assumptions
- Users who choose `start --yes` may not have seen `agentflight init` output.
- A short generated-files note is enough; this should not become a tutorial.

## Likely Files or Areas
- `src/commands/start.ts`
- `tests/commands/workflow.test.ts`
- `CHANGELOG.md`
- `AGENTFLIGHT_DEVLOG.md`

## Files or Areas Not to Touch
- Package version, lockfile, dependencies, release automation, hosted/cloud/auth/billing code.

## Acceptance Criteria
- start --yes output lists generated AgentFlight files when it auto-initializes.
- The output explains config is project config and runtime evidence remains local/excluded.
- start without --yes still errors when AgentFlight is missing.

## Verification Commands
- npm test -- tests/commands/workflow.test.ts
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
- The output must stay repo-relative and must not print absolute local paths.
- The guidance must not imply `.agentflight/config.json` is ignored; config stays reviewable project config.

## Rollback Notes
Revert the `start --yes` output helper, workflow test, and docs/changelog/devlog entries.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
