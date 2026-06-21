# Architecture Overview

AgentFlight is a local-first TypeScript npm CLI. It wraps coding agent sessions with session metadata, changed-file risk summaries, source-free proof freshness checks, proof reports, HTML replays, and resume prompts.

## Layers

- `src/cli.ts` wires terminal commands with `commander`.
- `src/commands/` contains command handlers with testable inputs and outputs.
- `src/core/` contains deterministic project logic: safe writes, config, sessions, git, risk, verification detection, proof snapshots, doctor checks, paths, and process execution.
- `src/adapters/` contains defensive ProjScan and AgentLoopKit integration.
- `src/renderers/` creates Markdown, HTML, and resume prompt artifacts.
- `src/types/` contains shared public shapes.

## Local Data Model

AgentFlight writes under `.agentflight/`:

- `config.json`: project-level local defaults. This file is intentionally not gitignored.
- `sessions/`: immutable session metadata JSON. Gitignored.
- `reports/`: Markdown reports and HTML replays. Gitignored.
- `current/`: current session pointer, handoff, and resume prompt. Gitignored.

Verification runs store stdout/stderr evidence paths plus a source-free proof
snapshot of the changed files at proof time. A proof snapshot stores
repo-relative paths, file state, size, and SHA-256 hashes, not source text.
Review surfaces compare that snapshot with the current changed-file snapshot to
mark proof as current or stale.

## Safety Defaults

- No telemetry.
- No cloud upload.
- No source code diffs in default reports.
- No source text in proof freshness snapshots.
- Safe writes for initialization.
- Child processes use argument arrays through `execFile`, not shell interpolation.
- ProjScan and AgentLoopKit failures do not crash core AgentFlight flows unless the command itself cannot continue.

## Extension Points

Future Pro, Team, and Enterprise functionality should build on these seams:

- Report renderer variants in `src/renderers/`.
- Policy and verification enrichment through `src/adapters/agentloopkit.ts`.
- Risk enrichment through `src/adapters/projscan.ts`; Review Intelligence accepts optional typed ProjScan review hints, but it does not call ProjScan directly.
- Structured local command results; `status --format json` is the first supported JSON surface.
- Local session history indexing without changing session files.

Do not add cloud, auth, billing, or GitHub App behavior to the MVP.
