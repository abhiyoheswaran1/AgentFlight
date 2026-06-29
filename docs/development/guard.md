# AgentFlight Guard

`agentflight guard` is the live trust monitor for an active AgentFlight session.
It reuses the same local evidence as `agentflight status`, then renders the
parts that matter while a coding agent is still working:

- readiness
- changed-file count
- verification counts
- proof gaps
- Baseframe scope drift and gate status
- Review Passport and Baseframe result targets
- one next action

Guard does not run verification commands, upload source, post comments, or call a
hosted service. It reads local AgentFlight evidence and, when present, local
Baseframe JSON artifacts.

## Commands

```bash
agentflight guard
agentflight guard --once
agentflight guard --format json --once
agentflight guard --interval 5000
agentflight guard --no-clear
```

Use `agentflight guard` in a terminal beside your coding agent. It refreshes on a
timer and clears the terminal between updates by default.

Use `agentflight guard --once` in scripts, demos, test fixtures, and terminals
where a single snapshot is better than a watch loop.

Use `agentflight guard --format json --once` when another local tool needs a
structured trust summary.

## Exit Codes

One-shot Guard exits with `0` only when the current readiness state is
`ready_for_review` or `clean_worktree`. It exits with `1` for failed,
incomplete, missing, stale, or otherwise unresolved trust states.

Watch mode returns the last observed exit code after it is stopped.

## Baseframe Sessions

When a session starts from an AgentLoopKit task contract, Guard includes the
refreshed AgentFlight Baseframe result if AgentFlight can produce one locally.
The view shows:

- Baseframe task ID
- gate counts for passed, failed, incomplete, missing, and skipped gates
- scope drift count
- blocking signals for failed, incomplete, or missing required gates
- blocking signals for changes inside excluded scope
- warning signals for skipped gates and non-blocking scope drift

The Baseframe result target is deterministic:

```text
.baseframe/evidence/<task-id>/agentflight-result.json
```

## Finish Targets

Guard shows where `agentflight finish` will write the final Review Passport:

```text
.agentflight/reports/<session-id>-review-passport.json
.agentflight/reports/<session-id>-review-passport.md
```

In Baseframe sessions, it also shows the Baseframe result target. These are
relative paths, so terminal output does not expose private absolute repository
paths.

## Privacy Boundary

Guard is local-only:

- no telemetry
- no cloud sync
- no source upload
- no automatic PR comment
- no hidden verification command execution

Capture verification with `agentflight verify`. Guard tells you what proof is
missing, failed, incomplete, stale, or ready to finish.
