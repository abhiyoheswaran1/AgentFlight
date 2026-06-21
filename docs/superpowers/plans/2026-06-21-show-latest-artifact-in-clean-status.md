# Show Latest Artifact in Clean Status Plan

**Goal:** Make clean-worktree `agentflight status` directly reopen the latest
local review artifact when the current session already has one.

**Architecture:** Extract the existing history artifact path and open-first
selection logic into a core helper. Use it from status only for clean text output
so JSON stays stable.

**Tech Stack:** TypeScript, Vitest, AgentFlight status/history commands.

## Tasks

- [x] Add a failing clean-status test after handoff/replay artifacts exist.
- [x] Extract shared artifact path and open-first selection helpers.
- [x] Use the shared helper from history and clean status text output.
- [x] Run focused evidence/history tests.
- [x] Run the full bug pass, handoff, archive the task, and commit the scoped
      change.
