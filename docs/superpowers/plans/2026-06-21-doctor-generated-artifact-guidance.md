# Doctor Generated Artifact Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `agentflight doctor` give concise first-run guidance when generated ProjScan memory is present.

**Architecture:** Keep changed-file filtering unchanged. `runDoctorCommand` reads local artifact/config state and passes booleans into `evaluateDoctorChecks`, which adds a dynamic check only when `.projscan-memory/memory.json` exists.

**Tech Stack:** TypeScript, Vitest, AgentFlight doctor command.

---

### Task 1: Red Tests

**Files:**

- Modify: `tests/core/doctor.test.ts`
- Modify: `tests/commands/workflow.test.ts`

- [x] Add a core doctor test where `projscanMemoryPresent: true` and
      `projscanMemoryIgnored: false` produces a warning named `generated tool state`
      with a `.projscan-memory/**` `changedFileFilters.ignore` suggestion.
- [x] Add a core doctor test where the same file is present but ignored, and the
      check reports OK.
- [x] Add a command workflow test that creates `.projscan-memory/memory.json`,
      runs doctor, and sees the warning before adding the ignore pattern.
- [x] Run `npm test -- tests/core/doctor.test.ts tests/commands/workflow.test.ts`
      and confirm the new assertions fail.

### Task 2: Doctor State Wiring

**Files:**

- Modify: `src/commands/doctor.ts`
- Modify: `src/core/doctor.ts`

- [x] In `runDoctorCommand`, check whether
      `.projscan-memory/memory.json` exists.
- [x] Safely read `.agentflight/config.json` only after it is known valid.
- [x] Use existing `filterChangedFiles` behavior to decide whether configured
      filters already hide `.projscan-memory/memory.json`.
- [x] Add optional doctor evaluation fields for ProjScan memory presence and
      configured filtering.
- [x] Add one dynamic doctor check only when the file exists.

### Task 3: Docs, Bug Pass, And Handoff

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `AGENTFLIGHT_DEVLOG.md`

- [x] Update docs with the user-research finding and implementation summary.
- [x] Run targeted tests.
- [x] Run `npm run verify`, `npm run format:check`, package/audit checks, and
      ProjScan/AgentLoopKit checks.
- [x] Dogfood doctor in a temp repo with visible and filtered ProjScan memory.
- [x] Archive the AgentLoop task and commit only intended files.
