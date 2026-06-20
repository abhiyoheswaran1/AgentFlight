# Dogfood local AgentFlight handoff workflow

- Created date: 2026-06-20
- Task type: docs
- Status: done

## Problem Statement
The new local handoff command needs real-repo dogfood before any version decision.

## Desired Outcome
Run the local built AgentFlight handoff flow in AgentFlight and one clean real app, document findings, clean dogfood artifacts, and keep the worktree clean.

## Constraints
- Use the local built CLI from this repo because handoff is not published yet.
- Do not version bump, push, tag, publish, or release.
- Do not modify repos with unrelated dirty worktrees.
- Clean dogfood runtime artifacts from sibling repos after collecting findings.

## Non-Goals
- Product feature implementation.
- Release work.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- docs/development/v0.6.0-handoff-dogfood-findings.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- AgentFlight handoff is dogfooded on a ready path and a blocked failure path.
- One clean real app repo is dogfooded with the same local handoff flow.
- Findings document captures usefulness, failure excerpt behavior, artifact paths, exit codes, and cleanup results.
- AgentFlight and real app worktrees are clean after cleanup except intentional documented findings in AgentFlight.

## Verification Commands
- npm run verify
- npm run format:check

## Post-Verification Gates
- No post-verification gate recorded. Use this for commands that need a fresh AgentLoop verification report.

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Dogfood commands create local .agentflight and .projscan-memory artifacts.

## Rollback Notes
Remove the findings doc and clean dogfood artifacts.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
