# AgentFlight Repo Default Verification Plan

**Goal:** Make AgentFlight's own tracked config dogfood the no-arg verification
workflow that the product recommends for coding agent sessions.

**Architecture:** Use the existing `.agentflight/config.json` verification
contract. Do not change CLI behavior.

**Tech Stack:** AgentFlight config JSON, existing npm scripts.

## Tasks

- [x] Capture the current failure mode with no-arg `agentflight verify`.
- [x] Set `.agentflight/config.json` to run `npm run verify` by default.
- [x] Confirm `agentflight doctor` no longer warns about empty verification
      commands.
- [x] Confirm no-arg `agentflight verify` runs the configured proof command.
- [x] Run the bug pass, handoff, archive the task, and commit the scoped change.
