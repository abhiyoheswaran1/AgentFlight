# Clarify Clean Resume Constraints Plan

**Goal:** Make clean-worktree resume prompts clear that unrelated work should
start in a new AgentFlight session.

**Architecture:** Render constraints from the existing readiness state. Keep
non-clean prompts on the existing strict current-task constraints.

**Tech Stack:** TypeScript, Vitest, AgentFlight resume prompt renderer.

## Tasks

- [x] Add failing assertions for clean and non-clean resume constraints.
- [x] Render clean-specific constraints for `clean_worktree` readiness.
- [x] Keep non-clean constraints unchanged.
- [x] Run focused evidence-output tests.
- [x] Run the full bug pass, handoff, archive the task, and commit the scoped
      change.
