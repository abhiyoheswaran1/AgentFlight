# Verification

AgentFlight uses local verification only. Do not claim completion unless the command actually ran and passed.

## Capturing AgentFlight Evidence

Use `agentflight verify` to record proof in the current session, including the command result and local output files.

Run one command explicitly:

```bash
agentflight verify -- npm test
```

Or configure commands in `.agentflight/config.json`:

```json
{
  "verification": {
    "commands": ["npm run typecheck", "npm run lint", "npm test", "npm run build"],
    "profiles": {
      "quick": ["npm run typecheck", "npm test"],
      "release": ["npm run verify"]
    }
  }
}
```

Then run:

```bash
agentflight verify
```

Or run a named local command group:

```bash
agentflight verify --profile quick
```

Profiles are only local config aliases. They do not change how verification
evidence is captured, and they do not add CI, JSON output, remote presets, or
background execution.

Each verification run records:

- command
- start and finish timestamps
- duration
- exit code
- passed or failed status
- stdout path
- stderr path

Raw command output is stored locally under `.agentflight/evidence/`. It is ignored by git by default.

`agentflight verify` prints an `Evidence saved:` block for each run so the local stdout and stderr files are visible immediately. If a command fails, AgentFlight records the failure, prints the evidence paths, and suggests rerunning the exact command after fixing the issue.

For long-running commands, AgentFlight prints a small heartbeat such as:

```text
AgentFlight verify still running after 30s...
```

The heartbeat is AgentFlight console output only. It is not written into the captured stdout/stderr evidence files.

Verification commands also write session events:

- `verification_started`
- `verification_passed`
- `verification_failed`

These events appear in reports and replays next to snapshots and generated artifacts.

If a process is interrupted after `verification_started` but before a completed result is recorded, AgentFlight treats that as incomplete verification. Status, reports, replays, and resume prompts surface the incomplete command as a proof gap and suggest rerunning it.

## Primary Commands

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run verify
```

`npm run verify` runs:

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

## Tooling Checks

ProjScan and AgentLoopKit are part of the development workflow:

```bash
npm run projscan
npm run agentloopkit:doctor
```

These commands should provide guidance and evidence, but the core `verify` script avoids brittle coupling to changing tool output formats.

## Report Honesty

AgentFlight reports must not say tests passed unless they have evidence from an actual command run. Missing proof should remain visible as a gap.

`agentflight status`, `agentflight report`, `agentflight replay`, and `agentflight resume` read captured verification runs. A failed verification run blocks review readiness until the command is fixed or rerun successfully.

An incomplete verification attempt also prevents `Ready for review` until a later completed result covers the same command.

## Proof Gap Detection

AgentFlight v0.4.0 uses deterministic local rules to connect changed files to missing proof. It does not call an LLM and does not upload source code.

Examples:

- Auth, security, billing, or database files changed without passing test evidence.
- Backend/API files changed without passing test or build evidence.
- Dependency files changed without install, build, typecheck, or test evidence.
- Config or CI files changed without lint, typecheck, or build evidence.
- Docs-only changes do not require proof by default.

When AgentFlight can infer a matching configured command, it suggests the exact `agentflight verify -- <command>` next action. If it cannot infer a command, it reports the gap without inventing proof.
