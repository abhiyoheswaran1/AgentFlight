# AgentFlight v0.6.0 Website Update Prompt

Checked: 2026-06-20

Target pages:

- `https://www.baseframelabs.com/apps/agentflight`
- `https://www.baseframelabs.com/apps/agentflight/docs`

Use this prompt in the Baseframe Labs website repo or CMS.

## Prompt

Update the Baseframe Labs AgentFlight overview and docs pages for
`agentflight@0.6.0`.

Primary positioning:

> AgentFlight is a local-first review layer for AI coding sessions.

Longer version:

> AgentFlight records what your coding agent did, captures verification
> evidence, shows failure excerpts, and tells you what needs review before you
> trust the result.

Core message:

> AgentFlight shows you what failed, what proof exists, and whether an AI coding
> session is ready for review.

## What To Emphasize

- `agentflight@0.6.0`
- local-first review handoff loop
- flight-record evidence ledger
- inline failure excerpts
- Review Intelligence
- local report, replay, resume, and handoff artifacts
- no cloud, no telemetry, no source upload, no account, no automatic PR comments

## Overview Page Copy

Hero subtitle:

> Local-first review layer for AI coding sessions.

Overview paragraph:

> AgentFlight v0.6.0 sits around tools like Codex, Claude Code, Cursor,
> Windsurf, Gemini CLI, Aider, and OpenCode. It records an AI coding session,
> captures verification evidence, shows inline failure excerpts, ranks review
> focus, flags proof gaps, and creates local handoff, report, replay, and resume
> artifacts.

Trust paragraph:

> AgentFlight keeps the review trail local. It does not call an LLM, upload
> source code, add telemetry, post PR comments, or require an account. It gives
> developers and reviewers a proof trail before they trust the result.

Workflow paragraph:

> Start a session, run your coding agent, capture verification with
> `agentflight verify`, then run `agentflight handoff`. The handoff shows
> readiness, failed excerpts, proof gaps, the top files to review, and the local
> report/replay/resume paths.

## Docs Intro

> AgentFlight is a local-first review layer for AI coding sessions. Run it
> around Codex, Claude Code, Cursor, or any coding agent: it records the session,
> captures verification evidence, shows failure excerpts and Review
> Intelligence, and writes a local handoff, proof report, HTML replay ledger,
> and resume prompt. Everything lives under `.agentflight/` in your repo.
> Nothing uploads, and AgentFlight never calls an LLM.

Install section note:

> Run `npx agentflight@latest init`. The current npm release is
> `agentflight@0.6.0`.

Trust section headline:

> Local files. No telemetry. No cloud upload.

Trust section copy:

> AgentFlight reads git status and package metadata, runs verification commands
> only when you invoke them, and writes local artifacts under `.agentflight/`.
> Reports include filenames, summaries, verification results, and failure
> excerpts by default, not full code diffs.

## Constraints

- Do not mention hosted review, login, billing, Pro/Team, GitHub App, automatic
  PR comments, cloud sync, or team dashboards as shipped.
- Do not imply AgentFlight replaces tests, CI, security review, or human review.
- Keep the product local-first and CLI-first.

## QA Checklist

- The overview and docs pages show version `0.6.0`.
- No paragraph references `v0.4.2`, `v0.5.0`, or `v0.5.1` as current.
- The phrase "local-first review layer for AI coding sessions" appears on the
  overview and docs pages.
- The pages mention inline failure excerpts, Review Intelligence, replay
  evidence ledger, and local handoff.
- The pages explicitly state no cloud, no telemetry, no source upload, no
  account, and no automatic PR comments.
- The pages do not present deferred Team/Pro features as available.
