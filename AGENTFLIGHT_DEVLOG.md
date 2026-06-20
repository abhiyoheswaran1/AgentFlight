# AgentFlight Devlog

This log records setup, dogfooding, and verification evidence for the AgentFlight MVP.

## 2026-06-21

### History Limit Handling

Dogfood finding:

- After adding `agentflight history`, invalid limits were still too permissive:
  `--limit nope` fell back to the default and `--limit 0` produced an empty
  history. CLI flags should fail loudly when the request is invalid.

Implemented locally:

- `agentflight history --limit` now accepts only positive integers.
- Non-integer, zero, negative, and fractional limits throw
  `History limit must be a positive integer.`

Verification:

- Red test failed because invalid limits still resolved successfully.
- `npm test -- tests/commands/history.test.ts tests/cli-entrypoint.test.ts`
  passed: 2 files / 9 tests.
- `npm run typecheck` passed.
- `npm run build` passed.
- Built CLI bug pass: `agentflight history --limit nope` exited `1` with the
  expected error, while `agentflight history --limit 1` exited `0` and listed
  the current session.
- AgentFlight-captured focused verification passed:
  `npm test -- tests/commands/history.test.ts tests/cli-entrypoint.test.ts`
  passed: 2 files / 9 tests.
- AgentFlight-captured full verification passed: `npm run verify` passed with
  21 files / 157 tests, plus typecheck, lint, and build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale manual signoff caution: 108 changed
  files against `origin/main`, maximum changed-file risk score `188.6`, and no
  concrete blockers.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-01-53-verification-report.md`.

### Local Session History

Research signal:

- After repeated dogfood loops, AgentFlight had useful local report/replay
  artifacts but no simple way to list recent sessions. Real engineers should
  not need to remember generated filenames or inspect `.agentflight/sessions/`
  directly to find the prior proof trail.

Persona readout:

- Product Maintainer: local session discovery supports the handoff ladder
  without becoming search, export, PR comments, or cloud sync.
- CLI Engineer: keep this as a read-only command with text output and no hidden
  session switching.
- Verification Engineer: malformed session files should not crash the command.
- Security Reviewer: artifact paths must stay repo-relative and local-only.
- Repo Steward: do not add indexing files or mutate historical session JSON.

Implemented locally:

- Added `agentflight history` to list recent local sessions newest first.
- History output shows the current-session marker, task, branch, verification
  pass/fail counts, and existing local report/replay paths.
- Malformed session files are counted and skipped rather than crashing output.
- The command does not generate artifacts, switch sessions, upload data, or
  write an index.

Verification so far:

- Red core test failed because `listSessionSummaries` did not exist.
- Added `listSessionSummaries` in `src/core/session.ts`; green result:
  `npm test -- tests/core/session.test.ts` passed: 1 file / 4 tests.
- Red command test failed because `src/commands/history.ts` did not exist.
- Added `runHistoryCommand`; after fixing an un-awaited formatter bug,
  `npm test -- tests/commands/history.test.ts` passed: 1 file / 3 tests.
- CLI wiring red test failed until `history` was registered in `src/cli.ts`;
  focused result passed: 3 files / 12 tests.
- Bug pass: built CLI `agentflight history --limit 3` in this repo listed the
  current session, recent report/replay artifacts, and missing artifacts using
  repo-relative paths.
- Bug pass: temp Git smoke created two sessions, corrupted one archived session
  JSON file, and `agentflight history --limit 5` still completed while reporting
  `Skipped: 1 malformed session file.`
- ProjScan initially flagged `src/core/session.ts:listSessionSummaries` as a new
  high-complexity function. The helper was split into directory-read,
  per-session-load, sorting, and limit-normalization helpers; the follow-up
  `projscan review --format json` reported no risky functions.
- AgentFlight-captured focused verification passed:
  `npm test -- tests/core/session.test.ts tests/commands/history.test.ts tests/cli-entrypoint.test.ts`
  passed: 3 files / 12 tests.
- AgentFlight-captured full verification passed: `npm run verify` passed with
  21 files / 156 tests, plus typecheck, lint, and build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0` and included
  `dist/commands/history.js`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale manual signoff caution: 106 changed
  files against `origin/main`, maximum changed-file risk score `188.6`, and no
  concrete blockers.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-01-47-verification-report.md`.

### First-Run Runtime Git Noise

Dogfood finding:

- First-run workspace hygiene remains a major trust signal. `agentflight init`
  already filters runtime evidence from AgentFlight review analysis, but it also
  created `.gitkeep` files in runtime directories, which could still add Git
  status noise in fresh repos.

Persona readout:

- Product Maintainer: first-run trials should make the useful project config
  visible without making generated runtime directories feel like review work.
- CLI Engineer: keep the behavior local and deterministic; do not mutate the
  project root `.gitignore`.
- Repo Steward: avoid creating trackable placeholder files for runtime evidence
  directories.
- Security Reviewer: `.agentflight/config.json` must remain visible because it
  can affect local verification and filtering behavior.

Implemented locally:

- `agentflight init` now writes `.agentflight/.gitignore` with runtime directory
  rules for `sessions/`, `reports/`, `evidence/`, and `current/`.
- Fresh init no longer creates runtime `.gitkeep` files.
- `.agentflight/config.json` remains visible project config.
- `.projscan-memory/**` remains suggestion-only guidance, not a built-in ignore.

Verification:

- Added config regression coverage for `.agentflight/.gitignore`, preserved
  existing config files, and absent runtime `.gitkeep` files.
- Updated workflow coverage for the new first-run init copy.
- `npm test -- tests/core/config.test.ts tests/commands/workflow.test.ts tests/core/changed-files.test.ts`
  passed: 3 files / 13 tests.
- After a stale `.gitkeep` expectation was found in command-output tests,
  updated the affected invalid-report-mode assertion and reran focused coverage:
  4 files / 38 tests passed.
- `npm run verify` passed: 20 files / 149 tests, plus typecheck, lint, and
  build.
- `npm run format:check` passed.
- Built-CLI temp Git smoke passed: fresh `agentflight init` created
  `.agentflight/.gitignore` and `.agentflight/config.json` without runtime
  `.gitkeep` files.
- Added risk/review coverage so `.agentflight/.gitignore` is classified as
  AgentFlight project config rather than unknown code.
- Expanded focused AgentFlight proof passed: 6 files / 75 tests.
- Final `npm run verify` passed: 20 files / 151 tests, plus typecheck, lint,
  and build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  a manual scale caution: 98 changed files against `origin/main`, maximum
  changed-file risk score `188.6`, and no concrete blockers.
- `npx projscan@latest review --format json` returned the matching
  release-scale block signal only: no cycles, risky functions, dependency
  changes, contract changes, taint flows, or dataflow risks.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-01-31-verification-report.md`.

Bug pass:

- Running `status`, `report`, `replay`, `resume`, and `handoff` concurrently
  exposed a real AgentFlight race: `replay` could fail with
  `Unexpected end of JSON input` while another command was overwriting
  `.agentflight/current/session.json`.
- Root cause: `writeJsonFileSafe(..., { overwrite: true })` used direct
  `writeFile`, so readers could observe a truncated JSON file during an
  overwrite.
- Added a regression test that repeatedly overwrites a JSON file while another
  loop parses it.
- Red result: `npm test -- tests/core/fs-safe.test.ts` failed with partial JSON
  parse errors, including `Unexpected end of JSON input`.
- Fix: `writeTextFileSafe` now writes to a same-directory temporary file and
  atomically renames it into place.
- Green result: `npm test -- tests/core/fs-safe.test.ts` passed: 1 file / 4
  tests.
- Built CLI concurrent artifact smoke passed: `status`, `report`, `replay`,
  `resume`, and `handoff` all completed without JSON parse failures.

### Compact Text Evidence Commands

Dogfood finding:

- After replay ledger commands were compacted, `agentflight status` still showed
  a full long passing verification command in the evidence list. That kept the
  terminal status dense and noisy for a run that was otherwise ready for review.

Persona readout:

- Product Maintainer: status and report should stay fast to scan because they
  are the first artifacts developers read before deciding what to open.
- CLI Engineer: compact display must not mutate `verificationRuns[].command` or
  stdout/stderr evidence paths.
- Docs and DX Writer: short commands should remain unchanged; only genuinely
  long evidence labels should collapse.
- Security Reviewer: this must remain local display formatting, not hidden
  evidence rewriting.

Implemented locally:

- Status verification evidence rows now use the shared compact command display
  helper for long run commands.
- Markdown report verification evidence rows use the same compact display helper
  for long run commands.
- Stored verification run commands and raw evidence files remain unchanged.

Verification:

- Added command/output regression coverage for compact status evidence labels,
  unchanged stored commands, and preserved stdout evidence.
- Added Markdown renderer coverage for compact verification evidence labels.
- `npm test -- tests/commands/evidence-output.test.ts tests/renderers/markdown-report.test.ts`
  passed: 2 files / 32 tests.
- Adjacent bug pass with evidence output, Markdown report, HTML replay, and
  Review Intelligence tests passed: 4 files / 56 tests.
- `npm run verify` passed: 20 files / 149 tests, plus typecheck, lint, and
  build.
- `npm run format:check` passed after formatting the new Markdown report test.
- AgentFlight captured `npm run verify` as passing evidence for this session.
- Dogfooded harmless long passing `agentflight verify` commands and regenerated
  status/report: the genuinely long verification command rendered compactly in
  both text surfaces while evidence paths remained visible.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found 0 vulnerabilities.
- `npx projscan@latest doctor --format json` passed with score 100/A.
- ProjScan preflight/review kept the existing accumulated branch-scale manual
  signoff caution: 90 changed files and max changed-file risk score 188.6, with
  no concrete cycle, risky-function, dependency, contract, taint, or dataflow
  blockers reported.
- `npx agentloopkit@latest verify` passed.

### Compact Replay Ledger Commands

Persona readout:

- Product Maintainer: replay should stay the best artifact to open after proof
  passes, so dense ledger rows should not be dominated by command noise.
- CLI Engineer: display compaction should not mutate captured verification
  command evidence.
- Security Reviewer: HTML title and visible command text must remain escaped.
- Docs and DX Writer: reviewers still need a way to inspect the full command
  when the visible label is shortened.

Implemented locally:

- HTML replay verification ledger rows now use the shared compact command
  display helper for long run commands.
- The full command remains available in the `title` attribute when the visible
  command is shortened.
- Stored verification run data and raw stdout/stderr evidence are unchanged.

Verification:

- Added a renderer regression test for compact visible ledger commands, full
  title text, and HTML escaping.
- `npm test -- tests/renderers/html-replay.test.ts` passed: 1 file / 6 tests.
- Dogfooded a harmless long passing `agentflight verify` command and regenerated
  replay: the long ledger command rendered compactly, the full command was
  escaped in `title`, and the passing stderr excerpt stayed tucked in details.
- Adjacent bug pass with HTML replay, Markdown report, evidence output, and
  Review Intelligence tests passed: 4 files / 54 tests.
- `npm run verify` passed: 20 files / 147 tests, plus typecheck, lint, and
  build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found 0 vulnerabilities.
- `npx projscan@latest doctor --format json` passed with score 100/A.
- ProjScan preflight/review kept the existing accumulated branch-scale manual
  signoff caution: 86 changed files and max changed-file risk score 188.6, with
  no concrete cycle, risky-function, dependency, contract, taint, or dataflow
  blockers reported.
- `npx agentloopkit@latest verify` passed.

## 2026-06-20

### Centralized Proof-Gap Rules

Maintainability finding:

- Review Intelligence proof-gap rules were repeated inline in
  `buildProofGaps`, making future command-preference changes easy to misorder.

Implemented locally:

- Moved category proof-gap rules into one ordered `categoryProofGapRules` table.
- Kept readiness, scoring, proof-gap IDs, messages, and command preferences
  unchanged.

Verification:

- `npm test -- tests/core/review-intelligence.test.ts` passed: 1 file / 18
  tests.

### Proof Command Preference

Dogfood finding:

- When source and test files changed together, the first handoff action could
  suggest `npm run typecheck` even though `npm test` would clear more review
  uncertainty.

Implemented locally:

- Review Intelligence now honors the proof-kind preference order defined by
  each proof-gap rule when choosing a suggested command.
- Source proof gaps prefer `test`, then `typecheck`, then `build`.
- Dependency proof gaps now prefer install/build-style proof before typecheck
  when those commands are configured.

Verification:

- `npm test -- tests/core/review-intelligence.test.ts tests/commands/evidence-output.test.ts`
  passed: 2 files / 42 tests.

### Handoff No-Verification Copy

Dogfood finding:

- A handoff with zero verification runs said `No failed verification excerpts
recorded`, which is technically true but hides the actual missing-proof
  state.

Implemented locally:

- Handoff verification details now show `No verification runs recorded.` when
  no verification has run.
- Passing handoffs with verification evidence still show that no failed
  excerpts were recorded.
- Failed handoffs still show stderr-preferred excerpts.

Verification:

- `npm test -- tests/commands/evidence-output.test.ts` passed: 1 file / 23
  tests.

### Repo-Relative Artifact Path Output

Persona readout:

- Security Reviewer: shareable handoff text should avoid leaking local usernames
  or workspace folder names.
- Docs and DX Writer: repo-relative `.agentflight/...` paths are easier to read
  and copy.
- CLI Engineer: command return values should stay absolute for callers that
  open the generated files programmatically.

Implemented locally:

- Start, report, replay, and handoff terminal output now display generated
  `.agentflight/...` artifact paths relative to the repository.
- Command result fields still return the absolute file paths used by local tests
  and programmatic callers.

Verification:

- `npm test -- tests/commands/workflow.test.ts tests/commands/evidence-output.test.ts`
  passed: 2 files / 27 tests.

### Handoff Missing-Proof Gate

Persona readout:

- Product Maintainer: the local handoff should not sound share-ready when
  Review Intelligence says proof is missing.
- CLI Engineer: the handoff exit code should be a trustworthy local readiness
  gate for scripts.
- Docs and DX Writer: missing-proof handoffs should point to the report first,
  not the replay, because the report is the fastest fix list.
- Security Reviewer: keep the command local-only and avoid automatic posting or
  hidden upload behavior.

Implemented locally:

- `agentflight handoff` now treats any non-ready Review Intelligence state as a
  non-zero handoff result.
- Missing-proof handoffs use `Fix before sharing`, retain the suggested
  `agentflight verify -- ...` command, and point users to the report first.
- Ready handoffs still exit `0` and open replay first. Failed verification
  handoffs still show stderr-preferred excerpts and open report first.

Verification:

- `npm test -- tests/commands/evidence-output.test.ts` passed: 1 file / 23
  tests.

### AgentLoopKit Linked-State Polish

Dogfood finding:

- After `agentflight start` stopped creating AgentLoopKit task contracts
  automatically, the terminal and report tooling rows still showed only
  AgentLoopKit availability. That hid whether an active task was actually
  linked.
- One stale diagnostic path still used task-creation wording, which no longer
  matches the product behavior.

Implemented locally:

- Shared tooling output now shows concise AgentLoopKit task state when known:
  `active task linked` or `no active task linked`.
- AgentLoopKit task-link diagnostics now use generic link-check wording instead
  of stale automatic task-creation wording.

Verification:

- `npm test -- tests/commands/workflow.test.ts tests/renderers/markdown-report.test.ts`
  passed: 2 files / 10 tests.

### Local Handoff Research And Worktree Cleanup

Research synthesis:

- Persona review found that AgentFlight's next usefulness gap was not another
  distribution surface. It was a single local end-of-session handoff loop.
- First-time developers need one command that tells them what to do after
  verification.
- Reviewers need a clear "open this first" artifact pointer rather than a list
  of unrelated outputs.
- Security and release personas require the workflow to stay local-only, with no
  hidden network calls, telemetry, cloud upload, or automatic PR posting.

Implemented locally:

- Added `agentflight handoff` as a local-only command that composes existing
  status, report, replay, and resume behavior.
- The handoff summary writes `.agentflight/current/handoff.md`, points to the
  generated report/replay/resume artifacts, and shows readiness, changed-file
  count, risk, review focus, proof gaps, and failed verification excerpts.
- Blocked handoffs exit non-zero when failed verification blocks review.
- Raw stdout/stderr evidence remains preserved.

Verification:

- `npm test -- tests/commands/evidence-output.test.ts tests/commands/workflow.test.ts`
  passed: 2 files / 22 tests.
- `npm run verify` passed: typecheck, lint, 19 test files / 123 tests, build.
- `npm run format:check` passed.
- Local built-CLI smoke passed for blocked handoff behavior.
- `npx --yes projscan@latest doctor --format json` passed with score `100` and
  grade `A`.
- `npx --yes projscan@latest review --format json` reported no concrete
  blockers: no cycles, risky functions, dependency changes, contract changes,
  taint flows, or dataflow risks. The remaining ProjScan result was a manual
  scale/risk caution caused by dirty local evidence and high-scoring touched
  modules.

## 2026-06-19

### v0.6.0 Local Review Ergonomics Release Pass

Release decision:

- The post-v0.5.1 work is a minor release, not a patch.
- New user-facing surfaces include replay navigation, named verification
  profiles, JSON status, compact report mode, local PR-comment draft mode,
  ProjScan review-hint enrichment hooks, and AgentLoopKit evidence filtering.
- The release remains local-first: no cloud, login, billing, telemetry, hosted
  services, source upload, GitHub App, or automatic PR posting.

Implemented since v0.5.1:

- Improved replay navigation and review ergonomics for long evidence ledgers.
- Added first-run workspace hygiene guidance for `.agentflight/` runtime paths.
- Updated product positioning to "local-first review layer for AI coding
  sessions."
- Added optional ProjScan review hints to Review Intelligence without making
  Review Intelligence invoke ProjScan.
- Added config-defined verification profiles for repeated local command groups.
- Added compact Markdown report mode.
- Added local PR-comment draft report mode; it writes a local artifact only.
- Added `agentflight status --format json`.
- Filtered local AgentLoopKit evidence paths from AgentFlight changed-file
  surfaces while keeping task contracts, policies, harness files, and gates
  visible.
- Refactored verification/profile handling and ProjScan hint normalization into
  smaller helpers after ProjScan flagged high-complexity functions.

Release verification plan:

```bash
npm test -- tests/commands/verify.test.ts tests/commands/evidence-output.test.ts tests/core/review-intelligence.test.ts
npm run verify
npm run format:check
npm pack --dry-run
npm audit --audit-level=moderate
npx --yes projscan@latest doctor --format json
npx --yes projscan@latest preflight --mode before_commit --format json
npx --yes projscan@latest review --format json
npx --yes agentloopkit@latest verify
```

Manual sign-off expectation:

- ProjScan is expected to return a scale/release-signoff caution because the
  accumulated v0.6.0 handoff is large.
- The release should not proceed if ProjScan reports concrete blockers such as
  dependency changes, contract changes, risky functions, cycles, taint flows, or
  dataflow risks.

Pre-release verification results:

- `npm test -- tests/commands/verify.test.ts tests/commands/evidence-output.test.ts tests/core/review-intelligence.test.ts`
  passed: 3 files / 43 tests.
- `npm run verify` passed: typecheck, lint, 19 test files / 121 tests, build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx --yes agentloopkit@latest verify` passed.
- `npx --yes projscan@latest doctor --format json` passed with score `100` and
  grade `A`.
- `npx --yes projscan@latest preflight --mode before_commit --format json`
  returned `caution`: `111` changed files exceeded the threshold of `50`, and
  maximum changed-file risk score was `172.7`.
- `npx --yes projscan@latest review --format json` reported no risky functions,
  no new cycles, no dependency changes, no contract changes, no new taint flows,
  and no new dataflow risks.
- Manual sign-off accepted the ProjScan result as a release-scale caution, not
  a concrete blocker.

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
