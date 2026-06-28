# AgentFlight v0.15.0 Website Update Prompt

Use this prompt to update:

- `https://www.baseframelabs.com/apps/agentflight`
- `https://www.baseframelabs.com/apps/agentflight/docs`

## Source Of Truth

AgentFlight v0.15.0 adds `agentflight finish` and the Review Passport. The site
should move the primary end-of-session workflow from `handoff` to `finish`.
`handoff` remains available, but `finish` is now the command users run when
they want the final local review packet.

Primary message:

```text
ProjScan finds the risk.
AgentLoopKit controls the work.
AgentFlight proves the result.
```

## Homepage Update

Replace handoff-only product language with:

```text
AgentFlight is a local-first review layer for coding-agent sessions. It records
what changed, captures verification evidence, detects scope drift, reconciles
Baseframe gates, and writes one Review Passport that tells reviewers whether
the work is ready.
```

Feature bullets:

- `agentflight finish` writes the Review Passport, handoff, report, replay, and
  resume artifacts.
- In Baseframe sessions, `finish` also writes
  `.baseframe/evidence/<task-id>/agentflight-result.json` for AgentLoopKit.
- The Review Passport includes readiness, changed files, verification runs,
  proof gaps, review focus, reviewer routes, artifact paths, and integrity
  fingerprints.
- AgentFlight stays local: no upload, no telemetry, no PR posting, no source
  contents in the passport.

Hero or product visual:

- Use the real README asset `docs/assets/agentflight-baseframe-readiness.png`
  if the page needs a Baseframe readiness image.
- For the new flagship visual, capture a real terminal run of
  `agentflight finish` from v0.15.0. Do not fabricate a product screenshot.
- Preferred terminal shot should show:
  - `Readiness`
  - changed file count
  - verification counts
  - Review Passport JSON and Markdown paths
  - handoff/report/replay/resume paths
  - Baseframe result path when using a Baseframe fixture
  - one `Next action`

Example real terminal content to recreate from the released CLI:

```text
AgentFlight finish

Readiness:
Blocked by failed verification

Changed files:
3

Verification:
1 passed, 1 failed

Review Passport:
- JSON: .agentflight/reports/<session-id>-review-passport.json
- Markdown: .agentflight/reports/<session-id>-review-passport.md

Artifacts:
- Handoff: .agentflight/reports/<session-id>-handoff.md
- Report: .agentflight/reports/<session-id>-proof.md
- Replay: .agentflight/reports/<session-id>-replay.html
- Resume: .agentflight/reports/<session-id>-resume.md
- Baseframe result: .baseframe/evidence/<task-id>/agentflight-result.json

Next action:
Fix the failed command, then rerun agentflight verify -- npm test -- auth
```

## Docs Page Update

Quickstart should become:

```bash
npx --yes agentflight@latest init
npx --yes agentflight@latest start --task "Add password reset flow"
npx --yes agentflight@latest verify -- npm test
npx --yes agentflight@latest snapshot --note "Implementation complete"
npx --yes agentflight@latest finish
npx --yes agentflight@latest history --limit 1
```

Update expected version examples to `0.15.0`.

Add a short Review Passport section:

```text
Review Passport

Run `agentflight finish` when the work needs a final local review packet.
AgentFlight writes `.agentflight/reports/<session-id>-review-passport.json`
and `.agentflight/reports/<session-id>-review-passport.md`, then prints the
artifacts and the next action. The passport stores source-free metadata only:
paths, commands, statuses, counts, timestamps, artifact paths, and hashes.
```

Update Baseframe workflow:

```bash
agentflight start \
  --from-task .baseframe/evidence/auth-password-reset-20260626-01/agentloopkit-task.json

agentflight verify -- npm run typecheck
agentflight verify -- npm test
agentflight verify -- npm run build

agentflight snapshot --note "Implementation complete"
agentflight finish

agentloopkit check-gates \
  --task auth-password-reset-20260626-01 \
  --from-agentflight .baseframe/evidence/auth-password-reset-20260626-01/agentflight-result.json
```

Command reference should list:

- `finish`: writes the Review Passport, refreshes handoff/report/replay/resume,
  and finalizes Baseframe result evidence when present.
- `finalize`: still available for Baseframe-only result generation.
- `handoff`: still available for the local review handoff and `handoff
--accept` receipt flow.

## Changelog Handling

Do not update the website changelog page by hand. The changelog is automated.
Let the release pipeline pick up v0.15.0 from GitHub and npm release metadata.
