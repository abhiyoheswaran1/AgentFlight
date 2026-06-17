# Changelog

All notable AgentFlight changes are documented here.

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

- Added deterministic Review Intelligence for AI coding sessions.
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
