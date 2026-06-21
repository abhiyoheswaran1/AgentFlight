# Changelog

All notable AgentFlight changes are documented here.

## Unreleased

### Added

- Added `agentflight handoff`, a local-only review handoff command that generates the report, replay, and resume artifacts and summarizes readiness, proof gaps, review focus, and failed verification excerpts.
- Added `agentflight history`, a read-only local command for listing recent
  sessions, proof counts, the current-session marker, and existing report/replay
  artifact paths without search indexing, export, sync, or session switching.
- Documented the `agentflight history --limit 1` latest-action workflow for
  reopening local handoff/report/replay/resume artifacts.
- Added session-specific handoff artifacts under `.agentflight/reports/` so
  `agentflight history` can point to stable handoff packets from prior sessions.
- Added session-specific resume artifacts under `.agentflight/reports/` so
  `agentflight history` can point to stable continuation prompts from prior
  sessions.
- Added post-v0.6.0 user-research findings and a v0.6.0 website update prompt focused on the local handoff workflow.
- Added a post-v0.6.0 product direction note that keeps local handoff, first-run
  workspace hygiene, replay ergonomics, proof guidance, and explainable ranking
  as the priority order.

### Fixed

- `agentflight history` now prefers useful review-ready or blocked artifact
  metadata over later clean-worktree artifact metadata, while preserving
  clean-only session history.
- Clean-worktree `agentflight handoff` now preserves existing session review
  artifacts instead of overwriting report/replay/resume evidence with an empty
  post-commit clean-state artifact.
- Clean-worktree `agentflight handoff` now exits successfully instead of
  treating an informational post-commit handoff as a command failure.
- `agentflight doctor` now suggests concrete detected `agentflight verify -- ...`
  commands when config verification commands are empty.
- `agentflight verify` now suggests detected package proof commands when no
  explicit command is provided and config commands are empty.
- `agentflight doctor` now warns when package proof scripts exist but
  `.agentflight/config.json` has no configured verification commands.
- `agentflight history` now lists capped repo-relative malformed session paths
  instead of only reporting a skipped-file count.
- Concurrent `agentflight verify` runs now reserve distinct stdout/stderr
  evidence paths and merge verification updates without dropping either run.
- `agentflight history --limit` now rejects non-integer, zero, and negative
  values with a clear local error instead of silently falling back or returning
  an empty history.
- Review Intelligence now treats an earlier failed verification as resolved when
  the same stored command later passes, so TDD red/green and format-fix loops do
  not leave handoffs permanently blocked.
- Status, report, replay, and handoff now distinguish unresolved failed
  verification from historical failed runs that later passed.
- Resume prompts now use the same unresolved-versus-resolved verification count
  wording as the other review surfaces.
- Clean-worktree status now points users to `agentflight history --limit 1` to
  reopen the latest local artifacts before starting the next session.
- History now shows unresolved-versus-resolved failed verification counts for
  prior sessions.
- History now includes stable handoff artifact paths alongside report and
  replay paths when those artifacts exist.
- History now includes stable resume artifact paths when those artifacts exist.
- History now suggests which existing local artifact to open first for each
  session.
- History now surfaces the newest session's open-first action before the full
  session list, reducing scan work in long local histories.
- History now tells users to run `agentflight handoff` when the latest local
  session is current but no handoff/report/replay artifact exists yet.
- History now shows the latest session's recorded readiness in the top-level
  `Latest action:` block.
- History now says `Open first: none yet` when no handoff, report, or replay
  artifact exists.
- HTML replay now reserves urgent failed-run navigation for unresolved failed
  verification while keeping historical failed runs visible in the ledger.
- Ready handoffs no longer inline historical failed verification excerpts once
  no unresolved failed-verification proof gap remains; those excerpts stay in
  report/replay evidence.
- `agentflight start` now treats AgentLoopKit's `Active task: none pinned.`
  status as no active task instead of falsely reporting task reuse.
- AgentLoopKit task-link diagnostics now use generic link-check wording instead
  of stale automatic task-creation copy.
- `agentflight init` now reports ProjScan and AgentLoopKit CLI availability
  using the same concise tool formatter as start/report surfaces instead of
  relying on repo marker files.
- `agentflight status` now reports a clean worktree explicitly instead of
  calling zero changed files `Unknown` after a completed session has been
  committed.
- `agentflight status` now compacts very long terminal verification run lists
  while keeping full verification runs in JSON, report/replay, and local
  evidence files.
- Clean-worktree `agentflight status` now tucks individual verification run
  details when there are no unresolved failed runs, while keeping counts and
  JSON evidence complete.
- Review Intelligence now treats incomplete verification attempts as blocking
  before clean-worktree readiness, so live status cannot call a session clean
  while verification is still in progress.
- `agentflight init` now lists created and skipped files by repo-relative path
  instead of only showing counts.
- `agentflight doctor` now warns when `.projscan-memory/memory.json` exists
  without a matching project filter and reports OK once the repo filters it
  through `changedFileFilters.ignore`.
- `agentflight history` now labels stored review metadata as
  `Recorded readiness:` so it is not confused with live worktree readiness.
- `agentflight doctor` no longer prints the absolute repository root in the
  successful repository-root check.
- HTML replay now labels resolved failed verification rows as historical when
  no unresolved failed runs remain.
- `agentflight doctor` now treats a missing current session as OK first-run
  guidance instead of warning when the rest of the local setup is healthy.
- Clean-worktree status now reports `Risk: none` instead of `Risk: unknown`
  while preserving `unknown` for legacy or genuinely missing metadata.
- Clean-worktree risk reasons now use current-state wording instead of saying
  no changed files were detected "yet."
- Parallel report, replay, and resume commands now preserve each artifact event
  in session history instead of letting the last stale session write win.
- Review Intelligence no longer lets ProjScan risk hints boost generated
  `.projscan-memory/memory.json` above real first-run review targets, while the
  file remains visible with the existing `changedFileFilters.ignore` guidance.
- `agentflight history` now includes the selected local artifact path directly
  on the `Open first:` line, reducing lookup work in long session lists.
- `agentflight handoff` now includes the selected report or replay path directly
  on the `Open first:` line while preserving the full artifact list.

### Changed

- Current product copy now uses `coding agent sessions` and agentic engineering
  language instead of assistant-style positioning.
- Idempotent `agentflight init` now shows a concrete detected proof command
  when existing config verification commands are empty.
- First-run `agentflight init` now points seeded configs at no-arg
  `agentflight verify` in the primary workflow.
- `agentflight init` now points first-run users through the handoff golden path:
  start a session, capture verification, then generate a local handoff, with
  status and doctor listed as supporting checks.
- `agentflight init` now uses the first detected verification command in its
  primary workflow guidance, falling back to `<proof command>` when no proof
  script is detected.
- Newly generated `.agentflight/config.json` files now seed detected
  verification commands from package scripts while leaving profiles empty and
  preserving existing configs.
- README and verification docs now describe the handoff-first first-run workflow
  and init-seeded verification commands.
- Kept ready-review report, replay, resume, examples, and demo copy aligned with
  the `agentflight handoff` golden path while keeping report/replay/resume as
  supporting local artifacts.
- Changed-file review surfaces now fail with an actionable git-status error
  instead of treating git-status failures as an empty diff.
- Shortened the optional ProjScan baseline budget during `agentflight start` so
  busy local ProjScan work cannot stall session startup for too long.
- `agentflight start` now reuses an active AgentLoopKit task instead of creating
  a duplicate AgentFlight placeholder task.
- `agentflight start` now shows concise ProjScan and AgentLoopKit warning
  summaries when optional tooling is available but degraded.
- `agentflight start` now inspects ProjScan availability without running the
  heavier optional `projscan start` baseline on the startup path.
- `agentflight start` now uses lightweight AgentLoopKit availability inspection
  on the startup path while preserving task reuse/linking.
- `agentflight start` now reuses AgentLoopKit's local active-task state file
  directly instead of parsing `agentloopkit status` output.
- `agentflight start` now links existing AgentLoopKit task state without
  creating new AgentLoopKit task contracts automatically.
- Start output and Markdown tooling rows now show whether AgentLoopKit has an
  active task linked when that local state is known.
- `agentflight handoff` now treats missing required proof as not ready to share:
  it exits non-zero, uses `Fix before sharing`, and points users to the report
  first.
- Start, report, replay, and handoff terminal output now display local
  `.agentflight/...` artifact paths relative to the repo instead of absolute
  user-directory paths.
- Handoff verification details now distinguish zero verification runs from
  passing runs that simply have no failed excerpts.
- Review Intelligence suggested proof now follows each proof gap's preferred
  proof-kind order, so source gaps prefer `npm test` when available and
  dependency gaps prefer build/install-style proof before typecheck.
- Review Intelligence proof-gap rules are now centralized in one ordered table
  to keep future proof guidance changes easier to review.
- HTML replay verification ledgers now display long run commands compactly while
  keeping the full command available in the title text.
- Status and Markdown report verification evidence rows now use compact display
  labels for long run commands while preserving stored command evidence.
- `agentflight init` now writes `.agentflight/.gitignore` for runtime evidence
  directories instead of seeding new runtime `.gitkeep` files, reducing
  first-run Git noise while keeping `.agentflight/config.json` and the local
  AgentFlight ignore file visible as project config.
- AgentFlight session JSON writes now use same-directory temp files and atomic
  rename so concurrent report, replay, resume, and handoff commands do not read
  partially written session state.
- Review Intelligence now describes `.projscan-memory/memory.json` as generated
  tool state instead of arbitrary unknown code while keeping the file visible.
- Report and replay generation now persist a compact local readiness summary in
  session events, letting `agentflight history` show the latest recorded
  readiness without recalculating old sessions.

## AgentFlight v0.6.0 - 2026-06-19

Local review ergonomics and automation surfaces for heavier real-world dogfood.

### Added

- Replay navigation for long HTML evidence ledgers, including jump links, section anchors, failed-run anchors, and a shortcut to the first failed verification run.
- Local JSON status output with `agentflight status --format json` for scripts that need structured session, risk, verification, and Review Intelligence state.
- Named verification profiles with `agentflight verify --profile <name>` for local command groups stored in `.agentflight/config.json`.
- Markdown report modes:
  - `agentflight report --mode compact` for shorter local review summaries.
  - `agentflight report --mode pr-comment` for a local PR-comment draft that is never posted automatically.
- Optional typed ProjScan review hints for deterministic Review Intelligence ranking enrichment without making Review Intelligence call ProjScan directly.
- First-run guidance that explains which `.agentflight/` paths are runtime evidence and which files are project config.

### Changed

- Clarified first-run workspace hygiene docs: `.projscan-memory/**` can be added
  to `changedFileFilters.ignore` when ProjScan memory is generated evidence
  rather than a review target.
- Lowered generated ProjScan memory priority in Review Intelligence so
  `.projscan-memory/memory.json` remains visible but no longer outranks real
  first-run review targets such as `.agentflight/config.json` or docs changes.
- Classified first-party TypeScript/JavaScript source files under `src/` as
  source changes so review focus gives clearer guidance and proof gaps than the
  previous unknown-file fallback.
- Aligned ready-review next actions with the handoff golden path: status,
  report, replay, and resume now point users toward `agentflight handoff`, while
  the handoff artifact itself tells users to share the generated local packet.

- AgentFlight now describes itself as a local-first review layer for coding agent sessions across package metadata, README, and product docs.
- Long suggested proof commands stay compact in high-density review surfaces while preserving the full suggested action where useful.
- Local AgentLoopKit evidence paths are filtered from AgentFlight changed-file review surfaces:
  - `.agentloop/state.json`
  - `.agentloop/reports/**`
  - `.agentloop/handoffs/**`
  - `.agentloop/runs/**`
- AgentLoopKit task contracts, policies, harness files, and gates remain visible for review.
- `.projscan-memory/**` remains suggestion-only guidance, not a built-in ignored path.

### Fixed

- Reduced Review Intelligence and report noise caused by generated local workflow evidence.
- Split complex verification/profile and ProjScan-hint logic into smaller helpers without changing command behavior.
- Added regression coverage for PR-comment draft failure excerpts so stderr-preferred excerpts stay aligned with report/replay behavior.

### Verification

- `npm run verify` passed.
- `npm run format:check` passed.
- `npm pack --dry-run` passed.
- `npm audit --audit-level=moderate` found 0 vulnerabilities.
- AgentLoopKit verification passed.
- ProjScan doctor passed with score 100/A.
- ProjScan preflight/review returned a documented manual release-signoff caution for scale risk only, with no concrete blockers.

## AgentFlight v0.5.1 - 2026-06-17

Focused dogfood patch for v0.5.0 review artifacts.

### Fixed

- Terminal `agentflight verify` now uses the same stderr-preferred failure excerpt as report/replay artifacts.
- Raw stdout/stderr evidence remains preserved.
- Reduced noisy AgentLoopKit Tooling diagnostics in Markdown reports.

### Changed

- Trimmed long suggested proof commands in status, report, replay, and resume surfaces.
- Added shared output display helpers for compact proof commands and concise tool-report lines.
- Kept `.projscan-memory/**` as suggestion-only guidance, not a built-in ignored path.

### Verification

- `npm run verify` passed.
- `npm run format:check` passed.
- `npm pack --dry-run` passed.
- `npm audit --audit-level=moderate` found 0 vulnerabilities.
- AgentLoopKit verification passed.
- ProjScan doctor passed with score 100/A.
- ProjScan preflight/review returned a documented manual release-signoff caution for scale risk only, with no concrete blockers.

## [0.5.0] - 2026-06-16

Inline verification evidence and replay accessibility.

### Added

- `agentflight verify` captures a short output excerpt (stderr preferred, otherwise stdout) at run time and stores it on the verification run.
- The replay shows the excerpt inline for failed runs, so a reviewer can see what broke without opening the evidence file. Passing runs keep the excerpt tucked inside the evidence details to stay calm.
- The Markdown proof report includes the failure excerpt as a fenced block for failed runs.

### Changed

- Replay readout band now sticks to the top so risk and readiness stay visible while scrolling long records.
- Raised contrast on muted replay text and risk colors to meet WCAG AA for small text.

### Added (replay)

- Print stylesheet for clean PDF handoffs and incident reconstruction: expands evidence, avoids mid-record page breaks, and preserves risk and readiness color.

### Verification

- `npm run verify` passed.
- `npm run format:check` passed.

## [0.4.2] - 2026-06-16

Replay UI redesign and refreshed product demos.

### Changed

- Redesigned the HTML replay artifact as a flight-record evidence ledger: a verdict-led masthead where review readiness is the lead signal, an instrument-style readout band in place of the metric-card grid, a log-spine timeline whose event nodes encode type by shape and fill, and a verification ledger with explicit `PASS`/`FAIL` stamps.
- The replay now stays calm by default and applies semantic color only when risk is elevated or proof is failing, and never relies on color alone.
- Updated ProjScan to 4.5.0 and AgentLoopKit to 0.35.2.

### Added

- Reproducible demo-asset pipeline: `npm run demo:assets` regenerates the replay screenshot and scroll GIF (Playwright) and the terminal workflow GIF (VHS) from `scripts/demo/` and `docs/marketing/`.
- Refreshed README with the new terminal workflow GIF and an animated replay walkthrough.

### Verification

- `npm run verify` passed.
- `npm run format:check` passed.

## [0.4.1] - 2026-06-15

Review Intelligence trust patch focused on v0.4.0 dogfood findings.

### Fixed

- Detect incomplete verification attempts when a `verification_started` event has no later completed result.
- Incomplete verification now appears as a blocking Review Intelligence proof gap and prevents `Ready for review`.
- Report output no longer shows legacy verification-gap text that conflicts with Review Intelligence proof gaps.
- `.agentflight/config.json` is classified as AgentFlight project config instead of generic `unknown`.

### Changed

- `agentflight verify` emits a minimal heartbeat while long-running verification commands are still active.
- `.projscan-memory/memory.json` now triggers an informational suggestion to add `.projscan-memory/**` to `changedFileFilters.ignore` without hardcoding that path as a built-in ignore.

### Documentation

- Documented incomplete verification handling, heartbeat output, and optional ProjScan memory filters.
- Updated v0.4.0 dogfood findings with v0.4.1 patch candidate status.

### Verification

- `npm run verify` passed.
- `npm run format:check` passed.
- `npm pack --dry-run` passed.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- AgentLoopKit verification passed.
- ProjScan doctor passed with health `100/100`.
- ProjScan preflight returned `proceed` with no caution.
- Local packed-package smoke test passed.

## [0.4.0] - 2026-06-14

### Added

- Added deterministic Review Intelligence for coding agent sessions.
- Added review focus ranking to highlight the files developers should inspect first.
- Added proof gap detection for missing or failed verification evidence.
- Added clearer readiness states and next-best-action guidance.
- Added config-driven generated/internal changed-file filters via `changedFileFilters.ignore`.
- Added documentation for generated/internal file filters.
- Added completion audit for v0.4.0.

### Changed

- `status`, `report`, `replay`, `resume`, and `snapshot` now include review intelligence where appropriate.
- Updated replay UI screenshot to show review focus, proof gaps, readiness, and timeline.
- Hardened malformed `changedFileFilters.ignore` handling.
- Kept `.agentflight/config.json` visible while runtime `.agentflight/` artifacts remain filtered.

### Deferred

- PR comments.
- JSON/CI integration.
- ProjScan-enriched ranking.
- Heartbeat/progress output for long verification.
- Interrupted verification cleanup.
- Tool availability messaging alignment.
- Cloud/login/billing/Pro/Team/GitHub App.

### Verification

- `npm run verify` passed.
- `npm run format:check` passed.
- `npm pack --dry-run` passed.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- AgentLoopKit verification passed.
- ProjScan doctor passed with health `100/100`.
- ProjScan preflight returned a documented scale/complexity caution that was manually reviewed and accepted.

## [0.3.3] - 2026-06-14

Patch candidate focused on dogfood findings from published `agentflight@latest` v0.3.2.

### Changed

- Improved HTML replay readability with a calmer developer-review layout, clearer timeline rows, cleaner file grouping, and denser verification evidence rows.
- Moved replay stdout/stderr evidence paths into collapsed native details so proof stays available without dominating the page.

### Fixed

- Excluded AgentFlight runtime artifacts from changed-file analysis by default:
  - `.agentflight/sessions/**`
  - `.agentflight/reports/**`
  - `.agentflight/current/**`
  - `.agentflight/evidence/**`
- Kept `.agentflight/config.json` visible in changed-file analysis because it is user-controlled project configuration, not runtime evidence.

### Documentation

- Added `PRODUCT.md` with the confirmed product UI direction: precise, calm, trustworthy.
- Added `docs/development/v0.3.2-dogfood-findings.md` with dogfood results from AgentFlight, ProjScan, and fifa-predictor.
- Updated the development log with dogfood, UI polish, and patch verification evidence.

## [0.3.2] - 2026-06-13

### Changed

- Added the official AgentFlight logo to the README.
- Added the Baseframe Labs AgentFlight website link near the top of the README.
- Added an animated CLI workflow preview before the 60-second workflow.
- Added a "Watch The Flow" section explaining start -> verify -> snapshot -> status -> report/replay/resume.
- Updated package homepage to the AgentFlight website page.
- Expanded packaged assets so npm README logo and animation references resolve.

### Documentation

- Updated launch notes with the AgentFlight logo reference.
- Updated development log with branding and README animation verification.

### Verification

- `npm run verify` passed.
- `npm run format:check` passed.
- `npm pack --dry-run` passed.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- ProjScan preflight passed.
- AgentLoopKit verification passed.

## [0.3.1] - 2026-06-13

### Changed

- Reworked the README around a clearer 60-second AgentFlight workflow.
- Added sample CLI output for status, report, replay, and resume.
- Added a replay timeline screenshot to make the v0.3.0 experience easier to understand.
- Added a basic example session walkthrough and v0.3.0 launch-note drafts.
- Improved npm keywords and package metadata.
- Narrowed packaged files to include useful README-linked docs/assets without shipping marketing drafts.

### Documentation

- Added launch notes draft for v0.3.0 public/demo positioning.
- Updated development log with post-v0.3.0 polish verification.

### Verification

- `npm run verify` passed.
- `npm run format:check` passed.
- `npm pack --dry-run` passed.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- ProjScan preflight passed.
- AgentLoopKit verification passed.

## [0.3.0] - 2026-06-13

AgentFlight now records session events and snapshots so reports and replays show how a coding session evolved.

### Added

- Added `agentflight snapshot --note "..."` to record a local checkpoint for the active session.
- Added session-level `events` with backward compatibility for older sessions.
- Added event recording for session start, verification attempts, snapshots, report generation, replay generation, resume prompt generation, and doctor runs.
- Added timeline sections to Markdown reports and HTML replays.
- Added latest snapshot context to status and resume prompts.
- Added changed-file groups to replay output.
- Added tests for session events, snapshot creation, missing active sessions, timeline rendering, older session compatibility, and verification events.

### Changed

- Replays now feel more like flight recorder timelines instead of final-state summaries.
- Reports now include a concise event timeline before changed files and proof evidence.
- Resume prompts now include latest snapshot notes and current verification state.

### Verification

- `npm run verify` passed.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.3.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- ProjScan preflight passed with health `100/100`.
- AgentLoopKit verification passed.

## [0.2.1] - 2026-06-13

Patch release candidate focused on friction found while dogfooding the v0.2.0 core workflow.

### Changed

- `agentflight verify` now prints the stdout and stderr evidence paths immediately after each recorded run.
- Failed verification output and downstream next actions now include the exact command to rerun.
- `agentflight report`, `agentflight replay`, and `agentflight resume` now avoid stale "generate a report" next actions once proof is ready.
- HTML replays now include a compact summary strip for risk, changed files, proof counts, and review readiness.
- AgentLoopKit workflow files under `.agentloop/` are treated as low-risk dogfooding artifacts instead of unknown code changes.

### Fixed

- ProjScan and AgentLoopKit adapters now prefer repo-local `node_modules/.bin` binaries before PATH-global commands, preventing stale global versions from appearing in reports.
- Tool adapter version output is normalized when CLIs include decorated version text.

### Verification

- Targeted v0.2.1 regression tests passed.
- `npm run verify` passed.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.2.1`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- ProjScan preflight passed with health `100/100`.
- AgentLoopKit verification passed.

## [0.2.0] - 2026-06-13

AgentFlight now captures real verification evidence and uses it across status, report, replay, and resume.

### Added

- Added `agentflight verify` to run verification commands and capture local evidence.
- Added verification run persistence in session records, including command, timestamps, duration, exit code, status, stdout path, and stderr path.
- Added `.agentflight/evidence/` for local stdout/stderr artifacts.
- Added evidence-aware status, report, replay, and resume outputs.
- Added tests for verification success, failure, persistence, evidence-aware outputs, and v0.1 session compatibility.

### Changed

- `agentflight status` now reports changed areas, proof gaps, review readiness, and a next action based on captured evidence.
- `agentflight report` now includes verification evidence and honest review recommendations.
- `agentflight replay` now renders verification cards in the local HTML artifact.
- `agentflight resume` now includes verification gaps, the exact next command, and stronger continuation guardrails.

### Fixed

- `agentflight doctor` now checks write permission for `.agentflight/`, not just path existence.
- `agentflight --version` now reports the package version instead of the stale `0.1.0` value.

### Verification

- `npm run verify` passed.
- `npm run format:check` passed.
- `npm pack --dry-run` passed.
- `npm audit --audit-level=moderate` found 0 vulnerabilities.
- ProjScan preflight passed.
- AgentLoopKit verification passed.

## [0.1.1] - 2026-06-13

### Fixed

- Fixed npm `.bin` symlink invocation so `npx agentflight --help` runs the CLI instead of exiting silently.

### Added

- Added CI verification on pushes and pull requests.
- Added tag-based npm publishing through GitHub Actions Trusted Publishing.
- Added release process documentation.

## [0.1.0] - 2026-06-13

### Added

- First AgentFlight MVP CLI.
- Added `init`, `start`, `status`, `report`, `replay`, `resume`, and `doctor` commands.
- Added local `.agentflight/` config, session, report, replay, and resume prompt artifacts.
- Added ProjScan and AgentLoopKit adapters with graceful fallbacks.
- Added TypeScript, Vitest, ESLint, Prettier, and npm package setup.
- Added README, architecture docs, dogfooding docs, verification docs, roadmap, and monetisation notes.
