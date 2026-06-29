# Website Update Prompt: AgentFlight Guard

Use this after the automated release that includes `agentflight guard`. Do not
update the website changelog page by hand. The release pipeline generates the
changelog from release metadata.

## Goal

Move AgentFlight from an end-of-session handoff story to a live trust story:

```text
AgentFlight Guard watches local proof while coding agents work.
Review Passport proves the final result.
```

Keep the product local-first and source-free. Do not imply hosted review,
automatic PR comments, telemetry, login, billing, team workflows, or cloud
storage.

## Hero

Recommended headline:

```text
Know if the agent is still safe to trust.
```

Supporting copy:

```text
AgentFlight Guard watches readiness, proof gaps, scope drift, Baseframe gates,
and one next action while your coding agent works locally. When the work is
ready, `agentflight finish` writes the Review Passport for reviewers and
AgentLoopKit.
```

Primary terminal visual:

Capture a real terminal run, not a fabricated mock:

```bash
agentflight guard --once
```

The capture should show:

- readiness
- changed files
- verification counts
- Finish targets with Review Passport JSON and Markdown paths
- Baseframe task and result target when using a Baseframe fixture
- blocking or warning trust signals
- one Next action line

## Feature Sections

Guard:

```text
Run AgentFlight Guard beside your coding agent. It refreshes the local trust
state without running hidden commands or sending source anywhere.
```

Review Passport:

```text
Run `agentflight finish` to write the final Review Passport, handoff, proof
report, replay, resume prompt, and Baseframe result artifact.
```

Baseframe:

```text
ProjScan finds the risk.
AgentLoopKit controls the work.
AgentFlight proves the result.
```

## CLI Examples

```bash
agentflight start --from-task .baseframe/evidence/auth-password-reset-20260626-01/agentloopkit-task.json
agentflight guard --once
agentflight verify -- npm run typecheck
agentflight verify -- npm test -- auth
agentflight finish
```

Optional JSON example:

```bash
agentflight guard --format json --once
```

## Copy Rules

- Say Guard watches local trust state.
- Say verification is still explicit through `agentflight verify`.
- Say Finish writes the final Review Passport.
- Say Baseframe evidence is local JSON.
- Do not claim cloud sync, automatic PR comments, identity approval, policy
  enforcement, or merge approval.
- Do not manually edit the website changelog page.
