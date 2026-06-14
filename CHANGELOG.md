# Changelog

All notable AgentFlight changes are documented here.

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
