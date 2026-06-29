# AgentFlight Guard Pre-Release Readiness

Date: 2026-06-28

Scope: `agentflight guard`, Guard summary API, docs, tests, and pre-release
evidence. No version bump, tag, push, npm publish, GitHub release, or release
automation was run.

Follow-up: the v0.16.0 release pass began on 2026-06-29. Use
`docs/development/v0.16.0-release-audit.md` for release evidence.

## What Changed

- Added `agentflight guard` with watch mode, one-shot mode, text output, JSON
  output, exit codes, and CLI help.
- Added Guard summary types and `createAgentFlightGuardSummary` package export.
- Reused `agentflight status` JSON as the evidence source, so Guard reads local
  trust state and does not run verification commands.
- Added source-free signals for proof gaps, Baseframe scope drift, Baseframe
  gate status, stale review receipts, and ready states.
- Added finish targets for Review Passport JSON, Review Passport Markdown, and
  Baseframe result artifacts.
- Documented Guard behavior, privacy boundary, and website update guidance.
- Stabilized load-sensitive Baseframe fixture tests by increasing local git
  helper timeouts in Guard and Finish tests.

## Five Quality Loops

1. Targeted Guard behavior
   - `npx vitest run tests/core/guard.test.ts tests/commands/guard.test.ts tests/commands/workflow.test.ts`
   - `npm run typecheck`
   - Result: pass.

2. Baseframe and session compatibility
   - `npx vitest run tests/commands/baseframe.test.ts tests/commands/finish.test.ts tests/commands/history.test.ts tests/core/baseframe.test.ts tests/core/session.test.ts`
   - Result: pass, 5 files, 43 tests.

3. Docs and DX
   - Stop-slop review of `README.md`, `docs/development/guard.md`, and
     `docs/marketing/agentflight-guard-website-update-prompt.md`.
   - `npm run format:check`
   - `npx vitest run tests/public-positioning.test.ts tests/cli-entrypoint.test.ts tests/commands/guard.test.ts`
   - Result: pass.

4. Security, privacy, and path handling
   - Checked Guard source for direct file writes, shell execution, env access,
     network calls, telemetry, uploads, and PR posting.
   - `npm run lint`
   - Temp-repo smoke:
     `agentflight guard --once`
   - Result: pass. Smoke output used relative artifact paths only.

5. Full pre-release verification
   - `npm run verify`
   - `npm run format:check`
   - `npm pack --dry-run`
   - `npm audit`
   - `npx projscan --offline doctor`
   - `npx projscan --offline preflight --mode before_commit`
   - `npx projscan --offline review --format json`
   - `npx agentloop verify`
   - `npx agentloop handoff`
   - `npx agentloop check-gates`

## Verification Results

- `npm run verify`: pass. Typecheck, lint, 34 test files, 372 tests, and build
  completed.
- `npm run format:check`: pass.
- `npm pack --dry-run`: pass. Package dry run includes `dist/commands/guard.*`,
  `dist/core/guard.*`, and `docs/development/guard.md`. Package version remains
  `0.15.0`.
- `npm audit`: pass, 0 vulnerabilities.
- `npx projscan --offline doctor`: pass, A 100/100.
- `npx projscan --offline preflight --mode before_commit`: caution. ProjScan
  recommends manual release sign-off for scale/complexity. Health,
  supply-chain, and changed-file checks passed.
- `npx projscan --offline review --format json`: block for scale/complexity
  only. It reported no new cycles, risky functions, dependency changes, taint
  flows, or dataflow risks.
- `npx agentloop verify`: pass, latest report
  `.agentloop/reports/2026-06-28-14-17-verification-report.md`.
- `npx agentloop check-gates`: warn. Task contract, verification report,
  handoff summary, harness, policies, git context, and git target pass. The only
  warning is unrelated legacy task-folder hygiene in three older proposed tasks.

## Known Risks

- Guard adds public CLI behavior and exported package types. Reviewers should
  check text/JSON output shape before the next automated release.
- Watch mode polls status and clears the terminal by default. Reviewers should
  check terminal behavior on common shells before release.
- ProjScan requires manual sign-off for the size and risk score of the changed
  files before release.
- AgentLoopKit task doctor still reports three unrelated legacy placeholder
  tasks. This task did not edit or archive them.

## Release Status

Release deferred. Do not publish from this state until a later automated release
loop performs the version bump, changelog generation, tag, GitHub Release, npm
publish, and post-release public-channel checks.
