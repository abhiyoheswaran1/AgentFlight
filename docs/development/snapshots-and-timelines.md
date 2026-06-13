# Snapshots And Timelines

AgentFlight sessions include a local `events` timeline. The timeline is stored in the active session JSON and in the session copy under `.agentflight/sessions/`.

## Events

AgentFlight records meaningful workflow moments:

- `session_started`
- `verification_started`
- `verification_passed`
- `verification_failed`
- `snapshot_created`
- `report_generated`
- `replay_generated`
- `resume_generated`
- `doctor_run`

Older v0.1 and v0.2 sessions may not have an `events` array. AgentFlight treats missing events as an empty event log and can synthesize a basic timeline from existing session metadata and verification runs where useful.

## Snapshots

Use snapshots at meaningful checkpoints:

```bash
agentflight snapshot --note "Initial implementation completed"
```

A snapshot records:

- current git branch and commit
- dirty working tree state
- changed file names
- risk summary
- verification summary
- optional note

Snapshots do not include full source diffs by default, do not upload anything, and do not run destructive commands.

## Workflow

```bash
agentflight start --task "Add password reset flow"
agentflight verify -- npm run typecheck
agentflight verify -- npm test
agentflight snapshot --note "Password reset proof captured"
agentflight status
agentflight report
agentflight replay
agentflight resume
```

Reports and replays show the timeline. Status and resume show the latest snapshot so the next agent or reviewer can understand the current state quickly.
