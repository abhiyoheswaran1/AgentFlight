# Changelog

All notable AgentFlight changes are documented here.

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
