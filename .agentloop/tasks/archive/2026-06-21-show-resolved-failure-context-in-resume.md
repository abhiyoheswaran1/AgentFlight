# Show resolved failure context in resume

- Created date: 2026-06-21
- Task type: feature
- Status: done

## Problem Statement
Resume prompts show resolved failed-run counts but omit the historical-failure context that status and reports show, making clean or ready prompts look less trustworthy.

## Desired Outcome
Resume prompts include concise unresolved/resolved failure context below the verification count when failed runs exist.

## Constraints
- Keep output local-only and text-only.
- Do not change evidence capture, replay, report, release, or JSON/CI behavior.

## Non-Goals
- No new verification model, no export mode, no PR comments, no dependency changes.

## Assumptions
- The existing formatVerificationFailureContext helper should be reused.

## Likely Files or Areas
- src/commands/resume.ts
- src/renderers/resume-prompt.ts
- tests/commands/evidence-output.test.ts
- AGENTFLIGHT_DEVLOG.md
- CHANGELOG.md

## Files or Areas Not to Touch
- package.json
- package-lock.json
- .agentflight/evidence/**

## Acceptance Criteria
- Resume output includes historical failed runs context when failures are resolved.
- Resume output includes unresolved failed runs context when failures remain unresolved.
- Resume output keeps verification count wording stable.

## Verification Commands
- npm test -- tests/commands/evidence-output.test.ts
- npm run verify
- npm run format:check

## Post-Verification Gates
- npx agentloopkit@latest verify

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Re-check protected areas before changing migrations, auth, secrets, billing, deployment, or public APIs.

## Rollback Notes
Revert resume verification-context output, tests, and documentation notes.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
