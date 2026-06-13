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
