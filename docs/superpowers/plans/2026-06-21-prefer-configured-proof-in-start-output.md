# Prefer Configured Proof in Start Output Plan

**Goal:** Make `agentflight start` show the configured no-arg verification path
when `.agentflight/config.json` already has verification commands.

**Architecture:** Load existing AgentFlight config for output guidance only.
Keep detected package commands stored on the session so Review Intelligence keeps
its granular proof hints.

**Tech Stack:** TypeScript, Vitest, AgentFlight start command.

## Tasks

- [x] Add failing workflow assertions for configured and empty-config start
      output.
- [x] Add start-output formatting that prefers `agentflight verify` when config
      commands exist.
- [x] Preserve detected package-script fallback when config commands are empty.
- [x] Run focused workflow tests.
- [x] Run the full bug pass, handoff, archive the task, and commit the scoped
      change.
