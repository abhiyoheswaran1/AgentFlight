# Add proof freshness attribution

- Created date: 2026-06-24
- Task type: feature
- Status: done

## Problem Statement
AgentFlight currently reports stale proof without explaining which post-verification files caused staleness, making docs/evidence-only changes look as concerning as source changes.

## Desired Outcome
Status, handoff, report, replay, and resume explain proof freshness by changed-file category so reviewers know what invalidated proof and whether rerunning verification or manual review is the next step.

## Constraints
- Keep this as a focused pre-release addition.
- Do not add hosted, PR comment, CI JSON, named profile, export, cloud, login, billing, or GitHub App surfaces.
- Keep the implementation local-first and source-free.
- Do not commit, push, tag, publish, or release.

## Non-Goals
- Do not change package version.
- Do not enforce policy or block docs-only changes differently unless existing readiness rules already do.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/core/proof-snapshot.ts
- src/core/review-intelligence.ts
- src/core/output.ts
- src/commands/status.ts
- src/commands/handoff.ts
- src/renderers/markdown-report.ts
- src/renderers/html-replay.ts
- src/renderers/resume-prompt.ts
- src/types/index.ts
- tests/core/review-intelligence.test.ts
- tests/commands/evidence-output.test.ts
- tests/renderers/markdown-report.test.ts
- tests/renderers/html-replay.test.ts
- tests/renderers/resume-prompt.test.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Stale proof output names the categories/files that changed after proof was captured.
- Docs/evidence-only post-verification changes produce manual-review-oriented freshness guidance, not generic rerun-only language.
- Source/test post-verification changes still recommend rerunning the matching proof command.
- Status JSON carries the attribution so handoff can render it consistently.
- HTML replay escapes attribution details safely.
- README and project review contract docs describe proof freshness attribution.

## Verification Commands
- npm test -- tests/core/review-intelligence.test.ts tests/commands/evidence-output.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts
- npm run verify
- npm run format:check
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
- Proof freshness is central review logic; regressions could understate stale source proof.
- Renderer changes must keep HTML escaped and terminal output compact.

## Rollback Notes
Revert proof freshness attribution code, tests, and docs; existing stale proof behavior should remain intact.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
