# Changelog

All notable AgentFlight changes are documented here.

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
