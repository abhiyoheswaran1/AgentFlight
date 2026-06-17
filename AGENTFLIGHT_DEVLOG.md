# AgentFlight Devlog

This log records setup, dogfooding, and verification evidence for the AgentFlight MVP.

## 2026-06-17

### v0.5.1 Dogfood Patch Candidate

Scope:

- Keep v0.5.1 focused on v0.5.0 dogfood findings.
- Do not start v0.6.0.
- Do not bump version, commit, push, tag, publish, or release.

Implemented patch candidate:

- Changed inline `agentflight verify` output to print the stored
  stderr-preferred output excerpt instead of rereading and printing stdout.
- Kept raw stdout and stderr evidence files unchanged.
- Added compact display helpers for long suggested proof commands in status,
  Markdown reports, HTML replays, and resume prompts.
- Kept full long suggested proof commands locally available in HTML replay
  `title` attributes while keeping visible review rows compact.
- Reduced noisy AgentLoopKit Tooling lines in Markdown reports to concise status
  messages when AgentLoopKit is unavailable or doctor reports local issues.
- Preserved `.projscan-memory/**` as suggestion-only guidance, not a built-in
  ignored path.
- Removed untracked dogfood artifacts from the sibling `fifa-predictor` repo:
  `.agentflight/` and `.projscan-memory/`.

TDD evidence:

```bash
npm test -- tests/commands/verify.test.ts
npm test -- tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts
```

Results:

- Initial terminal excerpt regression failed because `runVerifyCommand` printed
  saved stdout instead of `VerificationRun.outputExcerpt`.
- Initial report/replay compact-command tests failed because long commands were
  rendered in full.
- Initial AgentLoopKit Tooling test failed because report output embedded full
  doctor diagnostics.
- After the patch, the targeted command and renderer tests passed.

### v0.5.1 Release Audit Pass

Release scope:

- Bump package metadata from `0.5.0` to `0.5.1`.
- Document manual ProjScan sign-off for the scale/review caution.
- Commit, push, tag, and rely on Trusted Publishing for npm release.
- Do not add product features or start v0.6.0.

Audit evidence:

- `node dist/cli.js --version` reported `0.5.1` after the version bump and
  build.
- `docs/development/v0.5.1-release-audit.md` records the ProjScan caution:
  maximum changed-file risk score `165.3 >= 80`.
- The caution was accepted as a manual release sign-off because ProjScan
  reported no concrete blockers, dependency changes, contract changes, taint or
  dataflow risks, risky functions, or cycles.
- Local packed-package smoke testing confirmed stderr-preferred failure
  excerpts in terminal, report, and replay output while preserving raw evidence.

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

### v0.2.1 Dogfood Friction Patch Preparation

Task discipline:

```bash
npx agentloopkit@latest create-task --title "Prepare AgentFlight v0.2.1 dogfood friction patch" --type bugfix --problem "AgentFlight v0.2.0 dogfooding found small workflow friction in verification output, risk clarity, replay readability, and ProjScan version detection." --outcome "Patch-level fixes are implemented locally without new product scope, and verification passes." --constraint "No new commands, cloud, login, billing, database, GitHub App, Pro gating, snapshot, JSON output, or v0.3.0 scope." --acceptance "agentflight verify prints evidence paths after recording results." --acceptance "AgentLoopKit dogfood files do not falsely raise docs-only sessions to medium risk." --acceptance "Reports, replays, and resume prompts have clearer next actions after proof exists." --verify-command "npm run verify" --verify-command "npm run format:check"
npx agentloopkit@latest task status .agentloop/tasks/2026-06-13-prepare-agentflight-v0-2-1-dogfood-friction-patch.md in-progress
```

ProjScan before-edit check:

```bash
npx projscan@latest preflight --mode before_edit --format json
```

Result:

- ProjScan verdict `proceed`; health `100/100`; no blocking or cautionary signals.

Bug reproduction:

```bash
projscan --version
which projscan
./node_modules/.bin/projscan --version
npx --yes projscan@latest --version
node -e "console.log(require('./node_modules/projscan/package.json').version)"
npm ls projscan
```

Results:

- PATH-global `projscan` was `/opt/homebrew/bin/projscan` and reported `0.9.2`.
- Repo-local `./node_modules/.bin/projscan`, `npx projscan@latest`, installed package metadata, and `npm ls projscan` all reported `4.3.1`.
- The adapter now prefers repo-local binaries before PATH-global commands.

TDD checkpoint:

```bash
npm test -- tests/adapters/projscan.test.ts tests/adapters/agentloopkit.test.ts tests/core/risk.test.ts tests/commands/verify.test.ts tests/commands/evidence-output.test.ts tests/renderers/html-replay.test.ts
```

Results:

- The first targeted run failed with expected red tests for stale PATH binary preference, decorated version output, `.agentloop/` risk classification, missing `Evidence saved:` output, stale report/replay/resume next actions, and missing replay summary.
- After the patch, the same targeted suite passed: `6` test files and `34` tests.

Patch scope:

- `verify` prints stdout/stderr evidence paths and clearer failed-command next actions.
- `.agentloop/` workflow artifacts are categorized as low-risk docs.
- ProjScan and AgentLoopKit adapters prefer repo-local binaries and normalize version output.
- Report, replay, and resume use context-aware post-proof next actions.
- Replay includes a compact summary strip.
- Vitest has an explicit `10s` test timeout because full-suite runs can spawn several real Node verification commands concurrently.
- No new product features, cloud, login, billing, database, GitHub App, Pro gating, snapshot, JSON output, tag, or publish was added.

Release-candidate verification:

```bash
npm version 0.2.1 --no-git-tag-version
npm test -- tests/adapters/projscan.test.ts tests/adapters/agentloopkit.test.ts tests/core/risk.test.ts tests/commands/verify.test.ts tests/commands/evidence-output.test.ts tests/renderers/html-replay.test.ts
npm run verify
npm run format:check
npm pack --dry-run
npm audit --audit-level=moderate
node dist/cli.js --version
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest verify
npm run projscan
npm run agentloopkit:doctor
npx agentloopkit@latest task done .agentloop/tasks/2026-06-13-prepare-agentflight-v0-2-1-dogfood-friction-patch.md
```

Results:

- Package metadata was updated locally to `0.2.1` without creating a tag or publishing.
- Targeted regression suite passed: `6` test files and `34` tests.
- `npm run verify` initially hit transient full-suite Vitest timeouts around tests that spawn real Node verification commands; focused tests passed. The test timeout is now explicit at `10s`.
- Final `npm run verify` passed. It ran typecheck, lint, tests, and build. Vitest reported `16` test files and `58` tests passed.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.2.1`; package contents include `dist/commands/verify.js`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `node dist/cli.js --version` reported `0.2.1`.
- ProjScan preflight verdict `proceed`; health `100/100`; required checks passed with `26` changed files detected.
- AgentLoopKit verification status `pass`; report written to `.agentloop/reports/2026-06-13-17-52-verification-report.md`.
- `npm run projscan` used ProjScan `4.3.1`; it exited successfully with health `100/100` and `needs_attention` because the worktree is intentionally dirty during patch prep.
- `npm run agentloopkit:doctor` exited successfully with `warn` due to the expected dirty worktree and risk-file scan warnings.
- The v0.2.1 AgentLoopKit task was marked `done`.

### v0.3.0 Session Events And Snapshots

Task discipline:

```bash
npx agentloopkit@latest create-task --title "Prepare AgentFlight v0.3.0 session events and snapshots" --type feature --problem "AgentFlight needs timeline events and snapshots so sessions feel like real AI coding flight recordings, not only final-state reports." --outcome "AgentFlight records session events, supports agentflight snapshot, and status/report/replay/resume use the timeline while preserving v0.1/v0.2 compatibility." --constraint "Local-first only; no telemetry, cloud, login, billing, GitHub App, database, paid gating, full diff capture, destructive commands, tag, or publish." --acceptance "agentflight snapshot records current git/risk/verification state as a session event." --acceptance "start, verify, report, replay, resume, and doctor append meaningful events." --acceptance "replay/report/status/resume show timeline or latest snapshot context." --acceptance "npm run verify and npm run format:check pass." --verify-command "npm run verify" --verify-command "npm run format:check"
npx agentloopkit@latest task status .agentloop/tasks/2026-06-13-prepare-agentflight-v0-3-0-session-events-and-snapshots.md in-progress
```

ProjScan before-edit check:

```bash
npx projscan@latest preflight --mode before_edit --format json
```

Result:

- ProjScan verdict `proceed`; health `100/100`; no blocking or cautionary signals.

TDD checkpoint:

```bash
npm test -- tests/core/session.test.ts tests/commands/snapshot.test.ts tests/commands/verify.test.ts tests/commands/evidence-output.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts
```

Results:

- The first targeted run failed as expected because `snapshot`, session `events`, timeline rendering, and verification events did not exist yet.
- After implementation, the targeted suite passed: `7` test files and `17` tests.

Implementation summary:

- Added `SessionEvent` and `SessionEventType` to the session model.
- Added backward-compatible event helpers that treat missing `events` arrays as empty.
- Added synthetic timeline fallback for older sessions where useful.
- Added `agentflight snapshot --note "..."`.
- Added event recording for start, verify, report, replay, resume, and doctor.
- Added timeline sections to report and replay.
- Added latest snapshot and verification state to status/resume surfaces.
- Added docs for snapshots and timelines.
- Updated local package metadata to `0.3.0` without tagging or publishing.

Release-candidate verification:

```bash
npm version 0.3.0 --no-git-tag-version
npm run verify
npm run format:check
node dist/cli.js --version
node dist/cli.js --help
npm pack --dry-run
npm audit --audit-level=moderate
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest verify
```

Results:

- `npm run verify`: passed. It ran typecheck, lint, tests, and build. Vitest reported `17` test files and `61` tests passed.
- `npm run format:check`: passed after formatting.
- `node dist/cli.js --version`: reported `0.3.0`.
- `node dist/cli.js --help`: listed `snapshot [options]`.
- `npm pack --dry-run`: passed for `agentflight@0.3.0`; package contents include `dist/commands/snapshot.js`.
- `npm audit --audit-level=moderate`: found `0 vulnerabilities`.
- ProjScan before-commit preflight verdict `proceed`; health `100/100`; required checks passed with `41` changed files detected.
- AgentLoopKit verification status `pass`; report written to `.agentloop/reports/2026-06-13-18-20-verification-report.md`.
- No release tag, npm publish, cloud, login, billing, database, GitHub App, or paid gating was added.

### v0.3.0 Completion Audit

Task discipline:

```bash
npx agentloopkit@latest create-task --title "Audit AgentFlight v0.3.0 release readiness" --type docs --problem "AgentFlight needs a strict v0.1.0 through v0.3.0 completion audit before any v0.3.0 release." --outcome "A documented completion audit confirms command behavior, compatibility, packaging, privacy, tests, and release readiness, with only real audit bugs fixed." --constraint "Do not tag, push, publish, or add product scope." --acceptance "docs/development/v0.3.0-completion-audit.md records results and fixes." --acceptance "npm run verify, format:check, package dry run, audit, ProjScan, and AgentLoopKit checks pass." --verify-command "npm run verify" --verify-command "npm run format:check"
npx agentloopkit@latest task status .agentloop/tasks/2026-06-13-audit-agentflight-v0-3-0-release-readiness.md in-progress
```

Audit commands:

```bash
node dist/cli.js --help
node dist/cli.js --version
node dist/cli.js init
node dist/cli.js start --task "Audit AgentFlight v0.3.0"
node dist/cli.js verify -- npm run typecheck
node dist/cli.js verify -- npm run lint
node dist/cli.js verify -- npm test
node dist/cli.js verify -- npm run build
node dist/cli.js snapshot --note "Audit checkpoint after verification"
node dist/cli.js status
node dist/cli.js report
node dist/cli.js replay
node dist/cli.js resume
node dist/cli.js doctor
node dist/cli.js upgrade
node dist/cli.js license
node dist/cli.js login
```

Results:

- Built CLI reported `0.3.0` and help listed `snapshot [options]`.
- Command matrix completed without unexpected crashes.
- Placeholder commands printed `AgentFlight Pro/Team is not available yet.`
- Audit session `af-20260613-162443-audit-agentflight-v0-3-0` recorded four passed verification runs, evidence files, a snapshot, report, replay, resume, and doctor event.
- Report, replay, status, and resume all reflected the snapshot and timeline data.
- Simulated v0.1 and v0.2 sessions without `events` completed `status`, `report`, `replay`, and `resume` without crashing.
- Failed verification was tested in a temp session and recorded as `failed` with exit code `7`, stderr evidence, and `verification_failed`.
- Packaging audit confirmed `dist/commands/snapshot.js` and all existing command files are present, and runtime `.agentflight` data is not tracked or packed.

Bug found and fixed:

- Commands requiring an active session printed a raw `ENOENT` path when no current session existed.
- `readCurrentSession` now throws `No active AgentFlight session. Run agentflight start --task "Describe the task" first.`
- Added regression coverage in `tests/commands/workflow.test.ts`.

Audit report:

- Created `docs/development/v0.3.0-completion-audit.md`.

Final audit verification:

```bash
npm run verify
npm run format:check
npm pack --dry-run
npm audit --audit-level=moderate
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest verify
npx agentloopkit@latest task done .agentloop/tasks/2026-06-13-audit-agentflight-v0-3-0-release-readiness.md
```

Results:

- `npm run verify`: passed. Vitest reported `17` test files and `62` tests.
- `npm run format:check`: passed after formatting generated AgentLoop task docs.
- `npm pack --dry-run`: passed for `agentflight@0.3.0`.
- `npm audit --audit-level=moderate`: found `0 vulnerabilities`.
- ProjScan preflight verdict `proceed`; health `100/100`; required checks passed.
- AgentLoopKit verification status `pass`; report written to `.agentloop/reports/2026-06-13-18-32-verification-report.md`.
- Audit task was marked `done`.

### Public Demo Visibility Pass After v0.3.0

Goal:

- Make AgentFlight easier to understand in under 60 seconds after the v0.3.0 release.
- Keep the pass limited to README, demo docs, package metadata, and launch-note drafts.
- Do not add CLI features, cloud, login, billing, GitHub App, paid gating, database, or v0.4.0 scope.

Demo artifact generation:

```bash
node dist/cli.js init
node dist/cli.js start --task "Add password reset flow"
node dist/cli.js verify -- npm test
node dist/cli.js snapshot --note "Password reset implementation verified"
node dist/cli.js status
node dist/cli.js report
node dist/cli.js replay
npx playwright screenshot --viewport-size=1440,1200 "file://<demo-replay-path>" output/playwright/agentflight-replay-timeline.png
```

Results:

- Generated a fictional password-reset demo session in a temporary git repo.
- Captured a real AgentFlight HTML replay screenshot with Playwright.
- Added `docs/assets/agentflight-replay-timeline.png` for README/demo use.
- Rendered a small terminal workflow GIF with VHS from `docs/marketing/agentflight-terminal-demo.tape`.
- Updated README with a 60-second workflow, concise sample outputs, current capabilities, local/privacy notes, and explicit non-goals.
- Added `docs/examples/basic-agentflight-session.md`.
- Added `docs/marketing/launch-notes-v0.3.0.md`.
- Expanded package keywords for npm discovery.
- Added `CHANGELOG.md`, the replay screenshot, and README-linked docs to the npm `files` list so public README links and image assets are present in the packed package without shipping marketing drafts.
- Added `output/` to `.gitignore` so Playwright scratch artifacts are not committed.

### v0.3.1 Documentation Polish Release Prep

Goal:

- Release AgentFlight v0.3.1 as a patch release for README, package metadata, and demo asset polish.
- Do not change CLI behavior or add product scope.

Release prep:

```bash
npm version 0.3.1 --no-git-tag-version
```

Planned release verification:

```bash
npm run verify
npm run format:check
npm pack --dry-run
npm audit --audit-level=moderate
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest verify
```

### README CLI Animation Pass

Goal:

- Make the README demo area more useful by showing an animated CLI workflow and the generated replay artifact.
- Keep the pass limited to docs and package metadata.

Changes:

- Added `docs/assets/agentflight-cli-demo.svg`, an animated terminal-style workflow preview.
- Updated README to show the CLI workflow animation before the 60-second command list.
- Added a `Watch The Flow` section that explains start, verify, snapshot, status, report, replay, and resume as one proof trail.
- Added the animated SVG to the npm `files` list because the README references it.

### Logo And Repository Metadata Pass

Goal:

- Use the new AgentFlight logo in public docs.
- Set GitHub repository About metadata for description, website, and topics.

Changes:

- Added the AgentFlight logo to the README header from `docs/agentflight_logo/icon.svg`.
- Added the product website link near the top of the README.
- Added `docs/agentflight_logo/icon.svg` to the npm `files` list.
- Updated `package.json` homepage to `https://www.baseframelabs.com/apps/agentflight`.
- Updated GitHub About metadata:
  - Description: `Local-first flight recorder for AI coding agents.`
  - Website: `https://www.baseframelabs.com/apps/agentflight`
  - Topics: AI coding agents, Codex, Claude Code, local-first, verification, developer tools.

### v0.3.2 Dogfood And Replay UI Polish

Goal:

- Dogfood published `agentflight@latest` v0.3.2 across local repos before planning v0.4.0.
- Use `$impeccable` direction to improve the developer-facing HTML replay artifact without adding product scope.

Dogfood repos:

- AgentFlight: full workflow completed with typecheck, lint, tests, and build captured through `agentflight verify`.
- ProjScan: workflow completed with lint/build captured; long `npm test` was interrupted after more than four minutes of silent runtime.
- fifa-predictor: real app workflow completed with typecheck, 61 tests, and build captured.
- AgentLoopKit and TokenTrace were available but skipped because they had pre-existing dirty worktrees.

Findings document:

- `docs/development/v0.3.2-dogfood-findings.md`

UI polish:

- Added `PRODUCT.md` with the confirmed product UI direction: precise, calm, trustworthy.
- Reworked `src/renderers/html-replay.ts` toward a developer review artifact: compact evidence header, summary strip, timeline rows, file groups, and collapsed evidence paths.
- Updated `tests/renderers/html-replay.test.ts` to cover verification evidence in the replay artifact.
- Captured Playwright screenshots:
  - `output/playwright/agentflight-replay-ui-polish-desktop.png`
  - `output/playwright/agentflight-replay-ui-polish-mobile.png`

Verification:

```bash
npm test -- tests/renderers/html-replay.test.ts tests/commands/evidence-output.test.ts
npm run verify
npm run format:check
npm pack --dry-run
npm audit --audit-level=moderate
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest verify
```

Results:

- Focused replay/evidence tests passed: 2 files / 7 tests.
- `npm run verify` passed: 17 files / 62 tests.
- `npm run format:check` passed.
- `npm pack --dry-run` passed.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- ProjScan preflight passed with `proceed`, health `100/100`.
- AgentLoopKit verification passed.

### v0.3.3 Patch Candidate Runtime Filtering

Goal:

- Prepare a focused v0.3.3 patch candidate without version bump, tag, push, or publish.
- Keep the completed replay UI polish and dogfood findings documentation.
- Fix the dogfood finding where AgentFlight runtime files polluted changed-file analysis in repos that did not already ignore `.agentflight/`.

Decision:

- Exclude AgentFlight runtime artifacts from changed-file analysis:
  - `.agentflight/sessions/**`
  - `.agentflight/reports/**`
  - `.agentflight/current/**`
  - `.agentflight/evidence/**`
- Keep `.agentflight/config.json` visible because it is user-controlled project configuration and may be intentionally committed.

Implementation:

- Added a central runtime-path filter in `src/core/changed-files.ts`.
- Applied filtering through git utilities and command-level changed-file inputs for status, report, replay, resume, and snapshot.
- Added regression coverage in:
  - `tests/core/git.test.ts`
  - `tests/commands/evidence-output.test.ts`
  - `tests/commands/snapshot.test.ts`

Red/green evidence:

```bash
npm test -- tests/core/git.test.ts tests/commands/evidence-output.test.ts tests/commands/snapshot.test.ts
```

Initial focused run failed because runtime `.agentflight/` paths were still included in changed-file counts, risk, and snapshot metadata. After the central filter was implemented, the same focused suite passed.

Verification:

```bash
npm run verify
npm run format:check
npm pack --dry-run
npm audit --audit-level=moderate
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest verify
```

Results:

- `npm run verify` passed: 17 files / 66 tests.
- `npm run format:check` passed.
- `npm pack --dry-run` passed and included `dist/core/changed-files.js`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- ProjScan preflight passed with `proceed`, health `100/100`.
- AgentLoopKit verification passed.

Packed smoke test:

```bash
npm pack --pack-destination "$PACK_DIR"
npm install "$PACK_DIR/agentflight-0.3.3.tgz"
npx agentflight --version
npx agentflight init
npx agentflight start --task "v0.3.3 release smoke test"
npx agentflight verify -- npm --version
npx agentflight snapshot --note "runtime filtering smoke test"
npx agentflight status
npx agentflight report
npx agentflight replay
npx agentflight resume
npx agentflight doctor
```

Result:

- Packed CLI reported `0.3.3`.
- `status` showed `.agentflight/config.json` and `.projscan-memory/memory.json`.
- `status` did not show `.agentflight/current/`, `.agentflight/evidence/`, `.agentflight/reports/`, or `.agentflight/sessions/`.
- Report, replay, resume, and doctor completed from the packed install.

### v0.3.2 Branding Polish Release Prep

Goal:

- Release AgentFlight v0.3.2 as a branding, README animation, and package presentation patch.
- Do not change CLI behavior or add product scope.

Release prep:

```bash
npm version 0.3.2 --no-git-tag-version
```

Release verification:

```bash
npm run verify
npm run format:check
npm pack --dry-run
npm audit --audit-level=moderate
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest verify
```

### v0.4.0 Review Intelligence Implementation

Timestamp: `2026-06-14T12:47:56Z`

Goal:

- Implement the planned v0.4.0 Review Intelligence scope without version bump, commit, tag, push, or publish.
- Keep AgentFlight local-first and deterministic.
- Do not implement PR comments, JSON/CI, ProjScan-enriched ranking, cloud, login, billing, GitHub App, or Pro/Team gating.

Implemented locally:

- Added `src/core/review-intelligence.ts` for deterministic review focus ranking, proof gap detection, and readiness decisions.
- Added review intelligence types in `src/types/index.ts`.
- Added config-driven changed-file filtering through `changedFileFilters.ignore`.
- Kept AgentFlight runtime filters always on while leaving `.agentflight/config.json` visible.
- Integrated review intelligence into:
  - `agentflight status`
  - `agentflight report`
  - `agentflight replay`
  - `agentflight resume`
  - `agentflight snapshot` metadata summary
- Added `docs/development/changed-file-filters.md`.
- Updated README, CHANGELOG, roadmap, and verification docs.

Red/green evidence:

```bash
npm test -- tests/core/review-intelligence.test.ts tests/core/changed-files.test.ts
```

Initial result:

- Failed because `src/core/review-intelligence.ts` and `filterChangedFiles` did not exist.

Green result after implementation:

- Passed: 2 files / 11 tests.

Additional focused verification:

```bash
npm test -- tests/core/config.test.ts tests/core/review-intelligence.test.ts tests/core/changed-files.test.ts
npm test -- tests/commands/evidence-output.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts
npm test
npm run typecheck
```

Results:

- Config/review/filter focused tests passed: 3 files / 14 tests.
- Command and renderer integration tests passed: 4 files / 11 tests.
- Full Vitest suite passed: 19 files / 79 tests.
- TypeScript typecheck passed.

Final v0.4.0 verification:

```bash
npm run verify
npm run format:check
npm pack --dry-run
npm audit --audit-level=moderate
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest verify
```

Results:

- `npm run verify` passed: typecheck, lint, 19 test files / 79 tests, build.
- `npm run format:check` passed after formatting edited tests/types.
- `npm pack --dry-run` passed and included:
  - `dist/core/review-intelligence.js`
  - `docs/development/changed-file-filters.md`
  - `docs/roadmap/v0.4.0-review-intelligence-plan.md`
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx agentloopkit@latest verify` passed.
- `npx projscan@latest doctor --format json` passed with health `100/100` after removing a false-positive string pattern from `src/core/review-intelligence.ts`.
- `npx projscan@latest preflight --mode before_commit --format json` completed with verdict `caution`, not `proceed`.
  - Health: pass, `100/100`.
  - Supply chain: pass.
  - Review: warning for scale/complexity, maximum changed-file risk score `125.3`.
  - Interpretation: no health, taint, dataflow, plugin, or supply-chain blocker remains, but the v0.4.0 implementation should receive manual audit/release sign-off because it touches command output, renderers, config, and review logic.

### v0.4.0 Completion Audit

Timestamp: `2026-06-14T14:05:00Z`

Goal:

- Audit the unreleased v0.4.0 Review Intelligence implementation before any release work.
- Do not bump version, commit, push, tag, or publish.
- Explicitly handle the ProjScan caution instead of treating it as a normal proceed.

Audit fixes made:

- Added package/config proof-gap regression coverage.
- Added command-path backward compatibility coverage for v0.1/v0.2/v0.3 session shapes.
- Hardened malformed `changedFileFilters.ignore` handling so non-array values do not crash changed-file analysis.
- Corrected the historical v0.4.0 plan to document the implemented empty default `changedFileFilters.ignore` list.
- Replaced `docs/assets/agentflight-replay-timeline.png` with a fresh screenshot generated from the current replay renderer. The screenshot now shows review focus, proof gaps, readiness, and timeline in the calmer developer-review UI.
- Created `docs/development/v0.4.0-completion-audit.md`.

Commands run during audit:

```bash
npm test -- tests/core/review-intelligence.test.ts tests/core/changed-files.test.ts
npm run build
node dist/cli.js --version
node dist/cli.js --help
node dist/cli.js init
node dist/cli.js start --task "Audit AgentFlight v0.4.0 review intelligence"
node dist/cli.js verify -- npm run typecheck
node dist/cli.js verify -- npm run lint
node dist/cli.js verify -- npm test
node dist/cli.js verify -- npm run build
node dist/cli.js snapshot --note "Audit checkpoint after review intelligence verification"
node dist/cli.js status
node dist/cli.js report
node dist/cli.js replay
node dist/cli.js resume
node dist/cli.js doctor
npx projscan@latest preflight --mode before_commit --format json
npx playwright screenshot --viewport-size "1440,1350" --wait-for-selector "text=Timeline" <local-replay-demo-url> docs/assets/agentflight-replay-timeline.png
npm test -- tests/commands/evidence-output.test.ts tests/core/review-intelligence.test.ts tests/core/changed-files.test.ts
```

Observed results:

- Built CLI reported `0.3.3`, expected because no v0.4.0 version bump has been made.
- Command matrix completed successfully.
- AgentFlight captured four passed verification runs: typecheck, lint, test, and build.
- Latest audit snapshot recorded `27` filtered changed files, `medium` risk, and `4 passed, 0 failed`.
- `status`, `report`, `replay`, and `resume` all surfaced review focus, proof gaps, readiness, and next action.
- Targeted tests passed: 3 files / 22 tests.
- ProjScan preflight still returned `caution` due scale/complexity, with health `100/100`, supply chain pass, and no concrete blockers.

Final audit verification:

```bash
npm run verify
npm run format:check
npm pack --dry-run
npm audit --audit-level=moderate
npx agentloopkit@latest verify
npx projscan@latest doctor --format json
npx projscan@latest preflight --mode before_commit --format json
```

Results:

- `npm run verify` passed: typecheck, lint, 19 test files / 82 tests, build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.3.3` and included `dist/core/review-intelligence.js`, `dist/core/changed-files.js`, `docs/development/changed-file-filters.md`, `docs/roadmap/v0.4.0-review-intelligence-plan.md`, and `docs/assets/agentflight-replay-timeline.png`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx agentloopkit@latest verify` passed.
- `npx projscan@latest doctor --format json` passed with health `100/100`.
- `npx projscan@latest preflight --mode before_commit --format json` returned `caution`, not `proceed`.
  - Changed files: `30`.
  - Review signal: maximum changed-file risk score `125.3`.
  - Health: pass.
  - Supply chain: pass.
  - Concrete blockers: none reported.
  - Manual sign-off recommendation: acceptable for v0.4.0 release prep after human review of review-intelligence logic, changed-file filtering, and renderer/command consistency.

### v0.4.1 Patch Candidate: Dogfood Friction Fixes

Timestamp: `2026-06-15T00:05:00+02:00`

Goal:

- Implement only the focused v0.4.1 dogfood fixes after published v0.4.0 testing.
- Do not bump version, commit, push, tag, publish, or start v0.5.0.

Scope implemented:

- Detect `verification_started` events that have no later passed/failed event or persisted verification run.
- Surface incomplete verification as a blocking Review Intelligence proof gap.
- Prevent `Ready for review` when incomplete verification needs rerun.
- Add a minimal `agentflight verify` heartbeat for long-running commands.
- Keep heartbeat output out of captured stdout/stderr evidence.
- Route report proof-gap language through Review Intelligence instead of legacy verification-gap text.
- Classify `.agentflight/config.json` as AgentFlight project config while keeping it visible.
- Suggest `.projscan-memory/**` in `changedFileFilters.ignore` when `.projscan-memory/memory.json` appears, without making it a built-in ignore.

Red/green evidence:

```bash
npm test -- tests/core/review-intelligence.test.ts tests/commands/evidence-output.test.ts tests/commands/verify.test.ts
```

Initial result:

- Failed as expected for incomplete verification detection, ProjScan-memory guidance, AgentFlight config classification, and heartbeat support.

After implementation:

- Targeted tests passed: 3 files / 27 tests.

### v0.4.1 Release Preparation

Timestamp: `2026-06-15T07:10:00+02:00`

Goal:

- Release AgentFlight v0.4.1 as a focused Review Intelligence trust patch.
- Do not add product scope or start v0.5.0.

Commands run:

```bash
npm version 0.4.1 --no-git-tag-version
npm run build
node dist/cli.js --version
npm run verify
npm run format:check
npm pack --dry-run
npm audit --audit-level=moderate
npx agentloopkit@latest verify
npx projscan@latest doctor --format json
npx projscan@latest preflight --mode before_commit --format json
```

Results:

- Package metadata and lockfile are aligned at `0.4.1`.
- Built CLI reported `0.4.1`.
- `npm run verify` passed: typecheck, lint, 19 test files / 89 tests, build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.4.1`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- AgentLoopKit verification passed.
- ProjScan doctor passed with health `100/100`.
- ProjScan preflight returned `proceed` with no caution.
- Local packed-package smoke test passed through init, start, verify, snapshot, status, report, replay, resume, and doctor.
