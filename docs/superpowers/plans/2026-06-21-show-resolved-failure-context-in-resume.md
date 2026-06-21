# Show Resolved Failure Context in Resume Plan

**Goal:** Make `agentflight resume` show the same unresolved/resolved
failed-run context as status and reports.

**Architecture:** Reuse `formatVerificationFailureContext` in resume prompt
rendering. Do not change verification capture or evidence storage.

**Tech Stack:** TypeScript, Vitest, AgentFlight resume renderer.

## Tasks

- [x] Add failing resume assertions for unresolved and historical failed-run
      context.
- [x] Render verification failure context below the resume verification count.
- [x] Run focused evidence-output tests.
- [x] Run the full bug pass, handoff, archive the task, and commit the scoped
      change.
