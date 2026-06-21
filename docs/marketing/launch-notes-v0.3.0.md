# AgentFlight v0.3.0 Launch Notes Draft

Do not publish this file as-is. Use it as draft copy for launch posts, GitHub discussions, social posts, and community submissions.

## Product One-Liner

AgentFlight is a local-first flight recorder for coding agents.

## Demo Assets

- Logo: `docs/agentflight_logo/icon.svg`
- Replay screenshot: `docs/assets/agentflight-replay-timeline.png`
- Terminal workflow GIF: `docs/assets/agentflight-terminal-demo.gif`
- VHS source: `docs/marketing/agentflight-terminal-demo.tape`

## Short Launch Post

AgentFlight v0.3.0 is live.

It records coding agent sessions locally so you can see what changed, capture verification evidence, create snapshots, generate proof reports, replay the session timeline, and hand the work to the next agent or reviewer.

It works around Codex, Claude Code, Cursor, Windsurf, Gemini CLI, Aider, OpenCode, and similar tools. It does not replace them.

Install:

```bash
npx agentflight@latest init
npx agentflight@latest start --task "Add password reset flow"
```

Then run your coding agent normally and capture proof:

```bash
npx agentflight@latest verify -- npm test
npx agentflight@latest snapshot --note "Initial implementation verified"
npx agentflight@latest report
npx agentflight@latest replay
npx agentflight@latest resume
```

AgentFlight is local-first. No telemetry. No cloud upload. No source upload.

## Longer GitHub Or README Announcement

Coding agents can produce useful changes quickly, but the review loop still falls on the developer. After a few prompts, it gets hard to answer basic questions: what changed, what was risky, what passed, what failed, and what should the next agent or reviewer do?

AgentFlight gives that workflow a local flight recorder.

With v0.3.0, AgentFlight can:

- start and track a coding agent session
- capture verification evidence with command output paths, exit codes, and timing
- categorize changed files by rough risk area
- create snapshots at meaningful checkpoints
- generate Markdown proof reports
- generate local HTML replay timelines
- create resume prompts for Codex, Claude Code, Cursor, or a human reviewer

AgentFlight is not a coding agent. It is the control room around coding agents.

Everything stays local in `.agentflight/`. Reports include filenames and summaries by default, not full source diffs. AgentFlight does not collect telemetry or upload source code.

## X/Twitter Post

AgentFlight v0.3.0 is live.

A local-first flight recorder for coding agents:

- start a coding session
- capture test/build evidence
- snapshot progress
- see changed files and risk
- generate proof reports
- replay the session timeline
- create a safe resume prompt

No telemetry. No cloud upload.

```bash
npx agentflight@latest init
```

## Hacker News Title Options

- Show HN: AgentFlight, a local-first flight recorder for coding agents
- Show HN: I built a CLI to record and verify coding agent sessions locally
- AgentFlight records what Codex, Claude Code, and Cursor changed
- Local proof reports and replay timelines for coding agent sessions

## Reddit Or Dev Community Post

I released AgentFlight v0.3.0, a local-first CLI for developers using coding agents.

The idea is simple: coding agents move fast, but developers still need proof. AgentFlight records the session locally, captures verification evidence, shows changed-file risk, creates snapshots, generates a proof report, renders a replay timeline, and writes a resume prompt for the next agent or reviewer.

Example workflow:

```bash
npx agentflight@latest init
npx agentflight@latest start --task "Add password reset flow"

# Run your coding agent normally

npx agentflight@latest verify -- npm test
npx agentflight@latest snapshot --note "Initial implementation verified"
npx agentflight@latest status
npx agentflight@latest report
npx agentflight@latest replay
npx agentflight@latest resume
```

AgentFlight is not an agent and it does not replace tests, CI, security review, or human review. It gives you local session evidence and handoff artifacts around tools like Codex, Claude Code, Cursor, Windsurf, Gemini CLI, Aider, and OpenCode.

Privacy model: local files only, no telemetry, no cloud upload, no source upload.
