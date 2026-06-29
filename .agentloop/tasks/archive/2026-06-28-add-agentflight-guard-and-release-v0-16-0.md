# Add AgentFlight Guard and five pre-release quality loops

- Created date: 2026-06-28
- Task type: feature
- Status: done

## Problem Statement
AgentFlight has strong end-of-session evidence, but users only learn about drift, stale proof, or missing gates after they ask for status or finish. The product needs a live local trust monitor that makes AgentFlight feel like the control tower for AI coding agent work.

## Desired Outcome
AgentFlight ships a local-first guard command that repeatedly evaluates trust state, scope drift, proof freshness, failed/missing verification, Baseframe gates, and one next action without uploading source or running hidden commands. The work must complete five product/bug-pass loops and remain release-ready, but must not be released in this task.

## Constraints
- Keep AgentFlight independent and local-first: no cloud, telemetry, login, GitHub App, or source upload.
- Use deterministic source-free evidence: paths, counts, statuses, commands, hashes, and artifact paths only.
- Use TDD for new behavior before production code changes.
- Preserve existing AgentFlight workflows.
- Do not release, tag, publish, or push a release from this task.
- Complete five quality loops before the next automated release.

## Non-Goals
- Do not implement hosted dashboards, PR comments, accounts, billing, or team features.
- Do not add new runtime dependencies unless absolutely required.
- Do not bump package version, create a Git tag, publish to npm, or create a GitHub release.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/cli.ts
- src/commands/guard.ts
- src/core/guard.ts
- src/types/index.ts
- tests/commands/guard.test.ts
- tests/core/guard.test.ts
- README.md
- docs/development/guard.md
- docs/marketing/agentflight-guard-website-update-prompt.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- agentflight guard prints a live trust summary with readiness, changed file count, verification counts, blocking/warning signals, Review Passport/result hints, and one next action.
- guard supports a one-shot mode suitable for scripts and tests.
- guard can detect failed verification, stale verification, missing required proof, scope drift, Baseframe missing/failed gates, and stale review receipt state using existing AgentFlight evidence.
- guard stays source-free, local-only, and does not execute verification commands automatically.
- README and docs explain guard as the live trust monitor and keep finish as the final Review Passport command.
- Tests cover guard output, JSON output if implemented, Baseframe/session compatibility, and older sessions without integration context.
- Five quality loops are completed: targeted Guard behavior, Baseframe/session edge cases, docs/DX copy, security/privacy/path handling, and full verification/release-readiness audit.

## Verification Commands
- npm run verify
- npm run format:check
- npm audit
- npx --no-install projscan --offline doctor
- npx --no-install projscan --offline preflight --mode before_commit
- agentloop verify

## Post-Verification Gates
- agentloop check-gates

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- New CLI command changes public API; document behavior and exit semantics clearly.
- Watch mode can be noisy; make one-shot output deterministic and watch output calm.
- Release must be deferred; this task should leave clear release-readiness evidence without creating release artifacts.

## Rollback Notes
Revert the Guard feature commits. No npm/package rollback should be needed because this task does not publish.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
