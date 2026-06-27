# Baseframe Suite Integration v1

- Created date: 2026-06-26
- Task type: feature
- Status: done

## Problem Statement
AgentFlight needs to consume versioned Baseframe ProjScan and AgentLoopKit evidence artifacts, compare expected scope and verification against execution evidence, and emit a unified AgentFlight result artifact.

## Desired Outcome
AgentFlight can start from an AgentLoopKit task contract, resolve the linked ProjScan assessment, persist integration context, detect scope drift, reconcile verification gates, compute unified readiness, render the evidence, and write .baseframe/evidence/<task-id>/agentflight-result.json plus workflow manifest updates without depending on other repos.

## Constraints
- Do not import ProjScan or AgentLoopKit internals; use local versioned JSON artifacts.
- Preserve existing .agentflight session, report, replay, resume, and evidence workflows.
- Do not version bump, commit, push, tag, publish, or modify ProjScan or AgentLoopKit repositories.
- Use deterministic safe local path handling and atomic writes for Baseframe artifacts.

## Non-Goals
- Cloud, login, billing, GitHub App, team features, or merging the products.

## Assumptions
- None recorded yet.

## Likely Files or Areas
- src/
- tests/
- docs/
- README.md

## Files or Areas Not to Touch
- None recorded yet.

## Acceptance Criteria
- agentflight start --from-task persists Baseframe integration context and resolves sourceAssessment.path.
- agentflight finalize writes a valid Baseframe agentflight-result.json and updates .baseframe/agent-workflow.json.
- Scope drift, verification gates, imported review focus, proof gaps, and unified readiness are reflected in status/report/replay/resume output.

## Verification Commands
- npm run test -- --run
- npm run typecheck
- npm run lint
- npm run build
- npm run format:check
- npm pack --dry-run
- npm audit

## Post-Verification Gates
- No post-verification gate recorded. Use this for commands that need a fresh AgentLoop verification report.

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- CLI and package API changes require backward compatibility tests.
- Safe path validation must avoid reading unsafe external artifacts while still supporting repository-relative paths with spaces.

## Rollback Notes
Revert Baseframe integration source, tests, docs, and generated task artifacts; existing AgentFlight workflows should remain unchanged.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
