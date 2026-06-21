# Proof Freshness Review Contract Design

## Product Goal

AgentFlight should tell reviewers whether verification evidence still applies to
the current changed files. The product should move from "proof exists" to "this
handoff is backed by current proof" without adding cloud, CI, PR comments,
telemetry, or source upload.

The user-facing promise:

> AgentFlight tells you whether the proof still applies, or whether code changed
> after the proof was captured.

## User Pain

Coding-agent sessions often look safe because a test passed earlier. That proof
can become stale when the agent edits a file after verification, when a new file
is added after proof, or when a passing command covered only an earlier worktree
state. Reviewers need AgentFlight to expose this directly instead of forcing
them to infer it from timestamps.

## Scope

In scope:

- Store a local proof snapshot on each completed verification run.
- Derive a proof contract from current changed files, proof requirements, and
  verification snapshots.
- Distinguish current proof, stale proof, missing proof, failed proof, no-proof
  required, and legacy unknown freshness.
- Surface proof freshness in status, handoff, Markdown report, HTML replay,
  resume, snapshot metadata, history-derived readiness, and JSON status.
- Keep legacy sessions readable.
- Keep all data local and source-free: store file paths, file state, sizes, and
  SHA-256 content hashes, never source text.

Out of scope:

- Release, tag, publish, or version bump.
- PR comments, hosted review, login, billing, database, cloud, or telemetry.
- JSON/CI expansion beyond existing status JSON carrying the new local fields.
- Exact test coverage analysis. The contract proves worktree freshness, not
  semantic test adequacy.

## Architecture

Add a small proof-snapshot module under `src/core/proof-snapshot.ts`.

The module builds a normalized local snapshot:

- schema version
- capture timestamp
- git commit
- sorted changed files
- per-file fingerprints
- aggregate fingerprint hash

Per-file fingerprints store:

- repo-relative path
- state: `present`, `deleted`, or `unreadable`
- size for present files
- SHA-256 hash for present files
- reason for unreadable files

`agentflight verify` captures a proof snapshot after each command finishes and
stores it on `VerificationRun.proofSnapshot`. Capturing after the command is
intentional: verification should describe the file state that existed when proof
completed.

`buildReviewIntelligence` accepts an optional current proof snapshot. Command
surfaces that already inspect changed files build one current snapshot from the
same filtered changed-file list and pass it through. If no current snapshot is
available, Review Intelligence keeps legacy behavior.

## Contract States

The derived contract state is:

- `current`: at least one relevant passing proof command matches the current
  changed-file fingerprints.
- `stale`: relevant proof exists, but the current changed-file fingerprints no
  longer match the proof snapshot.
- `missing`: proof is required and no relevant passing proof command exists.
- `failed`: unresolved failed verification exists.
- `not_required`: current changes do not require proof.
- `covered`: legacy sessions have passing proof but no freshness snapshot.
- `unknown`: unavailable file fingerprints prevent freshness evaluation, but
  existing evidence remains readable.

`ReviewProofStatus` gains `stale` so review focus can say exactly which files
need fresh proof.

## Readiness Rules

Existing failed verification behavior remains highest priority:

1. Unresolved failed verification -> `blocked_by_failed_verification`.
2. Incomplete verification -> `needs_verification`.
3. Stale required proof -> `needs_verification`.
4. Missing required proof -> `needs_verification`.
5. Clean worktree -> `clean_worktree`.
6. Proof current or proof not required -> `ready_for_review`.

Legacy covered proof does not block readiness when the old proof-kind model
already considered the session ready. It is shown as `Proof: covered` so old
sessions stay useful while new sessions get stronger guarantees.

## Surfaces

- Status, handoff, Markdown report, HTML replay, and resume show a compact
  proof-status line on each review focus item.
- JSON status carries the same `review.focus[].proofStatus` and
  `review.proofGaps` data as text output.
- Stale proof handoffs exit non-zero through existing `needs_verification`.
- Snapshot metadata records stale proof through readiness and proof-gap count.
- History continues to show recorded readiness from generated artifact events,
  so stale-proof sessions appear as `Needs verification` without a separate
  history schema.

## Security

- No network calls.
- No source text is stored, printed, uploaded, or included in reports.
- File hashes are local runtime evidence under `.agentflight/`.
- Runtime `.agentflight/sessions`, `.agentflight/reports`,
  `.agentflight/evidence`, and `.agentflight/current` remain ignored.
- Unreadable files produce an `unknown` or stale contract instead of crashing
  review surfaces.

## Performance

- Hash only current changed files, not the whole repository.
- Use streaming SHA-256 for file content.
- Sort and hash normalized fingerprint rows for deterministic comparisons.
- Keep status responsive for common small changed-file sets.
- Add focused performance-style tests around many small changed files and
  unreadable/missing files.

## Phased Delivery

1. Proof snapshot capture and backward-compatible session types.
2. Review Intelligence proof contract and stale-proof gaps.
3. Status and handoff surfaces.
4. Report, replay, resume, and history surfaces.
5. Docs and product copy.
6. Bug, security, performance, and dogfood passes.

Each phase gets a red test, implementation, focused verification, and a bug pass
before moving to the next phase.
