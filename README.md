# AgentFlight

See what your coding agent did. Prove it works. Know what to do next.

AgentFlight is a local-first flight recorder for AI coding agents from Baseframe Labs. It records AI-assisted coding sessions, explains what changed, highlights risk, captures proof gaps, generates replay artifacts, and produces a clean handoff for the next agent or human reviewer.

AgentFlight is not another coding agent. It is the trust, observability, replay, and proof layer around tools like Codex, Claude Code, Cursor, Windsurf, Gemini CLI, Aider, OpenCode, and similar coding agents.

## Why AgentFlight Exists

AI coding agents can move quickly, but developers still need to answer practical review questions:

- What changed?
- Which files are risky?
- What proof exists?
- What proof is missing?
- What should the next agent or reviewer do?

AgentFlight makes those answers local, inspectable, and repeatable without uploading source code or adding cloud infrastructure.

## How It Works

AgentFlight creates a local `.agentflight/` directory in your repo:

- `config.json` stores local-first project settings.
- `sessions/` stores session metadata.
- `current/` stores the active session, handoff, and resume prompt.
- `reports/` stores Markdown proof reports and HTML replays.

Reports include filenames and summaries by default, not full source diffs. AgentFlight does not collect telemetry and does not upload source code.

## Quick Start

```bash
npm install
npm run build
npx agentflight init
npx agentflight start --task "Add example feature"
npx agentflight status
npx agentflight report
npx agentflight replay
npx agentflight resume
npx agentflight doctor
```

During local development of this repo, use:

```bash
npm run agentflight -- init
npm run agentflight -- start --task "Add example feature"
```

## Commands

- `agentflight init` initializes `.agentflight/` with safe writes.
- `agentflight start --task "..."` starts a session and writes the current handoff.
- `agentflight status` summarizes changed files, risk, verification status, and next action.
- `agentflight report` generates a Markdown proof report.
- `agentflight replay` generates a local self-contained HTML replay.
- `agentflight resume` prints and saves a Codex/Claude-ready continuation prompt.
- `agentflight doctor` checks local setup, scripts, tools, config, and current session state.

Future placeholders exist for `upgrade`, `license`, and `login`; AgentFlight Pro/Team is not available yet.

## Example Workflow With Codex Or Claude Code

```bash
agentflight init
agentflight start --task "Add password reset flow"

# Run Codex, Claude Code, Cursor, or another coding agent normally.

agentflight status
npm run typecheck
npm test
agentflight report
agentflight replay
agentflight resume
```

Use the generated report for review and the resume prompt when handing the work to another agent or human.

## Powered By ProjScan And AgentLoopKit

AgentFlight is powered by two open engines from Baseframe Labs:

- ProjScan provides repo intelligence, risk analysis, codebase understanding, and preflight signals.
- AgentLoopKit provides task discipline, verification evidence, policies, and handoffs.

This repository dogfoods both tools from day one. See [docs/development/dogfooding.md](docs/development/dogfooding.md).

Strategic architecture:

- ProjScan: repo intelligence engine
- AgentLoopKit: agent workflow discipline engine
- AgentFlight: commercial and user-facing experience layer

## Local-First And Privacy

AgentFlight runs locally. It does not add telemetry, login, billing, cloud sync, or source upload. The MVP reads git status and package metadata, writes human-readable local artifacts, and calls local or `npx` ProjScan/AgentLoopKit commands with graceful fallbacks.

Runtime session data is ignored by git by default:

- `.agentflight/sessions/`
- `.agentflight/reports/`
- `.agentflight/current/`

`.agentflight/config.json` is intentionally not ignored, so a project can commit its local AgentFlight defaults if that is useful.

## Current Status

AgentFlight is in MVP development at `0.1.0`.

Implemented:

- TypeScript ESM npm CLI package
- Safe local initialization
- Session start and current handoff
- Status risk summary
- Markdown proof reports
- Self-contained HTML replay
- Resume prompt generation
- Doctor checks
- Defensive ProjScan and AgentLoopKit adapters
- Vitest coverage for core behavior, renderers, adapters, and command workflow

Not implemented:

- Cloud sync
- Login
- Billing
- GitHub App
- Team dashboards
- Paid feature gates

## Roadmap

See [docs/roadmap.md](docs/roadmap.md).

## Releases

AgentFlight uses npm Trusted Publishing from GitHub Actions for tagged releases. Pushes and pull requests run verification; npm publishes happen from `v*.*.*` tags.

See [docs/development/release.md](docs/development/release.md) and [CHANGELOG.md](CHANGELOG.md).

## Contributing

Use the local verification loop before opening changes:

```bash
npm run verify
```

Keep changes scoped, local-first, and honest about proof. Do not claim tests passed unless they actually ran and passed.

## License

Apache-2.0. See [LICENSE](LICENSE).
