# AgentFlight

<p align="center">
  <a href="https://www.baseframelabs.com/apps/agentflight">
    <img src="docs/agentflight_logo/icon.svg" alt="AgentFlight logo" width="112" />
  </a>
</p>

See what your coding agent did, what failed, and whether the work is ready for review.

AgentFlight is a local-first review layer for coding agent sessions from Baseframe Labs. It records what your coding agent did, captures verification evidence, shows failure excerpts, and tells you whether the proof is right for this repo before you trust the result.

Website: [baseframelabs.com/apps/agentflight](https://www.baseframelabs.com/apps/agentflight)

AgentFlight helps you:

- start a coding agent session
- capture verification evidence
- see changed files and risk
- read a local Review Contract with claim-by-claim proof references
- compare the change against a local Project Review Contract proof standard that explains why each rule matched
- compare current proof against similar local ready handoffs from this repo
- create snapshots during the session
- generate a local review handoff
- generate a proof report and local replay timeline
- find recent local sessions and their artifacts
- create a resume prompt for the next agent or reviewer

![AgentFlight CLI workflow: init, start, verify, status, handoff, and history](docs/assets/agentflight-terminal-demo.gif)

![AgentFlight handoff decision: required proof, satisfied proof, and remaining review](docs/assets/agentflight-review-contract-decision.svg)

## 60-Second Workflow

```bash
npx agentflight@latest init
npx agentflight@latest start --task "Add password reset flow"

# Run your coding agent normally

npx agentflight@latest verify
npx agentflight@latest snapshot --note "Initial implementation verified"
npx agentflight@latest status
npx agentflight@latest handoff
npx agentflight@latest history --limit 1
```

What you get:

- `init` creates local `.agentflight/` project files and seeds detected verification commands into `.agentflight/config.json` when package scripts exist.
- `start` records the task, git branch, commit, dirty state, package manager, and tool availability.
- `verify` runs configured commands and stores stdout, stderr, exit code, timing, pass/fail status, and a source-free changed-file proof snapshot. Use `verify -- <command>` for one explicit proof command.
- `status` answers what changed, how risky it is, what proof the repo requires, why those requirements matched, whether proof is current or stale, which files invalidated stale proof, whether similar local ready handoffs used stronger proof, what the Review Contract claims, and what to do next.
- `snapshot --note "..."` records the current git, risk, and proof state as a timeline event.
- `handoff` generates the local review packet: decision, readiness, required proof, proof reasons, Review Contract path, proof gaps, failed excerpts, and report/replay/resume artifact paths.
- `report` writes a Markdown proof report with claim-to-proof references for review.
- `replay` writes a local HTML review path and timeline you can open in a browser, with links from Review Contract claims to related proof.
- `resume` writes a continuation prompt for the next safe step, including the current Review Contract state.
- `history` shows a latest action with recorded readiness, the artifact to open first, and recent local handoff/report/replay/resume paths without uploading, syncing, or switching sessions. Use `history --task <text>` or `history --state ready|blocked|needs_verification|unknown|current` to narrow existing local records.

## Local Review Flow

```text
Your coding agent / app
  (Claude Code, Cursor, Codex, LangChain, Agno, Strands, your own code...)
       | prompts . tool outputs . logs . files
       v
  +--------------------------------------------------------------+
  | AgentFlight        (runs locally - your data stays here)     |
  | ------------------------------------------------------------ |
  | Session recorder -> Verification evidence -> Review Contract |
  |        |                    |                    |           |
  |        |                    |                    +-> claims  |
  |        |                    +-> stdout/stderr, excerpts,     |
  |        |                        proof snapshots              |
  |        +-> changed files, snapshots, timeline                |
  |                                                              |
  | Project Review Contract: repo proof standard + manual checks |
  | Repo calibration: compare proof with similar ready handoffs   |
  |                                                              |
  | Handoff . Report . Replay . Resume . History                 |
  +--------------------------------------------------------------+
       | local review packet + proof references
       v
Engineer / reviewer
```

## Watch The Flow

AgentFlight turns a loose coding agent session into a local proof trail:

1. Start a session before you ask the coding agent to work.
2. Capture real verification output with `agentflight verify`.
3. Snapshot meaningful checkpoints.
4. Read `status` to see changed files, risk, required proof, proof freshness, repo calibration, gaps, and next action.
5. Run `handoff` when the work is ready to review or when you need a clear fix-before-sharing summary.
6. Use `history --limit 1` to reopen the latest local handoff, report, replay, or resume artifact.

The replay artifact is a self-contained local HTML file. It leads with the review verdict and a compact review path, then lays out risk, review focus, required proof, why each requirement matched, what proof satisfied it, repo calibration, Review Contract claims, proof freshness, proof gaps, the session timeline, and verification evidence (with inline failure excerpts, so you can see what broke without opening a log file) as a readable flight record. Review Contract claims link to the related proof, file focus, proof gap, or verification run where possible:

![AgentFlight replay: review verdict, risk, timeline, and verification evidence](docs/assets/agentflight-replay-scroll.gif)

A high-resolution still is also available at [`docs/assets/agentflight-replay-timeline.png`](docs/assets/agentflight-replay-timeline.png).

## Why This Exists

Coding agents move fast. After a few prompts, you can lose track of:

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
- Application source files changed.

Verification Evidence:
1 passed, 0 failed

Review first:
1. src/auth/reset.ts
   Proof: current
   Why: identity/session path
   Focus: Check session, permission, and identity boundaries first.

Decision:
Ready for review; manual checks remain before trusting the change.

Why:
- 1 manual-review requirement remains.
- No failed, stale, or missing required proof.

Required proof:
- needs review - Sensitive auth, payment, or security review
   Matched: Matched auth changes: src/auth/reset.ts
   Proof: current
   Proof detail: Satisfied by current test proof: npm test
   Satisfied by: test proof (npm test)
   Accepted proof: test
   Manual review: Review session, permission, identity, payment, or credential boundaries manually.
   Files: src/auth/reset.ts
   Remaining: Review session, permission, identity, payment, or credential boundaries manually.

Repo calibration:
- Similar local ready handoffs suggest 1 additional proof command for this change. Source: local session history; scanned 4, matched 2.
- under-proven - auth
   Current proof: npm test
   Historical proof: npm run e2e:auth, npm test
   Suggested proof: agentflight verify -- npm run e2e:auth
   Based on: 2 similar ready handoffs

Review Contract:
Review path: Ready for review with 3 supported claims and 1 manual-review claim.
- supported - Session task: Add password reset flow
- needs review - Required proof: Sensitive auth, payment, or security review
- supported - Changed file reviewed: src/auth/reset.ts
- supported - Review readiness: Ready for review

Proof gaps:
- none

Latest snapshot:
- Note: Initial implementation verified
- Risk: medium
- Changed files: 3

Readiness: Ready for review
Reason: Verification evidence matches the observed review risk.

Next action:
Run agentflight handoff to generate the local review packet.
```

When proof goes stale, AgentFlight names the files that invalidated it:

```text
Proof freshness:
- Verification proof is stale for auth changes after proof was captured. Rerun verification for these files. Docs changes also need manual review.
- Proof-required stale files: auth (src/auth/reset.ts)
- Manual-review stale files: docs (README.md)
```

`agentflight report`:

```text
# AgentFlight Proof Report

## Review First
1. src/auth/reset.ts
   - Proof: current
   - Why: identity/session path

## Required Proof
- needs review - Sensitive auth, payment, or security review
  - Matched: Matched auth changes: src/auth/reset.ts
  - Proof: current
  - Proof detail: Satisfied by current test proof: npm test
  - Satisfied by: test proof (npm test)
  - Accepted proof: test
  - Manual review: Review session, permission, identity, payment, or credential boundaries manually.
  - Files: src/auth/reset.ts
  - Remaining: Review session, permission, identity, payment, or credential boundaries manually.

## Repo Calibration
- Similar local ready handoffs suggest 1 additional proof command for this change. Source: local session history; scanned 4, matched 2.
- under-proven - auth
  - Current proof: npm test
  - Historical proof: npm run e2e:auth, npm test
  - Suggested proof: agentflight verify -- npm run e2e:auth
  - Based on: 2 similar ready handoffs

## Review Contract
Review path: Ready for review with 3 supported claims and 1 manual-review claim.

- needs review - Required proof: Sensitive auth, payment, or security review
  - Files: src/auth/reset.ts
  - Evidence: Matched: Matched auth changes: src/auth/reset.ts; Proof: current; Proof detail: Satisfied by current test proof: npm test; Accepted proof: test
- supported - Changed file reviewed: src/auth/reset.ts
  - Files: src/auth/reset.ts
  - Evidence: Proof: current
  - Proof refs: Changed file: src/auth/reset.ts; Proof status: current

## Verification Evidence
- passed: npm test
- stdout: .agentflight/evidence/.../verification-1.stdout.txt
- stderr: .agentflight/evidence/.../verification-1.stderr.txt

## Review Readiness
Ready for review
```

`agentflight handoff`:

```text
AgentFlight handoff

Task:
Add password reset flow

Decision:
Ready for review; manual checks remain before trusting the change.

Why:
- 1 manual-review requirement remains.
- No failed, stale, or missing required proof.

Readiness: Ready for review
Open first: handoff .agentflight/reports/af-...-handoff.md

Required proof:
- needs review - Sensitive auth, payment, or security review
   Matched: Matched auth changes: src/auth/reset.ts
   Proof: current
   Proof detail: Satisfied by current test proof: npm test
   Satisfied by: test proof (npm test)
   Accepted proof: test
   Manual review: Review session, permission, identity, payment, or credential boundaries manually.
   Files: src/auth/reset.ts
   Remaining: Review session, permission, identity, payment, or credential boundaries manually.

Repo calibration:
- Similar local ready handoffs suggest 1 additional proof command for this change. Source: local session history; scanned 4, matched 2.
- under-proven - auth
   Current proof: npm test
   Historical proof: npm run e2e:auth, npm test
   Suggested proof: agentflight verify -- npm run e2e:auth
   Based on: 2 similar ready handoffs

Review contract:
Review path: Ready for review with 3 supported claims and 1 manual-review claim.
- supported - Session task: Add password reset flow
- needs review - Required proof: Sensitive auth, payment, or security review
- supported - Changed file reviewed: src/auth/reset.ts

Artifacts:
- Handoff: .agentflight/reports/af-...-handoff.md
- Report: .agentflight/reports/af-...-report.md
- Replay: .agentflight/reports/af-...-replay.html
- Resume: .agentflight/reports/af-...-resume.md
```

`agentflight replay`:

```text
Replay saved:
.agentflight/reports/af-...-replay.html

Timeline:
session_started -> verification_passed -> snapshot_created -> report_generated -> replay_generated
```

`agentflight history --limit 1`:

```text
AgentFlight history

Latest action:
Open first: handoff .agentflight/reports/af-...-handoff.md
Recorded readiness: Ready for review

Recent sessions:
1. Add password reset flow
   Proof: 1 passed, 0 failed
   Handoff: .agentflight/reports/af-...-handoff.md
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

Required Proof:
- needs review - Sensitive auth, payment, or security review
   - Matched: Matched auth changes: src/auth/reset.ts
   - Proof: current
   - Proof detail: Satisfied by current test proof: npm test
   - Accepted proof: test
   - Manual review: Review session, permission, identity, payment, or credential boundaries manually.
   - Remaining: Review session, permission, identity, payment, or credential boundaries manually.

Review Contract:
Review path: Ready for review with 3 supported claims and 1 manual-review claim.
- supported - Changed file reviewed: src/auth/reset.ts
   - Proof refs: Changed file: src/auth/reset.ts; Proof status: current

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
- Project Review Contract rules that define required proof and manual checks by changed-file category
- Project Review Contract explanations that show matched categories, satisfying proof, proof state, and remaining review
- repo calibration suggestions that compare current proof with similar local ready handoffs
- proof gap detection and review readiness recommendations
- config-defined verification commands for repeated local proof capture
- configurable generated/internal changed-file filters
- verification evidence capture with `agentflight verify`
- source-free proof freshness checks that show which files and categories changed after verification
- Review Contract claims with source-free proof references across status, report, replay, resume, and handoff
- inline failure excerpts in terminal output, handoffs, reports, and replays, so failures are visible without opening evidence files
- session events
- snapshots with `agentflight snapshot --note "..."`
- Markdown proof reports
- self-contained HTML replays with review-path guidance and timelines
- local review handoffs that point to the report, replay, and resume artifacts
- local history filters for finding sessions by task text or recorded readiness
- resume prompts for the next agent or reviewer
- doctor checks for local setup
- defensive ProjScan and AgentLoopKit adapters
- no telemetry, cloud sync, or source upload

## Product Boundaries

AgentFlight records local review evidence. Your coding agent still changes the
code. Your test suite still proves behavior. Your reviewer still decides whether
the work can merge.

AgentFlight keeps that boundary narrow: local files, explicit verification
commands, source-free proof references, and no cloud service.

Use your coding agent to make changes. Use AgentFlight to understand, verify, replay, and hand off the work.

## How It Works Locally

AgentFlight creates a local `.agentflight/` directory in your repo:

- `config.json` stores local-first project settings.
- `sessions/` stores session metadata.
- `current/` stores the active session, handoff, and resume prompt.
- `reports/` stores Markdown proof reports and HTML replays.
- `evidence/` stores stdout and stderr from captured verification runs.
- `.gitignore` keeps those runtime directories out of git while leaving
  `config.json` visible.

Sessions store an `events` timeline with meaningful moments such as session start, verification attempts, snapshots, and generated artifacts. Verification runs also store source-free changed-file fingerprints so AgentFlight can tell whether proof is current or stale. Reports include filenames and summaries by default, not full source diffs.

When prior local handoffs exist, AgentFlight can compare the current proof with
similar sessions that were recorded as ready for review. This repo calibration
uses session metadata, changed-file categories, verification commands, and
source-free proof snapshots. It does not read historical stdout/stderr evidence,
upload source, or enforce policy. It is guidance for reviewers when current
proof is weaker than this repo's own local history.

Runtime session data is ignored by the `.agentflight/.gitignore` created by
`agentflight init`:

- `.agentflight/sessions/`
- `.agentflight/reports/`
- `.agentflight/evidence/`
- `.agentflight/current/`

`.agentflight/config.json` is intentionally not ignored, so a project can commit its local AgentFlight defaults when useful.

New configs include a local Project Review Contract. It maps changed-file
categories to required proof and manual review checks:

```json
{
  "projectReviewContract": {
    "enabled": true,
    "rules": [
      {
        "id": "missing-auth-test-proof",
        "label": "Sensitive auth, payment, or security review",
        "categories": ["auth", "billing/payments", "security/secrets"],
        "requiredProof": ["test"],
        "manualReview": [
          "Review session, permission, identity, payment, or credential boundaries manually."
        ],
        "severity": "blocking"
      }
    ]
  }
}
```

AgentFlight always excludes its own runtime session/report/current/evidence files from changed-file analysis. It also hides local AgentLoopKit evidence paths such as `.agentloop/reports/**`, `.agentloop/handoffs/**`, `.agentloop/runs/**`, and `.agentloop/state.json` while keeping task contracts and policies visible. Additional generated or internal files can be ignored locally:

```json
{
  "changedFileFilters": {
    "ignore": [".projscan-memory/**"]
  }
}
```

On a first run, ProjScan fallback state may create `.projscan-memory/memory.json`
and AgentFlight may surface it in status, report, replay, or handoff output. If
that memory file is generated evidence rather than something reviewers should
inspect, add `.projscan-memory/**` to `changedFileFilters.ignore`. AgentFlight
does not ignore it by default, because some teams may want generated tool state
to stay visible.

See [docs/development/changed-file-filters.md](docs/development/changed-file-filters.md).

## Commands

- `agentflight init` initializes `.agentflight/` with safe writes, seeds detected verification commands and the default Project Review Contract into config when package scripts exist, and explains which local files are project config versus runtime evidence.
- `agentflight start --task "..."` starts a session and writes the current handoff.
- `agentflight status` summarizes changed files, risk, verification status, required proof, proof freshness, repo calibration, review focus, proof gaps, readiness, snapshots, and next action.
- `agentflight status --format json` prints the same local status data as structured JSON for scripts.
- `agentflight verify -- <command>` runs a proof command, records stdout/stderr evidence plus source-free changed-file proof fingerprints, and prints a small heartbeat while long commands are still active.
- `agentflight verify` runs commands from `.agentflight/config.json`.
- `agentflight verify --profile <name>` runs a named local command group from `.agentflight/config.json`.
- `agentflight snapshot --note "..."` records current git, risk, and verification state as a timeline event.
- `agentflight report` generates a Markdown proof report with review focus, required proof, repo calibration, Review Contract claims, and readiness.
- `agentflight report --mode compact` writes a shorter local Markdown review summary.
- `agentflight report --mode pr-comment` writes a local PR-comment draft without posting anywhere.
- `agentflight replay` generates a local self-contained HTML replay with review focus, required proof, repo calibration, Review Contract claims, and proof gaps.
- `agentflight resume` prints and saves a continuation prompt with the next safest action, current required-proof state, and repo calibration.
- `agentflight handoff` generates a local review handoff, report, replay, and resume prompt without posting anywhere. It includes repo calibration when enough similar ready handoffs exist, and exits non-zero when verification failures or missing required proof make the work not ready to share.
- `agentflight history` shows the latest action first, including recorded readiness, open-first artifact guidance, current-session marker, proof counts, and existing local handoff/report/replay/resume paths.
- `agentflight history --task <text>` narrows existing local sessions by task title before applying `--limit`.
- `agentflight history --state ready|blocked|needs_verification|unknown|current` narrows existing local sessions by recorded readiness or the current-session marker before applying `--limit`.
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

Read [docs/examples/basic-agentflight-session.md](docs/examples/basic-agentflight-session.md) for a short password-reset walkthrough with status, handoff, report, replay, and resume artifacts.

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

Keep changes scoped, local-first, and honest about proof. Do not claim tests passed unless the commands ran and passed.

## License

Apache-2.0. See [LICENSE](LICENSE).
