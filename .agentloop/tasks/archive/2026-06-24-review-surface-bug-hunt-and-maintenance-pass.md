# Review surface bug hunt and maintenance pass

- Created date: 2026-06-24
- Task type: bugfix
- Status: done

## Problem Statement
Continue the AgentFlight dogfood loop by finding and fixing small review-surface correctness, security, and maintainability issues without adding product scope.

## Desired Outcome
Existing status, handoff, report, replay, resume, and JSON surfaces stay consistent, safe to render locally, and easier to maintain.

## Constraints
- Keep changes local-first, deterministic, and source-free.
- Do not add new commands, hosted features, PR comments, JSON/CI export modes, dependencies, version bumps, commits, tags, pushes, publishes, or release work.
- Use TDD for behavior changes and run a bug/security/performance pass after each implementation.

## Non-Goals
- Do not start a new major product surface.
- Do not market the product as an AI coding assistant.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/commands/status.ts
- src/commands/handoff.ts
- src/renderers/markdown-report.ts
- src/renderers/html-replay.ts
- src/renderers/resume-prompt.ts
- src/core/output.ts
- tests/commands/workflow.test.ts
- tests/commands/evidence-output.test.ts
- tests/renderers/markdown-report.test.ts
- tests/renderers/html-replay.test.ts
- tests/renderers/resume-prompt.test.ts

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- Any discovered issue is reproduced with a focused failing test before production changes.
- Changed review surfaces remain consistent across terminal, Markdown, HTML replay, resume, handoff, and status JSON where applicable.
- Markdown/HTML surfaces escape unsafe dynamic text without corrupting raw evidence files.
- Verification, ProjScan, AgentLoopKit, and AgentFlight dogfood checks are run before handoff.

## Verification Commands
- npm test -- tests/commands/workflow.test.ts tests/commands/evidence-output.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts
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
- The worktree already contains a large local change set; keep follow-up fixes narrow and documented.

## Rollback Notes
Revert the follow-up bugfix files and tests while preserving the completed role-routing work.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
