# AgentFlight Devlog

This log records setup, dogfooding, and verification evidence for the AgentFlight MVP.

## 2026-06-13

### Repository Baseline

- Repository started as a fresh GitHub repo on `main`.
- Initial files: `README.md`, `LICENSE`.
- Existing license file is Apache License 2.0.

### ProjScan And AgentLoopKit Discovery

Commands run:

```bash
npm view projscan version
npm view agentloopkit version
npm view projscan bin
npm view agentloopkit bin
npx projscan@latest --help
npx agentloopkit@latest --help
npx projscan@latest --version
npx agentloopkit@latest --version
```

Discovered versions:

- ProjScan: `4.3.1`
- AgentLoopKit: `0.28.7`

Discovered binaries:

- ProjScan: `projscan`
- AgentLoopKit: `agentloopkit`, `agentloop`

### Required Tool Installation

Command run:

```bash
npm install -D projscan@latest agentloopkit@latest
```

Result:

- Installed ProjScan `^4.3.1`.
- Installed AgentLoopKit `^0.28.7`.
- `npm audit` reported `0 vulnerabilities`.
- npm emitted `allow-scripts` review warnings for tree-sitter packages and esbuild. No package scripts were manually approved during this setup.

### ProjScan Initialization And Baseline

Commands run:

```bash
npx projscan@latest init
npx projscan@latest start --intent "Build AgentFlight, a local-first flight recorder for AI coding agents"
npx projscan@latest coordinate --format json
npx projscan@latest preflight --mode before_edit --format json
npx projscan@latest privacy-check --offline
```

Results:

- `projscan init` created `.projscanrc.json`.
- Initial `projscan start` reported health `68/100`, expected for a new package with missing README/config.
- `projscan coordinate --format json` reported readiness `clear` and only one worktree.
- `projscan preflight --mode before_edit --format json` returned verdict `proceed`.
- `projscan privacy-check --offline` confirmed telemetry disabled and offline mode enabled for that run.

### AgentLoopKit Initialization And Task

Commands run:

```bash
npx agentloopkit@latest init
npx agentloopkit@latest doctor
npx agentloopkit@latest create-task --title "Build AgentFlight MVP" --type feature --problem "AgentFlight needs its first local-first TypeScript npm CLI MVP." --outcome "A working agentflight CLI with init, start, status, report, replay, resume, and doctor commands, documented dogfooding with ProjScan and AgentLoopKit, and verification evidence." --constraint "Local-first only; no cloud, auth, billing, telemetry, or source upload." --constraint "Use ProjScan and AgentLoopKit as development workflow dependencies from day one." --acceptance "npm run build, test, typecheck, lint, format:check, and verify pass." --acceptance "AgentFlight dogfoods itself using init, start, status, report, replay, resume, and doctor." --verify-command "npm run verify"
npx agentloopkit@latest task status .agentloop/tasks/2026-06-13-build-agentflight-mvp.md in-progress
```

Results:

- AgentLoopKit initialized `.agentloop/`, `AGENTS.md`, `AGENTLOOP.md`, and `agentloop.config.json`.
- Initial doctor status was `warn` because lint, typecheck, build, and format scripts did not exist yet.
- Created active task: `.agentloop/tasks/2026-06-13-build-agentflight-mvp.md`.
- Task status was updated to `in-progress`.

### Package And Implementation Checkpoints

Commands run after core implementation:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npx projscan@latest doctor
npx projscan@latest start --mode before_commit --intent "Review AgentFlight MVP core commands after package and build setup"
npx agentloopkit@latest status
```

Results:

- `npm test`: `12 passed`, `31 passed`.
- `npm run typecheck`: passed after strict optional-property fixes.
- `npm run lint`: passed after replacing an empty interface with a type alias.
- `npm run build`: passed.
- `projscan doctor`: health `94/100`; remaining issue was README content, addressed in this change.
- `agentloopkit status`: active task `Build AgentFlight MVP` was `in-progress`; command config was updated after this check to include lint, typecheck, build, and format.

### Current Known Limitations

- Verification evidence is represented honestly as missing unless an actual command run is recorded.
- Runtime reports include filenames and summaries, not full source diffs.
- ProjScan and AgentLoopKit adapters are defensive and may return unavailable if local commands are missing or fail.
- Pro/Team commands are placeholders only; no billing, login, or cloud behavior exists.

### AgentFlight Self-Dogfooding

Commands run:

```bash
npm run verify
npm run build
node dist/cli.js init
node dist/cli.js start --task "Dogfood AgentFlight MVP"
node dist/cli.js status
node dist/cli.js report
node dist/cli.js replay
node dist/cli.js resume
node dist/cli.js doctor
```

Results:

- `npm run verify`: passed. It ran typecheck, lint, tests, and build.
- `node dist/cli.js init`: initialized `.agentflight/`, created `.agentflight/config.json`, and detected AgentLoopKit and ProjScan.
- `node dist/cli.js start --task "Dogfood AgentFlight MVP"` created session `af-20260613-123923-dogfood-agentflight-mvp`.
- `start` detected git branch `main`, package manager `npm`, ProjScan available, and AgentLoopKit available.
- `start` suggested proof commands: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
- `status` reported `114` changed files, risk `high`, and verification evidence not recorded.
- `report` generated `.agentflight/reports/af-20260613-123923-dogfood-agentflight-mvp-proof.md`.
- `replay` generated `.agentflight/reports/af-20260613-123923-dogfood-agentflight-mvp-replay.html`.
- `resume` generated `.agentflight/current/resume-prompt.md` and printed a continuation prompt.
- `doctor` reported overall `OK`.

Dogfooding bugs found and fixed:

- `node dist/cli.js init` initially printed nothing because the ESM entrypoint guard compared a URL-encoded `import.meta.url` with a raw path containing spaces. Fixed with `fileURLToPath` and a regression test in `tests/cli-entrypoint.test.ts`.
- Git porcelain parsing initially truncated untracked filenames such as `README.md` to `EADME.md`. Fixed by preserving porcelain status columns and adding `tests/core/git.test.ts`.
- Risk classification initially treated Markdown policy docs with `secrets` in the filename as secret material. Fixed so Markdown docs are categorized as docs unless they are actual env/credential files.

### Final Verification Checkpoint

Commands run:

```bash
npm run verify
npm run format:check
npm view agentflight version
npx projscan@latest doctor
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest doctor
npx agentloopkit@latest verify --task .agentloop/tasks/2026-06-13-build-agentflight-mvp.md
```

Results:

- `npm run verify`: passed. It ran typecheck, lint, tests, and build.
- `npm run format:check`: passed.
- `npm view agentflight version`: returned `404 Not Found`, confirming the package name was not present on the public npm registry at check time.
- `projscan doctor`: health `100/100`; no issues detected.
- `projscan preflight --mode before_commit --format json`: verdict `proceed`; required checks passed.
- `agentloopkit doctor`: status `warn` because the working tree is dirty and generated runtime risk files exist; configured test, lint, typecheck, and build commands all passed detection.
- `agentloopkit verify --task .agentloop/tasks/2026-06-13-build-agentflight-mvp.md`: overall status `pass`; generated local report `.agentloop/reports/2026-06-13-14-44-verification-report.md`.

### v0.2.0 Verification Evidence Work

Task discipline:

```bash
npx agentloopkit@latest create-task --title "Prepare AgentFlight v0.2.0 verification evidence" --type feature --problem "AgentFlight needs real verification evidence capture so reports, replay, status, and resume prompts prove what ran." --outcome "agentflight verify records command evidence locally and downstream commands use that evidence honestly." --constraint "Do not publish or cut a version in this task." --constraint "Local-first only; no telemetry, cloud, auth, billing, GitHub App, or database." --constraint "Use safe child_process execution without shell interpolation." --acceptance "agentflight verify -- <command> records passing and failing command results." --acceptance "agentflight verify with no args runs configured commands." --acceptance "status, report, replay, and resume reflect captured verification evidence." --acceptance "npm run verify and npm run format:check pass." --verify-command "npm run verify" --verify-command "npm run format:check"
```

ProjScan before-edit command:

```bash
npx projscan@latest start --mode before_edit --intent "Prepare AgentFlight v0.2.0 verification evidence capture"
```

Result:

- ProjScan reported health `100/100`.
- Proceeded with a dirty worktree because the active task was already in progress.

TDD evidence:

```bash
npm test -- tests/core/session.test.ts tests/core/verification.test.ts tests/commands/verify.test.ts
npm test -- tests/commands/evidence-output.test.ts
npm test -- tests/core/fs-safe.test.ts
```

Results:

- The first run failed because `verificationRuns`, `getVerificationRuns`, `runVerificationCommand`, `parseCommandLine`, and `runVerifyCommand` did not exist.
- The evidence-output run failed because status, report, replay, and resume still ignored recorded verification runs.
- The safe-write run failed because `isPathWritable` did not exist, exposing the doctor writable-check bug.

Implementation checkpoint:

```bash
npm test -- tests/core/session.test.ts tests/core/verification.test.ts tests/commands/verify.test.ts
npm test -- tests/commands/evidence-output.test.ts
npm test -- tests/core/fs-safe.test.ts
npm test -- tests/core/session.test.ts tests/core/verification.test.ts tests/commands/verify.test.ts tests/commands/evidence-output.test.ts tests/commands/workflow.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts
npm run typecheck
```

Results:

- Verification core and command tests passed: `3` files, `11` tests.
- Evidence-aware output tests passed: `1` file, `4` tests.
- Writable-check test passed: `1` file, `3` tests.
- Targeted integration and renderer tests passed: `8` files, `19` tests.
- `npm run typecheck` passed.

AgentFlight v0.2 self-dogfooding commands:

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

Results:

- `npm run build`: passed before the built CLI dogfood run.
- `start` created session `af-20260613-132334-dogfood-agentflight-v0-2-0-verification-evidence`.
- `verify -- npm run typecheck`: passed and recorded stdout/stderr evidence.
- `verify -- npm run lint`: passed and recorded stdout/stderr evidence.
- `verify -- npm test`: passed with `16` test files and `49` tests, and recorded stdout/stderr evidence.
- `verify -- npm run build`: passed and recorded stdout/stderr evidence.
- `status` reported `33` changed files, `medium` risk, `4 passed, 0 failed`, no configured verification gaps, and `Ready for review`.
- `report` generated `.agentflight/reports/af-20260613-132334-dogfood-agentflight-v0-2-0-verification-evidence-proof.md`.
- `replay` generated `.agentflight/reports/af-20260613-132334-dogfood-agentflight-v0-2-0-verification-evidence-replay.html`.
- `resume` generated a continuation prompt with no configured verification gaps and scoped-work guardrails.
- `doctor` reported overall `OK`.
- No version was cut and no npm publish was run for this v0.2.0 preparation pass.

ProjScan and AgentLoopKit follow-up:

```bash
npx projscan@latest start --mode after_edit --intent "Review AgentFlight v0.2.0 verification evidence implementation"
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest status
npx projscan@latest start --mode hardening --intent "Review AgentFlight v0.2.0 verification evidence implementation"
npx agentloopkit@latest verify
```

Results:

- `projscan start --mode after_edit`: failed because ProjScan `4.3.1` does not support `after_edit`; supported modes are `before_edit`, `before_commit`, `before_merge`, `refactor`, `release`, `bug_hunt`, and `hardening`.
- `projscan preflight --mode before_commit --format json`: verdict `proceed`, health `100/100`, required checks passed, and `33` changed files detected.
- `agentloopkit status`: reported dirty worktree with `33` changed files, configured commands present, and next action `agentloop verify`.
- `projscan start --mode hardening`: health `100/100` with `needs_attention` because of the active dirty worktree and hotspot review suggestions.
- `agentloopkit verify`: overall status `pass`; report written to `.agentloop/reports/2026-06-13-15-25-verification-report.md`.

Additional bug-pass fix:

```bash
npm test -- tests/cli-entrypoint.test.ts
node dist/cli.js --version
```

Result:

- The new version assertion first failed because `agentflight --version` still reported `0.1.0` while `package.json` was `0.1.1`.
- The CLI now reads the version from package metadata, and the focused entrypoint test passes.
- The built CLI reports `0.1.1`.

Final local verification commands for this pass:

```bash
npm run verify
npm run format:check
npm pack --dry-run
npm audit --audit-level=moderate
git status --short
```

Results:

- `npm run verify`: passed. It ran typecheck, lint, tests, and build. Vitest reported `16` test files and `50` tests passed.
- `npm run format:check`: passed after formatting the changed files.
- `npm pack --dry-run`: passed. The tarball includes `dist/commands/verify.js`, `dist/core/verification.js`, and the updated renderers.
- `npm audit --audit-level=moderate`: found `0 vulnerabilities`.
- `git status --short`: worktree remains dirty with the expected v0.2 implementation, tests, docs, AgentLoop task files, and no release tag or publish changes.

### v0.2.0 Release Preparation

Release metadata commands:

```bash
git status --short
git diff --stat
git status --short -- .agentflight .agentflight/sessions .agentflight/reports .agentflight/current .agentflight/evidence
npm version 0.2.0 --no-git-tag-version
npm install --package-lock-only
npm run build
node dist/cli.js --version
```

Results:

- Dirty worktree contained expected v0.2.0 source, tests, docs, `.gitignore`, package metadata, and AgentLoop task files.
- No `.agentflight/sessions/`, `.agentflight/reports/`, `.agentflight/current/`, or `.agentflight/evidence/` runtime files were visible in git status.
- `package.json`, `package-lock.json`, and the package-lock root package version were updated to `0.2.0`.
- `npm install --package-lock-only` completed with `0 vulnerabilities`; npm repeated allow-scripts review warnings for optional/native packages.
- `npm run build` passed.
- `node dist/cli.js --version` reported `0.2.0`.

Release verification commands:

```bash
npm run verify
npm run format:check
npm pack --dry-run
npm audit --audit-level=moderate
```

Results:

- `npm run verify`: passed. It ran typecheck, lint, tests, and build. Vitest reported `16` test files and `50` tests passed.
- `npm run format:check`: passed.
- `npm pack --dry-run`: passed for `agentflight@0.2.0`; package contents included `dist/commands/verify.js`.
- `npm audit --audit-level=moderate`: found `0 vulnerabilities`.

Packed-package smoke test:

```bash
npm pack --pack-destination /tmp/agentflight-pack-XcRBjU
cd /tmp/agentflight-smoke-70ZcRU
npm init -y
npm install /tmp/agentflight-pack-XcRBjU/agentflight-0.2.0.tgz
npx agentflight --version
npx agentflight --help
npx agentflight init
npx agentflight start --task "Release smoke test"
npx agentflight verify -- node -e "console.log('release smoke ok')"
npx agentflight status
npx agentflight report
npx agentflight replay
npx agentflight resume
npx agentflight doctor
```

Results:

- `npx agentflight --version`: reported `0.2.0`.
- `init`, `start`, `verify`, `status`, `report`, `replay`, `resume`, and `doctor` all ran from the installed tarball.
- `verify` captured `node -e "console.log('release smoke ok')"` as a passed run.
- `status` reported `1 passed, 0 failed`.
- `doctor` returned warnings only because the smoke project was not a git repository and did not define build/typecheck/lint scripts.

Release tool checks:

```bash
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest verify
npx agentloopkit@latest status
```

Results:

- ProjScan preflight verdict: `proceed`; health `100/100`; required checks passed; `36` changed files detected.
- AgentLoopKit verification: overall status `pass`; report written to `.agentloop/reports/2026-06-13-16-00-verification-report.md`.
- AgentLoopKit status reported dirty worktree with `36` changed files and all configured commands present.
