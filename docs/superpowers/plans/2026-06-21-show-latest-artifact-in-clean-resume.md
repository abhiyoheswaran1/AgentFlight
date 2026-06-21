# Show Latest Artifact in Clean Resume Plan

**Goal:** Make clean-worktree `agentflight resume` carry the same local
open-first artifact shortcut as status and history.

**Architecture:** Extend the shared artifact helper with a read/choose/null
function and use it from resume for clean text output only.

**Tech Stack:** TypeScript, Vitest, AgentFlight resume/status artifact helpers.

## Tasks

- [x] Add a failing clean-resume test after handoff/replay artifacts exist.
- [x] Add shared `readOpenFirstArtifact` helper.
- [x] Use the helper from clean resume and clean status.
- [x] Run focused evidence-output tests.
- [x] Run the full bug pass, handoff, archive the task, and commit the scoped
      change.
