# Speed up first-run tool inspection

- Created date: 2026-06-21
- Task type: bugfix
- Status: done

## Problem Statement
AgentFlight init/start perform extra ProjScan help probing even though first-run output only needs availability and version, adding avoidable latency before users see the handoff workflow.

## Desired Outcome
Init and start use concise ProjScan availability checks while doctor keeps deeper setup diagnostics; tests prove help probing can be skipped without changing availability output.

## Constraints
- Local-first only; no release, version bump, push, tag, publish, dependency changes, cloud, login, billing, hosted features, JSON/CI, PR comments, or verification profiles.

## Non-Goals
- Do not change tool installation behavior.
- Do not add new CLI commands, flags, JSON output, CI behavior, or release scope.
- Do not change `agentflight doctor` diagnostics beyond preserving the existing deeper ProjScan check.

## Assumptions
- `agentflight init` and `agentflight start` only need concise ProjScan availability and version output.
- `agentflight doctor` remains the right place for deeper setup diagnostics.

## Likely Files or Areas
- `src/adapters/projscan.ts`
- `src/commands/init.ts`
- `src/commands/start.ts`
- `tests/adapters/projscan.test.ts`
- `tests/commands/workflow.test.ts`
- `CHANGELOG.md`
- `AGENTFLIGHT_DEVLOG.md`

## Files or Areas Not to Touch
- Package version, lockfile, release automation, dependencies, hosted/cloud/auth/billing code.

## Acceptance Criteria
- ProjScan inspector can skip --help when callers only need concise availability.
- agentflight init and start use the concise ProjScan inspection path.
- agentflight doctor keeps the deeper ProjScan diagnostics path.

## Verification Commands
- npm test -- tests/adapters/projscan.test.ts tests/commands/workflow.test.ts
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
- ProjScan availability warnings must still surface in `doctor`; first-run commands should skip only the extra help probe.
- No dependency, security, public API, auth, billing, database, or deployment behavior should change.

## Rollback Notes
Revert the ProjScan adapter option, the `init`/`start` call-site changes, related tests, and docs/changelog entries.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
