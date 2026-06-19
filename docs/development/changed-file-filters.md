# Changed-File Filters

AgentFlight keeps changed-file analysis local and deterministic. It reads git status, filters its own runtime artifacts, applies optional project filters, and then computes risk, review focus, proof gaps, reports, replays, resumes, and snapshots from the remaining files.

## Always-On Runtime Filters

AgentFlight always excludes its own runtime artifacts:

- `.agentflight/sessions/**`
- `.agentflight/reports/**`
- `.agentflight/current/**`
- `.agentflight/evidence/**`

These files are evidence and generated session data. Including them would make AgentFlight pollute its own risk and review output.

`.agentflight/config.json` stays visible because it is user-controlled project configuration and may be intentionally committed.

AgentFlight classifies `.agentflight/config.json` as AgentFlight project config. It remains reviewable without being treated as an unknown file.

`agentflight init` uses the same framing in its first-run output: `config.json`
is project configuration, while `sessions/`, `reports/`, `current/`, and
`evidence/` are local runtime evidence.

AgentFlight also excludes local AgentLoopKit evidence when it appears in the
same worktree:

- `.agentloop/state.json`
- `.agentloop/reports/**`
- `.agentloop/handoffs/**`
- `.agentloop/runs/**`

These paths are local loop state, verification reports, handoffs, and run
ledgers. AgentLoopKit project contracts and repo guidance stay visible,
including `.agentloop/tasks/**`, `.agentloop/policies/**`,
`.agentloop/harness/**`, and `.agentloop/gates/**`.

## Project Filters

Use `.agentflight/config.json` to hide generated or internal files that should not affect review intelligence:

```json
{
  "changedFileFilters": {
    "ignore": [".projscan-memory/**"]
  }
}
```

You can add other local patterns when they match your repo policy:

```json
{
  "changedFileFilters": {
    "ignore": [".projscan-memory/**", "coverage/**", "dist/**", ".next/**"]
  }
}
```

Ignored files do not appear in:

- `agentflight status`
- `agentflight report`
- `agentflight replay`
- `agentflight resume`
- `agentflight snapshot` risk and review summaries

Keep filters conservative. Do not ignore generated files that reviewers are expected to inspect.

If `.projscan-memory/memory.json` appears in changed-file analysis during first
run or dogfood work, AgentFlight will suggest adding `.projscan-memory/**` here.
It does not ignore that path by default because some teams may want generated
tool state to remain visible. Treat the suggestion as a local repo-policy
decision: add the filter only when ProjScan memory is generated evidence rather
than a file reviewers should inspect.

## Supported Pattern Shape

The MVP filter supports:

- exact paths, such as `.projscan-memory/memory.json`
- directory prefixes ending with `/**`, such as `.projscan-memory/**`
- simple basename wildcards, such as `*.log`

Malformed or empty patterns are ignored rather than crashing the CLI.
