# Review Contract Claim Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic local Review Contract claim ledger that tells reviewers which claims are supported, stale, failed, unsupported, manually reviewable, or unknown.

**Architecture:** Add a pure `src/core/review-contract.ts` builder that consumes the existing Review Intelligence outputs. Attach the contract to `ReviewIntelligence`, then render compact contract sections in the existing terminal, Markdown, HTML, resume, and handoff surfaces.

**Tech Stack:** TypeScript, Vitest, existing AgentFlight renderers and command tests.

---

## File Structure

- Create `src/core/review-contract.ts`: pure claim-builder functions and status mapping.
- Modify `src/types/index.ts`: `ReviewContract`, `ReviewContractClaim`, status/source types, and `ReviewIntelligence.contract`.
- Modify `src/core/review-intelligence.ts`: build and attach contract after focus, proof gaps, and readiness are known.
- Modify `src/core/output.ts`: compact display helper for contract statuses.
- Modify `src/commands/status.ts`: include `review.contract` in JSON and render top claims in text.
- Modify `src/commands/handoff.ts`: parse/render compact contract claims from status JSON.
- Modify `src/renderers/markdown-report.ts`: render `## Review Contract`.
- Modify `src/renderers/html-replay.ts`: render escaped Review Contract section.
- Modify `src/renderers/resume-prompt.ts`: render Review Contract in continuation prompts.
- Create `tests/core/review-contract.test.ts`: TDD coverage for claim status rules and ordering.
- Update existing renderer/command tests for the new sections.
- Update `AGENTFLIGHT_DEVLOG.md`, `PRODUCT.md`, and `docs/architecture/overview.md`.

## Tasks

### Task 1: Core Claim Builder

**Files:**

- Create: `tests/core/review-contract.test.ts`
- Create: `src/core/review-contract.ts`
- Modify: `src/types/index.ts`

- [x] **Step 1: Write failing tests**

Add tests for:

- ready task + current proof -> supported task/file/readiness claims
- stale proof gap -> stale file and proof-gap claims
- failed verification gap -> failed claims
- missing source proof -> unsupported file and proof-gap claims
- docs/config not-required proof -> needs_review claim

- [x] **Step 2: Run tests to verify RED**

Run:

```bash
npm test -- tests/core/review-contract.test.ts
```

Expected: fail because `src/core/review-contract.ts` does not exist yet.

- [x] **Step 3: Implement minimal builder**

Implement pure helpers:

- `buildReviewContract(input)`
- `summarizeContractClaims(claims)`
- status mapping from readiness/focus/proof gaps
- deterministic IDs from source, index, and normalized file/gap IDs

- [x] **Step 4: Run tests to verify GREEN**

Run:

```bash
npm test -- tests/core/review-contract.test.ts
```

Expected: pass.

### Task 2: Attach Contract To Review Intelligence

**Files:**

- Modify: `src/core/review-intelligence.ts`
- Modify: `tests/core/review-intelligence.test.ts`

- [x] **Step 1: Write failing integration tests**

Add assertions that `buildReviewIntelligence()` returns `review.contract` for
ready, stale, and failed states.

- [x] **Step 2: Run RED**

```bash
npm test -- tests/core/review-intelligence.test.ts
```

Expected: fail because `ReviewIntelligence.contract` is missing.

- [x] **Step 3: Attach contract**

Call `buildReviewContract()` after readiness is built and return it as
`contract` on the review object.

- [x] **Step 4: Run GREEN**

```bash
npm test -- tests/core/review-intelligence.test.ts tests/core/review-contract.test.ts
```

Expected: pass.

### Task 3: Render Contract Surfaces

**Files:**

- Modify: `src/core/output.ts`
- Modify: `src/commands/status.ts`
- Modify: `src/commands/handoff.ts`
- Modify: `src/renderers/markdown-report.ts`
- Modify: `src/renderers/html-replay.ts`
- Modify: `src/renderers/resume-prompt.ts`
- Modify tests under `tests/commands/` and `tests/renderers/`

- [x] **Step 1: Write failing renderer/command tests**

Add tests that:

- status text contains `Review Contract`
- status JSON includes `review.contract.claims`
- Markdown report contains `## Review Contract`
- HTML replay escapes claim text and renders status labels
- resume prompt contains `## Review Contract`
- handoff contains compact contract claims

- [x] **Step 2: Run RED**

```bash
npm test -- tests/commands/evidence-output.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts
```

Expected: fail because renderers do not output the section yet.

- [x] **Step 3: Implement rendering**

Use a shared `formatReviewContractStatusForDisplay()` helper. Render compact
top claims in terminal/handoff, full compact lists in Markdown/replay/resume,
and preserve full structured JSON in status.

- [x] **Step 4: Run GREEN**

```bash
npm test -- tests/commands/evidence-output.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts
```

Expected: pass.

### Task 4: Bug, Security, Performance, Docs Pass

**Files:**

- Modify: docs/dev/product files as needed

- [x] **Bug pass**

Run focused tests plus `npm run verify`. Inspect any failure with root-cause
debugging before changing code.

Findings:

- `agentflight doctor` warned about missing root `test`, `build`,
  `typecheck`, and `lint` scripts even when `.agentflight/config.json` had
  configured verification commands. Fixed with a red/green doctor regression so
  monorepo subpackage commands satisfy setup guidance.
- Review Intelligence classified `npm run verify` as `unknown`, so
  AgentFlight's own configured verification command did not satisfy source/test
  proof gaps. Fixed with a red/green regression so passed verify scripts count
  as test-style proof.

- [x] **Security pass**

Confirm no new command execution, network calls, telemetry, source upload, or
unescaped HTML. The builder must use existing local metadata only.

Result: `review-contract.ts` is pure and uses existing local metadata only.
Security scan found no new network, upload, command execution, or unsafe HTML
paths in the touched review-contract surfaces. HTML escaping remains covered by
renderer tests.

- [x] **Performance pass**

Confirm the builder does no file I/O and runs O(focus rows + proof gaps). Use
existing full tests and a local status smoke to catch obvious latency problems.

Result: local `node dist/cli.js status --format json` smoke completed in about
1.1 seconds with the full dirty worktree. The new builder adds no file I/O.

- [x] **Docs pass**

Update devlog/product/architecture docs with user-facing behavior and internal
data-boundary notes.

Updated `CHANGELOG.md`, `AGENTFLIGHT_DEVLOG.md`, `PRODUCT.md`,
`docs/architecture/overview.md`, this plan, and the design note.

- [x] **Final verification**

Run:

```bash
npm test -- tests/core/review-contract.test.ts tests/core/review-intelligence.test.ts tests/commands/evidence-output.test.ts
npm run verify
npm run format:check
npx projscan@latest doctor --format json
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest verify
```

Results:

- Focused suite passed: 7 files / 100 tests.
- `npm run verify` passed: 25 files / 237 tests plus typecheck, lint, and
  build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.8.0`.
- `npm audit --audit-level=moderate` found 0 vulnerabilities.
- AgentFlight-captured `npm run verify` passed and moved Review Contract status
  to `Ready for review`, with 20 supported claims, 7 manual-review docs claims,
  and 0 unsupported claims.
- Built CLI monorepo doctor smoke passed: configured verification commands with
  no root scripts produced `Overall: OK`.
- ProjScan doctor passed with score 100/A.
- ProjScan preflight returned `caution` for scale-only manual sign-off:
  maximum changed-file risk score `228.9 >= 80`.
- ProjScan review returned `block` only for release-scale risk, with no new
  cycles, risky functions, dependency changes, contract changes, taint flows, or
  dataflow risks.
- AgentLoopKit verification passed and AgentLoop gates passed after handoff.
