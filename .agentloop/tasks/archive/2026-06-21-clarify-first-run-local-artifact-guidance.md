# Clarify first-run local artifact guidance

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
Dogfood and research notes show first-run users still need clearer local guidance when generated tool artifacts appear, especially ProjScan memory, without hiding those files by default.

## Desired Outcome
AgentFlight gives concise first-run local artifact guidance in the most relevant existing surface while keeping .projscan-memory/** suggestion-only and preserving runtime filtering behavior.

## Constraints
- Do not add a broad workspace hygiene system.
- Do not hardcode .projscan-memory/** as a built-in ignore.
- Do not add cloud, telemetry, PR comments, JSON/CI, named profiles, export modes, releases, or version bumps.

## Non-Goals
- No broad workspace hygiene system.
- No automatic mutation of `.agentflight/config.json`.
- No built-in ignore for `.projscan-memory/**`.
- No release, version bump, push, tag, or publish.

## Assumptions
- `agentflight doctor` is the right existing surface because users run it when
  they want local setup guidance.
- The existing Review Intelligence `.projscan-memory/**` suggestion remains the
  source of truth for report/status/replay/handoff review surfaces.

## Likely Files or Areas
- `src/commands/doctor.ts`
- `src/core/doctor.ts`
- `tests/core/doctor.test.ts`
- `tests/commands/workflow.test.ts`
- `CHANGELOG.md`
- `AGENTFLIGHT_DEVLOG.md`
- `docs/superpowers/plans/2026-06-21-doctor-generated-artifact-guidance.md`

## Files or Areas Not to Touch
- `.agentflight/sessions/**`
- `.agentflight/reports/**`
- `.agentflight/current/**`
- `.agentflight/evidence/**`
- `package.json`
- `package-lock.json`
- release, publishing, and CI workflow files

## Acceptance Criteria
- Generated ProjScan memory guidance remains suggestion-only and not a built-in ignore.
- The chosen CLI surface gives concise guidance that helps users decide what to review, commit, or ignore.
- Tests cover the guidance behavior and existing runtime filtering remains intact.

## Verification Commands
- npm test -- tests/commands/workflow.test.ts tests/commands/evidence-output.test.ts
- npm run verify
- npm run format:check

## Post-Verification Gates
- Run `npx agentloopkit@latest verify` after AgentFlight verification.
- Run ProjScan doctor/preflight/review and handle concrete blockers.

## Implementation Plan
- Add failing doctor tests for visible and already-filtered ProjScan memory.
- Pass local generated-artifact state from `runDoctorCommand` into
  `evaluateDoctorChecks`.
- Add one dynamic doctor check only when `.projscan-memory/memory.json` exists.
- Keep the warning suggestion-only; do not mutate config or built-in filters.
- Update changelog/devlog and verify.

## Risk Notes
- Re-check protected areas before changing migrations, auth, secrets, billing, deployment, or public APIs.

## Rollback Notes
Revert the doctor command/core/test/doc changes. No migration or config cleanup
is required because the change only reads local paths and renders guidance.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
