# Repo-Calibrated Proof Guidance Design

## Goal

Make AgentFlight compare the current session's proof against proof patterns from
similar local ready handoffs, so engineers can see when proof exists but is
weaker than this repo's own trusted history.

## Product Shape

The feature is suggestion-only. AgentFlight should say when the current proof is
under-proven compared with similar local ready sessions, but it should not
silently block readiness, change exit codes, upload source, or infer anything
from raw command output.

Example:

```text
Repo calibration:
- under-proven - Similar local ready handoffs for auth changes usually included e2e test proof.
  Current proof: test
  Historical proof: test, e2e
  Suggested proof: agentflight verify -- npm run e2e:auth
  Based on: 2 similar ready handoffs
```

## Architecture

Add a focused `proof-calibration` core module. It loads a bounded set of recent
local `.agentflight/sessions/*.json` records, excluding the current session,
then keeps only sessions with recorded `ready_for_review` review metadata and
passing verification runs.

The evaluator compares:

- current changed-file categories
- current passed proof kinds
- current verification commands
- historical ready-session proof kinds and commands
- historical proof-snapshot changed-file categories when available

It returns a small `ProofCalibration` object attached to `ReviewIntelligence`.
Existing commands and renderers consume that object. No new command is needed.

## Data Rules

- Use only local session JSON metadata.
- Prefer proof snapshot changed files for historical categories.
- Fall back to `session.git.changedFiles` when no proof snapshot exists.
- Never read historical stdout/stderr evidence files.
- Never include source text or file contents.
- Cap scanned history and rendered suggestions.
- Require at least two similar ready handoffs before suggesting a historical
  proof kind, to avoid overfitting to one old session.

## Rendering

Render a `Repo calibration` section in:

- terminal status
- handoff
- Markdown report
- HTML replay
- resume prompt
- status JSON as structured data

The empty state should stay quiet:

```text
- Not enough similar ready local handoffs yet.
```

## Testing

Cover:

- under-proofed current work when similar ready sessions used stronger proof
- no suggestion when there is no similar ready history
- no readiness blocking from calibration alone
- historical stdout/stderr paths are not read or copied
- Markdown report rendering
- HTML escaping for historical command labels
- resume/status/handoff smoke coverage where practical

## Non-Goals

- No cloud sync.
- No telemetry.
- No model extraction.
- No PR comments.
- No CI JSON.
- No named verification profiles.
- No version bump or release.
