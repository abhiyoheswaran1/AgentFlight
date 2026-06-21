# Proof Freshness Review Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build proof freshness so AgentFlight can tell whether verification evidence still applies to the current changed files.

**Architecture:** Add local proof snapshots to verification runs, derive a proof contract in Review Intelligence, and render that contract across review surfaces. Keep the implementation local-only, backwards-compatible, and source-free by storing file hashes rather than file contents.

**Tech Stack:** TypeScript, Node.js `crypto` and `fs` streams, Vitest, existing AgentFlight command/rendering architecture.

**Implementation status:** Phases 1-5 have been implemented with the smaller
proof-status design that emerged during the build: each review focus item shows
`current`, `stale`, `covered`, `missing`, `failed`, `not required`, or
`unknown`, and stale proof creates a proof gap/readiness block. Phase 6 full
verification and dogfood remains before release approval.

---

## File Map

- Create `src/core/proof-snapshot.ts`: builds and compares local changed-file fingerprints.
- Modify `src/types/index.ts`: add proof snapshot and proof contract types.
- Modify `src/core/verification.ts`: capture proof snapshots on verification runs.
- Modify `src/core/review-intelligence.ts`: derive proof contract, stale gaps, and `stale` proof status.
- Modify `src/commands/status.ts`: build current proof snapshot once and render/serialize proof contract.
- Modify `src/commands/handoff.ts`: parse and render proof contract.
- `src/commands/history.ts` reads recorded readiness from generated artifact
  metadata, so stale proof appears as `Needs verification` without a new
  history-specific schema.
- Modify `src/renderers/markdown-report.ts`: add proof-status lines to review focus.
- Modify `src/renderers/html-replay.ts`: add escaped proof-status lines to review focus.
- Modify `src/renderers/resume-prompt.ts`: include proof-status lines in continuation prompts.
- Modify focused tests under `tests/core`, `tests/commands`, and `tests/renderers`.
- Modify `README.md`, `PRODUCT.md`, `CHANGELOG.md`, `AGENTFLIGHT_DEVLOG.md`, and architecture docs after behavior is implemented.
- Do not bump `package.json`.
- Do not tag, publish, or release.

## Phase 1: Proof Snapshot Capture

- [ ] Write failing tests in `tests/core/proof-snapshot.test.ts`:
  - builds deterministic hashes for changed files independent of input order
  - marks deleted files without reading content
  - never includes source text in serialized snapshots
  - detects a file changed after a prior snapshot
- [ ] Run `npm test -- tests/core/proof-snapshot.test.ts` and confirm failure because the module does not exist.
- [ ] Add `src/core/proof-snapshot.ts` with `buildProofSnapshot`, `compareProofSnapshotToCurrent`, and helper types.
- [ ] Run `npm test -- tests/core/proof-snapshot.test.ts` and confirm pass.
- [ ] Add failing tests in `tests/commands/verify.test.ts` asserting `verificationRuns[0].proofSnapshot` exists after `agentflight verify` and raw stdout/stderr evidence is unchanged.
- [ ] Run the focused verify test and confirm failure before implementation.
- [ ] Update `VerificationRun` types and `runVerificationCommand` to capture a post-run proof snapshot.
- [ ] Run `npm test -- tests/core/proof-snapshot.test.ts tests/commands/verify.test.ts`.
- [ ] Bug pass: test unreadable/missing file behavior and verify the snapshot degrades to `unreadable` rather than crashing.

## Phase 2: Review Intelligence Contract

- [ ] Add failing tests in `tests/core/review-intelligence.test.ts`:
  - proof is `current` when a relevant passing run snapshot matches current changed files
  - proof is `stale` when a file changes after proof
  - proof is `stale` when a new required file appears after proof
  - proof is `failed` when unresolved failed verification exists
  - proof is `missing` when proof is required and no relevant passing proof exists
  - proof is `not_required` for docs-only changes
  - proof is `unknown` for legacy passing runs without snapshots and does not break old readiness
- [ ] Run `npm test -- tests/core/review-intelligence.test.ts` and confirm the new tests fail.
- [ ] Extend `ReviewProofStatus` with `stale` and add `ReviewProofContract` types.
- [ ] Update `buildReviewIntelligence` to accept `currentProofSnapshot`.
- [ ] Add stale-proof proof gaps with stable IDs:
  - `stale-verification-proof`
  - `missing-*-proof` existing IDs stay unchanged
  - `failed-verification` remains highest priority
- [ ] Update readiness reason and next action for stale proof:
  - reason: `Verification proof is stale for current changed files.`
  - next action: `Rerun agentflight verify -- <command>` when a command is known
- [ ] Run `npm test -- tests/core/review-intelligence.test.ts`.
- [ ] Bug pass: verify legacy sessions, failed-then-passed sessions, generated `.projscan-memory/memory.json`, and docs-only sessions still behave correctly.

## Phase 3: Status And Handoff Surfaces

- [ ] Add failing tests in `tests/commands/evidence-output.test.ts`:
  - status text shows `Proof contract:` with `Current`
  - status text shows stale proof and suggests rerunning the command
  - status JSON includes `review.proofContract`
  - handoff includes `Proof contract:` and exits non-zero for stale required proof
  - handoff exits zero when proof is current
- [ ] Run `npm test -- tests/commands/evidence-output.test.ts` and confirm failure.
- [ ] Update `runStatusCommand` to build the current proof snapshot from the same filtered changed files used for risk/review.
- [ ] Add `formatProofContract` helper in `src/core/output.ts`.
- [ ] Render proof contract in status text and JSON.
- [ ] Parse/render proof contract in `src/commands/handoff.ts`.
- [ ] Run `npm test -- tests/commands/evidence-output.test.ts`.
- [ ] Bug pass: run status/handoff against clean worktree, stale proof, failed proof, and legacy no-snapshot sessions.

## Phase 4: Report, Replay, Resume, And History

- [ ] Add failing tests:
  - `tests/renderers/markdown-report.test.ts`: report has `## Proof Contract`
  - `tests/renderers/html-replay.test.ts`: replay renders current/stale proof contract and escapes file/command text
  - `tests/renderers/resume-prompt.test.ts`: resume includes proof contract and next action
  - `tests/commands/history.test.ts`: history shows recorded proof-contract state when report/replay metadata exists
- [ ] Run those focused tests and confirm failure.
- [ ] Update artifact metadata in `buildArtifactReviewMetadata` and `SessionReviewSummary` to carry proof-contract state/label/summary.
- [ ] Update Markdown, HTML, resume, and history renderers.
- [ ] Run focused renderer/history tests.
- [ ] Bug pass: confirm passing run details stay tucked where they should, failed excerpts remain stderr-preferred, and HTML escaping remains safe.

## Phase 5: Docs And Product Copy

- [ ] Update `PRODUCT.md` with proof freshness positioning.
- [ ] Update `README.md` with the trust-validity promise and one short stale-proof example.
- [ ] Update `docs/architecture/overview.md` with the proof-snapshot architecture.
- [ ] Add `CHANGELOG.md` unreleased section without changing package version.
- [ ] Add `AGENTFLIGHT_DEVLOG.md` development evidence as phases complete.
- [ ] Run the public-positioning test or stale-copy scan so wording stays on `coding agent sessions` / agentic engineering.

## Phase 6: Verification, Dogfood, And Release-Readiness Audit

- [ ] Run focused tests:
  - `npm test -- tests/core/proof-snapshot.test.ts tests/core/review-intelligence.test.ts tests/commands/verify.test.ts tests/commands/evidence-output.test.ts tests/commands/history.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts`
- [ ] Run full verification:
  - `npm run verify`
  - `npm run format:check`
  - `npm pack --dry-run`
  - `npm audit --audit-level=moderate`
  - `npx projscan@latest doctor --format json`
  - `npx projscan@latest preflight --mode before_commit --format json`
  - `npx projscan@latest review --format json`
  - `npx agentloopkit@latest verify`
- [ ] Dogfood with local built CLI:
  - start a fresh AgentFlight session
  - create a source change
  - run passing verification
  - change the same file after verification
  - confirm status/handoff report stale proof
  - rerun verification
  - confirm status/handoff report current proof
- [ ] Run bug/security/performance pass:
  - no source text in session JSON
  - no hidden network calls
  - no dependency changes
  - stale proof works with renamed/deleted files
  - hashing many small files is acceptable
  - legacy sessions do not crash
- [ ] Generate AgentFlight handoff and AgentLoopKit handoff.
- [ ] Stop before release and report readiness for user approval.
