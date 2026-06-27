# Review Passport

AgentFlight writes a Review Passport when you run:

```bash
agentflight finish
```

The passport gives reviewers one local artifact for the session. It answers:

- what changed
- what proof ran
- what failed or went missing
- what scope drift exists
- who should inspect which files
- whether the session is ready for review
- what action clears the next risk

## Artifacts

`finish` writes:

```text
.agentflight/reports/<session-id>-review-passport.json
.agentflight/reports/<session-id>-review-passport.md
```

It also refreshes the handoff, report, replay, and resume artifacts for the
same session.

## Contents

The JSON artifact includes:

- session ID, task, branch, commit, and package manager
- readiness state, reason, and next action
- changed file paths
- risk categories and risk reasons
- verification run metadata
- proof gaps
- review focus
- review queue
- reviewer routes
- Trust Delta
- Baseframe result summary when the session started from an AgentLoopKit task
- artifact paths
- SHA-256 fingerprints for passport metadata

AgentFlight does not include source contents in the passport. It records paths,
commands, statuses, timestamps, counts, and hashes.

## Baseframe Sessions

For sessions with Baseframe context, `finish` also writes:

```text
.baseframe/evidence/<task-id>/agentflight-result.json
```

It updates `.baseframe/agent-workflow.json` and prints the AgentLoopKit
reconciliation command.

## Exit Code

`finish` uses the same readiness exit behavior as `handoff`.

- exits `0` when the work is ready for review or the worktree is clean
- exits `1` when verification, proof, or review readiness blocks trust

## Privacy Boundary

The Review Passport stays local. AgentFlight does not upload it, post it to a
pull request, send telemetry, or read secret files.
