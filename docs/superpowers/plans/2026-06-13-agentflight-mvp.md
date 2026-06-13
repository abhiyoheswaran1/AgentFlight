# AgentFlight MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first local-first AgentFlight TypeScript npm CLI with session recording, risk summaries, reports, replays, resume prompts, doctor checks, and ProjScan/AgentLoopKit dogfooding.

**Architecture:** Use a small ESM Node CLI built with commander. Keep command handlers thin and move behavior into composable `src/core`, `src/adapters`, and `src/renderers` modules with safe filesystem writes and defensive child-process wrappers.

**Tech Stack:** Node.js 20+, TypeScript, commander, Vitest, ESLint, Prettier, ProjScan, AgentLoopKit.

---

### Task 1: Project Foundation

**Files:**

- Modify: `package.json`
- Create: `tsconfig.json`, `tsconfig.build.json`, `eslint.config.js`, `vitest.config.ts`, `.prettierrc.json`, `.prettierignore`, `.editorconfig`, `.gitignore`

- [x] Install `projscan@latest` and `agentloopkit@latest`.
- [x] Run `projscan init`, `projscan start --intent ...`, `agentloopkit init`, `agentloopkit doctor`, and `agentloopkit create-task`.
- [x] Add build, test, typecheck, lint, format, check, verify, projscan, and agentloop scripts.

### Task 2: Core Behavior With Tests

**Files:**

- Create: `tests/core/*.test.ts`
- Create: `src/core/*.ts`
- Create: `src/types/index.ts`

- [ ] Write failing Vitest coverage for config creation, safe writes, session creation, git helpers, risk categorisation, verification command detection, and doctor checks.
- [ ] Implement minimal core modules until tests pass.

### Task 3: Adapters and Renderers

**Files:**

- Create: `tests/adapters/*.test.ts`, `tests/renderers/*.test.ts`
- Create: `src/adapters/projscan.ts`, `src/adapters/agentloopkit.ts`
- Create: `src/renderers/markdown-report.ts`, `src/renderers/html-replay.ts`, `src/renderers/resume-prompt.ts`

- [ ] Write failing tests for defensive adapter fallback behavior and generated Markdown/HTML/resume output.
- [ ] Implement adapters and renderers with no network upload, no telemetry, and no full diff contents.

### Task 4: CLI Commands

**Files:**

- Create: `src/cli.ts`
- Create: `src/commands/*.ts`
- Modify: `tests/cli/*.test.ts`

- [ ] Add `init`, `start`, `status`, `report`, `replay`, `resume`, and `doctor` commands.
- [ ] Keep terminal output concise and truthful.
- [ ] Add placeholders for future `upgrade`, `license`, and `login` commands that state Pro/Team is not available yet.

### Task 5: Documentation and Dogfooding

**Files:**

- Modify: `README.md`
- Create: `AGENTFLIGHT_DEVLOG.md`
- Create: `docs/architecture/overview.md`, `docs/development/dogfooding.md`, `docs/development/verification.md`, `docs/roadmap.md`, `docs/monetisation.md`

- [ ] Document commands discovered and used for ProjScan and AgentLoopKit.
- [ ] Build, run AgentFlight against this repo, and record dogfooding evidence.
- [ ] Run `npm run verify` before claiming completion.
