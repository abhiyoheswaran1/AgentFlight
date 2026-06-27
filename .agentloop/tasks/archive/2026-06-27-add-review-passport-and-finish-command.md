# Add Review Passport and finish command

- Created date: 2026-06-27
- Task type: feature
- Status: done

## Problem Statement
AgentFlight has strong review evidence, but users still need several commands to reach one canonical trust artifact and one next action at the end of a coding-agent session.

## Desired Outcome
AgentFlight writes a local Review Passport artifact and exposes agentflight finish as the golden-path end-of-session command that generates review artifacts, reconciles Baseframe context when present, and prints readiness plus next action.

## Constraints
- Keep AgentFlight local-first with no upload, login, GitHub App, telemetry, or automatic PR comments.
- Use TDD and add focused command/core tests before implementation.
- Preserve existing status, handoff, report, replay, resume, finalize, and Baseframe workflows.
- Run multiple bug passes and full release verification before publishing.

## Non-Goals
- Do not add a long-running watch mode in this release.
- Do not add cloud, team, billing, or hosted dashboard features.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/cli.ts
- src/commands/finish.ts
- src/core/review-passport.ts
- src/types/index.ts
- tests/commands/finish.test.ts
- tests/core/review-passport.test.ts
- README.md
- docs/development/product-direction.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- agentflight finish creates a Review Passport JSON and Markdown artifact for the current session.
- finish generates or refreshes report, replay, resume, handoff, and Baseframe result when context exists.
- finish output shows readiness, blocking signals, artifact paths, and exactly one next action.
- Review Passport includes task, session, changed files, verification summary, review readiness, proof gaps, review focus, artifacts, and integrity fingerprints without source contents.
- Existing commands remain compatible and existing tests pass.

## Verification Commands
- npm test -- tests/core/review-passport.test.ts tests/commands/finish.test.ts
- npm run typecheck
- npm run lint
- npm run format:check
- npm test
- npm run build
- npm pack --dry-run
- npm audit

## Post-Verification Gates
- npx --no-install projscan --offline doctor
- npx --no-install projscan --offline preflight --mode before_commit
- agentloop verify
- agentloop check-gates

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Re-check protected areas before changing migrations, auth, secrets, billing, deployment, or public APIs.

## Rollback Notes
Revert the feature and release commits; no persisted external state is created.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
