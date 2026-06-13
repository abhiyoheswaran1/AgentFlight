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
    "commands": ["npm run typecheck", "npm run lint", "npm test", "npm run build"]
  }
}
```

Then run:

```bash
agentflight verify
```

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

Verification commands also write session events:

- `verification_started`
- `verification_passed`
- `verification_failed`

These events appear in reports and replays next to snapshots and generated artifacts.

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
