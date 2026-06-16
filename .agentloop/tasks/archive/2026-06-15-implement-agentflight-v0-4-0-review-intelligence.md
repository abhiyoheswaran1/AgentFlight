# Implement AgentFlight v0.4.0 Review Intelligence

- Created date: 2026-06-16
- Task type: feature
- Status: done

## Problem Statement

AgentFlight needed deterministic local review intelligence so developers could see where to review first, what proof exists, what proof is missing, readiness, and the next safest action.

## Desired Outcome

Review focus ranking, proof gap detection, readiness states, and config-driven changed-file filters are implemented across status, report, replay, resume, and snapshot.

## Constraints

- Local-first only; no cloud, login, billing, Pro/Team gating, GitHub App, PR comments, JSON/CI integration, LLM calls, or source upload.
- Preserve v0.1/v0.2/v0.3 session compatibility.

## Non-Goals

- None recorded yet.

## Assumptions

- None recorded yet.

## Likely Files or Areas

- None recorded yet.

## Files or Areas Not to Touch

- None recorded yet.

## Acceptance Criteria

- Review focus ranking is deterministic and explainable.
- Proof gap detection and readiness are surfaced in status, report, replay, and resume.
- changedFileFilters.ignore works while built-in AgentFlight runtime filtering remains always on.
- npm run verify, format:check, npm pack --dry-run, npm audit, ProjScan, and AgentLoopKit checks are recorded.

## Verification Commands

- npm run verify
- npm run format:check
- npm pack --dry-run
- npm audit --audit-level=moderate

## Post-Verification Gates

- No post-verification gate recorded. Use this for commands that need a fresh AgentLoop verification report.

## Implementation Plan

- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes

- ProjScan preflight returned a scale/complexity caution during v0.4.0 audit; it was manually signed off because no concrete blocker remained.

## Rollback Notes

Revert the v0.4.0 review-intelligence commit or publish a patch disabling review intelligence output if a decision-layer regression is found.

## Handoff Requirements

- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
