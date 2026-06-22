# Build actionable Review Contract review path

- Created date: 2026-06-22
- Task type: feature
- Status: done

## Problem Statement
Review Contract claims exist, but reviewers still need stronger claim-to-proof traceability and a clearer primary review path across handoff, report, replay, status, and resume.

## Desired Outcome
AgentFlight surfaces an actionable, traceable Review Contract review path across existing local artifacts without adding cloud, PR comments, CI JSON, export modes, named profiles, or new commands.

## Constraints
- Keep AgentFlight local-first and source-free.
- Do not add cloud, telemetry, login, billing, hosted features, GitHub App, PR comments, export modes, named verification profiles, or v0.6/v0.9 release work.
- Use TDD for behavior changes and keep raw verification stdout/stderr evidence intact.

## Non-Goals
- No release, version bump, tag, push, publish, or manual npm publish in this task.
- No new top-level CLI command unless existing surfaces cannot support the workflow.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/core/review-contract.ts
- src/core/review-intelligence.ts
- src/core/output.ts
- src/types/index.ts
- src/commands/status.ts
- src/commands/handoff.ts
- src/renderers/markdown-report.ts
- src/renderers/html-replay.ts
- src/renderers/resume-prompt.ts
- tests/core/review-contract.test.ts
- tests/core/review-intelligence.test.ts
- tests/renderers/markdown-report.test.ts
- tests/renderers/html-replay.test.ts
- tests/renderers/resume-prompt.test.ts
- tests/commands/evidence-output.test.ts
- README.md
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Review Contract leads with an actionable review path and next action in existing review surfaces.
- Claims include structured proof references that explain why a claim exists without capturing source text.
- Replay lets reviewers jump from Review Contract claims to related proof, file focus, proof gaps, or verification evidence.
- Handoff, report, replay, status, and resume agree on claim status and readiness.
- First-run workspace hygiene guidance remains suggestion-only for .projscan-memory/**.
- Docs, README, and devlog explain the new user-facing behavior.
- Focused tests, full verification, ProjScan, AgentLoopKit, and AgentFlight dogfood pass or documented blockers are fixed.

## Verification Commands
- npm test -- tests/core/review-contract.test.ts tests/core/review-intelligence.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts tests/commands/evidence-output.test.ts
- npm run verify
- npm run format:check
- npm pack --dry-run
- npm audit --audit-level=moderate
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
- Renderer changes can drift if each surface formats claims separately.
- Traceability must not capture source text or leak secrets from evidence files.
- Replay anchors must remain safe and stable for arbitrary paths and claim text.

## Rollback Notes
Revert the Review Contract traceability/rendering changes and docs updates; generated .agentflight and .agentloop evidence can be removed after handoff if needed.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
