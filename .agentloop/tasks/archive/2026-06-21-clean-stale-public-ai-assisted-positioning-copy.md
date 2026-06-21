# Clean stale public AI-assisted positioning copy

- Created date: 2026-06-21
- Task type: docs
- Status: done

## Problem Statement
Public architecture docs still describe AgentFlight as wrapping AI-assisted coding sessions, while the current product direction avoids assistant-style positioning and uses coding agent sessions / agentic engineering language.

## Desired Outcome
Public docs and runtime surfaces have a regression test that prevents stale AI coding / AI-assisted / coding assistant positioning from returning, while historical devlog and archived task evidence remain unchanged.

## Constraints
- Docs and regression-test cleanup only.
- Do not rewrite historical devlog evidence or archived task contracts.
- No product feature work, release, version bump, push, tag, publish, PR comments, JSON/CI, export modes, cloud, login, billing, or hosted features.

## Non-Goals
- No website implementation.
- No broad marketing rewrite.

## Assumptions
- Current preferred language is coding agent sessions, coding agents, and agentic engineering.

## Likely Files or Areas
- docs/architecture/overview.md
- tests/public-positioning.test.ts
- CHANGELOG.md
- AGENTFLIGHT_DEVLOG.md

## Files or Areas Not to Touch
- package.json
- package-lock.json
- .agentflight/evidence/**
- .agentflight/reports/**

## Acceptance Criteria
- A focused test fails when public docs/runtime surfaces contain stale AI-assisted, AI coding, AI-agent, or coding assistant positioning.
- docs/architecture/overview.md uses coding agent sessions language.
- Historical devlogs and archived task contracts are excluded from the regression scan.

## Verification Commands
- npm test -- tests/public-positioning.test.ts
- npm run verify
- npm run format:check
- npm pack --dry-run
- npx projscan@latest doctor --format json
- npx projscan@latest preflight --mode before_commit --format json
- npx projscan@latest review --format json
- npx agentloopkit@latest verify

## Post-Verification Gates
- npx agentloopkit@latest check-gates

## Implementation Plan
- Inspect relevant files before editing.
- Keep changes focused on this contract.
- Record any architecture decision in DECISIONS.md.

## Risk Notes
- Re-check protected areas before changing migrations, auth, secrets, billing, deployment, or public APIs.

## Rollback Notes
Revert the public positioning scan test, docs copy, and documentation notes from this task.

## Handoff Requirements
- Summarize files changed.
- Include verification commands and results.
- State unverified areas honestly.
- Include risks, rollback notes, and reviewer checklist.
