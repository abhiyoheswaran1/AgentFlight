# Dogfooding

AgentFlight dogfoods Baseframe Labs tooling from day one.

## ProjScan

Version used during setup: `4.3.1`.

Commands discovered and used:

```bash
npx projscan@latest --help
npx projscan@latest --version
npx projscan@latest init
npx projscan@latest start --intent "Build AgentFlight, a local-first flight recorder for AI coding agents"
npx projscan@latest coordinate --format json
npx projscan@latest preflight --mode before_edit --format json
npx projscan@latest privacy-check --offline
npx projscan@latest doctor
npx projscan@latest start --mode before_commit --intent "Review AgentFlight MVP core commands after package and build setup"
```

Evidence:

- `projscan init` created `.projscanrc.json`.
- Initial health was `68/100`, reflecting the fresh repository state.
- Pre-edit preflight verdict was `proceed`.
- Offline privacy check confirmed telemetry disabled for the run.
- Post-core health improved to `94/100` before README completion.

## AgentLoopKit

Version used during setup: `0.28.7`.

Commands discovered and used:

```bash
npx agentloopkit@latest --help
npx agentloopkit@latest --version
npx agentloopkit@latest init
npx agentloopkit@latest doctor
npx agentloopkit@latest create-task --title "Build AgentFlight MVP" --type feature ...
npx agentloopkit@latest task status .agentloop/tasks/2026-06-13-build-agentflight-mvp.md in-progress
npx agentloopkit@latest status
```

Evidence:

- AgentLoopKit initialized `.agentloop/`, `AGENTS.md`, `AGENTLOOP.md`, and `agentloop.config.json`.
- Active task: `.agentloop/tasks/2026-06-13-build-agentflight-mvp.md`.
- The task is marked `in-progress`.
- `agentloop.config.json` now maps test, lint, typecheck, build, and format checks to npm scripts.

## AgentFlight Self-Dogfooding

The AgentFlight self-dogfood run was performed after `npm run build` produced `dist/cli.js`.

Commands run:

```bash
npm run build
node dist/cli.js init
node dist/cli.js start --task "Dogfood AgentFlight MVP"
node dist/cli.js status
node dist/cli.js report
node dist/cli.js replay
node dist/cli.js resume
node dist/cli.js doctor
```

Evidence:

- `node dist/cli.js init` initialized `.agentflight/` and detected ProjScan and AgentLoopKit.
- `node dist/cli.js start --task "Dogfood AgentFlight MVP"` created session `af-20260613-123923-dogfood-agentflight-mvp`.
- `status` reported `114` changed files and `high` risk because package/dependency and config files changed.
- `status` was honest that verification evidence was not recorded in the AgentFlight session.
- `report` wrote `.agentflight/reports/af-20260613-123923-dogfood-agentflight-mvp-proof.md`.
- `replay` wrote `.agentflight/reports/af-20260613-123923-dogfood-agentflight-mvp-replay.html`.
- `resume` wrote `.agentflight/current/resume-prompt.md`.
- `doctor` reported overall `OK`.

Self-dogfooding fixes made:

- Fixed ESM CLI entrypoint detection for repository paths with spaces.
- Fixed git porcelain parsing so untracked filenames are not truncated.
- Tuned risk categorisation so Markdown policy docs are not flagged as secret material solely because their filenames mention secrets.

## Final Tooling Evidence

Final commands:

```bash
npm run verify
npm run format:check
npx projscan@latest doctor
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest doctor
npx agentloopkit@latest verify --task .agentloop/tasks/2026-06-13-build-agentflight-mvp.md
```

Final results:

- npm verification passed with `14` test files and `36` tests.
- Formatting check passed.
- ProjScan reported health `100/100`.
- ProjScan preflight returned verdict `proceed`.
- AgentLoopKit verification passed and wrote a local report.
- AgentLoopKit doctor remained `warn` because the worktree is intentionally dirty during MVP construction and generated runtime artifacts exist locally.

## v0.2.0 In-Progress Dogfooding

The v0.2.0 work uses AgentLoopKit task discipline and ProjScan checkpoints before final release preparation.

Commands run so far:

```bash
npx agentloopkit@latest create-task --title "Prepare AgentFlight v0.2.0 verification evidence" --type feature ...
npx projscan@latest start --mode before_edit --intent "Prepare AgentFlight v0.2.0 verification evidence capture"
npm test -- tests/core/session.test.ts tests/core/verification.test.ts tests/commands/verify.test.ts
npm test -- tests/commands/evidence-output.test.ts
npm test -- tests/core/fs-safe.test.ts
npm run typecheck
```

Evidence so far:

- AgentLoopKit created `.agentloop/tasks/2026-06-13-prepare-agentflight-v0-2-0-verification-evidence.md`.
- ProjScan reported health `100/100` before the implementation pass.
- Red tests captured the missing verification evidence model, missing `verify` command, evidence-blind outputs, and doctor writable-check bug.
- Targeted implementation tests now pass for verification capture and evidence-aware outputs.

Built CLI self-dogfood commands:

```bash
npm run build
node dist/cli.js start --task "Dogfood AgentFlight v0.2.0 verification evidence"
node dist/cli.js verify -- npm run typecheck
node dist/cli.js verify -- npm run lint
node dist/cli.js verify -- npm test
node dist/cli.js verify -- npm run build
node dist/cli.js status
node dist/cli.js report
node dist/cli.js replay
node dist/cli.js resume
node dist/cli.js doctor
```

Built CLI evidence:

- Session: `af-20260613-132334-dogfood-agentflight-v0-2-0-verification-evidence`.
- Verification evidence captured: `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
- `npm test` passed with `16` test files and `49` tests.
- `status` reported `4 passed, 0 failed`, no configured verification gaps, and `Ready for review`.
- `report` and `replay` were generated under `.agentflight/reports/`.
- `resume` included no configured verification gaps and the scoped-work guardrails.
- `doctor` reported overall `OK`.
- No v0.2.0 release, tag, or npm publish was performed.

Post-implementation tool checks:

```bash
npx projscan@latest preflight --mode before_commit --format json
npx projscan@latest start --mode hardening --intent "Review AgentFlight v0.2.0 verification evidence implementation"
npx agentloopkit@latest status
npx agentloopkit@latest verify
```

Tool evidence:

- ProjScan preflight returned `proceed` with health `100/100`.
- ProjScan hardening returned health `100/100` with attention requested for the dirty worktree and hotspot review suggestions.
- AgentLoopKit status found all configured commands and requested verification.
- AgentLoopKit verification passed and wrote `.agentloop/reports/2026-06-13-15-25-verification-report.md`.
