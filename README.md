# AgentFlight

<p align="center">
  <a href="https://www.baseframelabs.com/apps/agentflight">
    <img src="docs/agentflight_logo/icon.svg" alt="AgentFlight logo" width="112" />
  </a>
</p>

See what your coding agent did, what failed, and whether the work is ready for review.

AgentFlight is a local-first review layer for AI coding sessions from Baseframe Labs. It records what your coding agent did, captures verification evidence, shows failure excerpts, and tells you what needs review before you trust the result.

Website: [baseframelabs.com/apps/agentflight](https://www.baseframelabs.com/apps/agentflight)

AgentFlight helps you:

- start an AI coding session
- capture verification evidence
- see changed files and risk
- create snapshots during the session
- generate a proof report
- generate a local replay timeline
- generate a local review handoff
- create a resume prompt for the next agent or reviewer

![AgentFlight CLI workflow: start, verify, status, and replay](docs/assets/agentflight-terminal-demo.gif)

## 60-Second Workflow

```bash
npx agentflight@latest init
npx agentflight@latest start --task "Add password reset flow"

# Run Codex, Claude Code, Cursor, or your coding agent normally

npx agentflight@latest verify -- npm test
npx agentflight@latest snapshot --note "Initial implementation verified"
npx agentflight@latest status
npx agentflight@latest handoff
```

What you get:

- `init` creates local `.agentflight/` project files.
- `start` records the task, git branch, commit, dirty state, package manager, and tool availability.
- `verify -- npm test` runs the command and stores stdout, stderr, exit code, timing, and pass/fail status.
- `snapshot --note "..."` records the current git, risk, and proof state as a timeline event.
- `status` answers what changed, how risky it is, what proof exists, what proof is missing, and what to do next.
- `report` writes a Markdown proof report for review.
- `replay` writes a local HTML timeline you can open in a browser.
- `resume` writes a Codex/Claude-ready prompt for the next safe step.
- `handoff` generates the local review packet: readiness, proof gaps, failed excerpts, and report/replay/resume artifact paths.

## Watch The Flow

AgentFlight turns a loose AI-agent session into a local proof trail:

1. Start a session before you ask the coding agent to work.
2. Capture real verification output with `agentflight verify`.
3. Snapshot meaningful checkpoints.
4. Read `status` to see changed files, risk, proof, gaps, and next action.
5. Run `handoff` when the work is ready to review or when you need a clear fix-before-sharing summary.

The replay artifact is a self-contained local HTML file. It leads with the review verdict, then lays out risk, review focus, proof gaps, the session timeline, and verification evidence (with inline failure excerpts, so you can see what broke without opening a log file) as a readable flight record:

![AgentFlight replay: review verdict, risk, timeline, and verification evidence](docs/assets/agentflight-replay-scroll.gif)

A high-resolution still is also available at [`docs/assets/agentflight-replay-timeline.png`](docs/assets/agentflight-replay-timeline.png).

## Why This Exists

AI coding agents move fast. After a few prompts, you can lose track of:

- what changed
- whether the agent drifted from the task
- what was verified
- what failed
- what is safe to review
- how to resume the work later

AgentFlight gives you a local control room for that work. It records the session, captures proof, shows risk, and creates handoff artifacts without uploading source code.

## Sample Outputs

`agentflight status`:

```text
AgentFlight status

Task:
Add password reset flow

Changed files:
3

Risk: medium
- Dependency, backend, or unknown files changed.

Verification Evidence:
1 passed, 0 failed

Review first:
1. src/auth/reset.ts
   Why: identity/session path; no passing test evidence
   Focus: Check session, permission, and identity boundaries first.
   Suggested proof: npm test

Proof gaps:
- blocking: Sensitive auth, payment, or security files changed without passing test evidence.

Latest snapshot:
- Note: Initial implementation verified
- Risk: medium
- Changed files: 3

Readiness: Needs verification
Reason: Sensitive auth, payment, or security files changed without passing test evidence.

Next action:
Run agentflight verify -- npm test
```

`agentflight report`:

```text
# AgentFlight Proof Report

## Review First
1. src/auth/reset.ts
   - Why: identity/session path; no passing test evidence

## Verification Evidence
- passed: npm test
- stdout: .agentflight/evidence/.../verification-1.stdout.txt
- stderr: .agentflight/evidence/.../verification-1.stderr.txt

## Review Readiness
Needs verification
```

`agentflight replay`:

```text
Replay saved:
.agentflight/reports/af-...-replay.html

Timeline:
session_started -> verification_passed -> snapshot_created -> replay_generated
```

`agentflight resume`:

```text
Continue the AgentFlight session for: Add password reset flow

Latest snapshot:
Initial implementation verified

Verification state:
1 passed, 0 failed

Review focus:
src/auth/reset.ts - identity/session path

Guardrails:
- Stay scoped to the current task.
- Do not claim completion without proof.
- Run relevant verification before declaring success.
```

## Current Capabilities

The current AgentFlight release supports:

- local session setup
- active session tracking
- git branch, commit, dirty state, and changed file detection
- changed file risk categorisation
- review focus ranking for changed files
- proof gap detection and review readiness recommendations
- config-defined verification profiles for repeated local command groups
- configurable generated/internal changed-file filters
- verification evidence capture with `agentflight verify`
- inline failure excerpts in the replay and report, so failures are visible without opening evidence files
- session events
- snapshots with `agentflight snapshot --note "..."`
- Markdown proof reports
- self-contained HTML replay timelines
- local review handoffs that point to the report, replay, and resume artifacts
- resume prompts for Codex, Claude Code, or a human reviewer
- doctor checks for local setup
- defensive ProjScan and AgentLoopKit adapters
- no telemetry, cloud sync, or source upload

## What AgentFlight Is Not

AgentFlight is:

- not a coding agent
- not a cloud service
- not a replacement for tests
- not a security scanner
- not a CI platform
- not a code review replacement

Use your coding agent to make changes. Use AgentFlight to understand, verify, replay, and hand off the work.

## How It Works Locally

AgentFlight creates a local `.agentflight/` directory in your repo:

- `config.json` stores local-first project settings.
- `sessions/` stores session metadata.
- `current/` stores the active session, handoff, and resume prompt.
- `reports/` stores Markdown proof reports and HTML replays.
- `evidence/` stores stdout and stderr from captured verification runs.

Sessions store an `events` timeline with meaningful moments such as session start, verification attempts, snapshots, and generated artifacts. Reports include filenames and summaries by default, not full source diffs.

Runtime session data is ignored by git by default in this repo:

- `.agentflight/sessions/`
- `.agentflight/reports/`
- `.agentflight/evidence/`
- `.agentflight/current/`

`.agentflight/config.json` is intentionally not ignored, so a project can commit its local AgentFlight defaults when useful.

AgentFlight always excludes its own runtime session/report/current/evidence files from changed-file analysis. It also hides local AgentLoopKit evidence paths such as `.agentloop/reports/**`, `.agentloop/handoffs/**`, `.agentloop/runs/**`, and `.agentloop/state.json` while keeping task contracts and policies visible. Additional generated or internal files can be ignored locally:

```json
{
  "changedFileFilters": {
    "ignore": [".projscan-memory/**"]
  }
}
```

See [docs/development/changed-file-filters.md](docs/development/changed-file-filters.md).

## Commands

- `agentflight init` initializes `.agentflight/` with safe writes and explains which local files are project config versus runtime evidence.
- `agentflight start --task "..."` starts a session and writes the current handoff.
- `agentflight status` summarizes changed files, risk, verification status, review focus, proof gaps, readiness, snapshots, and next action.
- `agentflight status --format json` prints the same local status data as structured JSON for scripts.
- `agentflight verify -- <command>` runs a proof command, records stdout/stderr evidence, and prints a small heartbeat while long commands are still active.
- `agentflight verify` runs commands from `.agentflight/config.json`.
- `agentflight verify --profile <name>` runs a named local command group from `.agentflight/config.json`.
- `agentflight snapshot --note "..."` records current git, risk, and verification state as a timeline event.
- `agentflight report` generates a Markdown proof report with review focus and readiness.
- `agentflight report --mode compact` writes a shorter local Markdown review summary.
- `agentflight report --mode pr-comment` writes a local PR-comment draft without posting anywhere.
- `agentflight replay` generates a local self-contained HTML replay with review focus and proof gaps.
- `agentflight resume` prints and saves a continuation prompt with the next safest action.
- `agentflight handoff` generates a local review handoff, report, replay, and resume prompt without posting anywhere. It exits non-zero when failed verification blocks review.
- `agentflight doctor` checks local setup, scripts, tools, config, and current session state.

Future placeholders exist for `upgrade`, `license`, and `login`; AgentFlight Pro/Team is not available yet.

## Powered By ProjScan And AgentLoopKit

AgentFlight is powered by two open engines from Baseframe Labs:

- ProjScan provides repo intelligence, risk analysis, codebase understanding, and preflight signals.
- AgentLoopKit provides task discipline, verification evidence, policies, and handoffs.

This repository dogfoods both tools. See [docs/development/dogfooding.md](docs/development/dogfooding.md).

Strategic architecture:

- ProjScan: repo intelligence engine
- AgentLoopKit: agent workflow discipline engine
- AgentFlight: commercial and user-facing experience layer

## Example Session

Read [docs/examples/basic-agentflight-session.md](docs/examples/basic-agentflight-session.md) for a short password-reset walkthrough with status, report, replay, and resume artifacts.

## Roadmap

See [docs/roadmap/index.md](docs/roadmap/index.md).

Not built yet:

- cloud sync
- login
- billing
- GitHub App
- Team dashboards
- paid feature gates

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
