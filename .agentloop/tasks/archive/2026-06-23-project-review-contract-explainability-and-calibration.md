# Project Review Contract explainability and calibration

- Created date: 2026-06-23
- Task type: feature
- Status: done

## Problem Statement
Project Review Contract exists, but the next product step is to make it feel repo-calibrated, explainable, and impossible to confuse with generic tests-passed tooling.

## Desired Outcome
Existing status, handoff, report, replay, and resume surfaces explain why each required-proof rule matched, what proof satisfied it, what remains unsafe to trust, and what reviewer action comes next.

## Constraints
- Improve existing Project Review Contract and Review Contract behavior only.
- Keep AgentFlight local-first: no source upload, no telemetry, no cloud, no hosted workflow.
- Do not release, version bump, commit, push, tag, or publish.
- Use TDD for behavior changes and run bug, security, performance, docs, and verification passes.

## Non-Goals
- PR comments, hosted dashboards, CI JSON expansion, named profiles, export modes, cloud, login, billing, database, GitHub App.
- A new top-level command or a new workflow surface unless strictly necessary.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/core/project-review-contract.ts
- src/core/review-intelligence.ts
- src/core/review-contract.ts
- src/core/output.ts
- src/commands/status.ts
- src/commands/handoff.ts
- src/renderers/markdown-report.ts
- src/renderers/html-replay.ts
- src/renderers/resume-prompt.ts
- src/types/index.ts
- tests/core/review-intelligence.test.ts
- tests/core/review-contract.test.ts
- tests/renderers/markdown-report.test.ts
- tests/renderers/html-replay.test.ts
- tests/commands/evidence-output.test.ts
- README.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Required-proof rows explain why the rule matched and which files/categories activated it.
- Required-proof rows show which proof command/kind satisfied the requirement when proof exists.
- Handoff leads with a clear decision and why, using the existing readiness and Project Review Contract state.
- Replay/report/resume/status retain consistent Project Review Contract decision details.
- Legacy sessions without verificationCommands continue to work.
- Docs and README explain the improved local trust protocol without assistant-style positioning.

## Verification Commands
- npm test -- tests/core/review-intelligence.test.ts tests/core/review-contract.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/commands/evidence-output.test.ts
- npm run verify
- npm run format:check
- npm pack --dry-run
- npm audit --audit-level=moderate
- npx projscan@latest doctor --format json
- npx projscan@latest preflight --mode before_commit --format json
- npx projscan@latest review --format json
- npx agentloopkit@latest verify

## Post-Verification Gates
- No post-verification gate recorded. Use this for commands that need a fresh AgentLoop verification report.

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Touches central review-surface rendering and Review Intelligence claims; broad tests and artifact dogfood required.

## Rollback Notes
Revert Project Review Contract explainability/calibration changes and docs updates; no persistent external state is created.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
