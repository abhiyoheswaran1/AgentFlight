# Review Contract Claim Ledger Design

Date: 2026-06-21

## Product Goal

Make AgentFlight's review artifact more explicit: instead of asking a reviewer
to infer trust from focus rows, proof gaps, readiness, and verification runs,
AgentFlight should list the concrete review claims it can make and show whether
each claim is supported, stale, failed, unsupported, manually reviewable, or
unknown.

## Non-Goals

- No model-based or LLM claim extraction.
- No source-code upload, telemetry, cloud sync, login, billing, database, or
  hosted workflow.
- No PR comments, JSON/CI contract, export modes, or named verification
  profile expansion.
- No release in this task.

## Local Data Boundary

The Review Contract is derived only from existing local AgentFlight evidence:

- session task title
- changed file paths and risk categories
- Review Intelligence focus rows
- proof gaps
- readiness state
- verification status and proof freshness already captured by AgentFlight

It stores and renders file paths, status labels, commands, proof-gap IDs, and
short reasons. It does not store source text, diffs, stdout/stderr bodies beyond
existing excerpts, or any external service result not already present locally.

## Claim Model

`ReviewContract` contains:

- `summary`: counts by status and total count.
- `claims`: deterministic ordered claim rows.

Each claim has:

- `id`: stable deterministic ID.
- `text`: concise claim text.
- `status`: `supported`, `needs_review`, `unsupported`, `failed`, `stale`,
  `not_testable`, or `unknown`.
- `source`: `task`, `file`, `proof_gap`, or `readiness`.
- `reason`: short local explanation.
- `files`: related repo-relative paths.
- `evidence`: compact local evidence labels.
- `relatedProofGapIds`: proof-gap IDs when applicable.
- optional `suggestedCommand` and `nextAction`.

## Deterministic Claim Rules

Task claim:

- `ready_for_review` -> `supported`
- `blocked_by_failed_verification` -> `failed`
- `needs_verification` or `not_ready_for_review` -> `unsupported`
- `clean_worktree` -> `not_testable`
- otherwise -> `unknown`

File claims:

- `failed` proof -> `failed`
- `stale` proof -> `stale`
- `missing` proof -> `unsupported`
- `current` or `covered` proof -> `supported`
- `not_required` docs/config/generated helper proof -> `needs_review`
- `unknown` proof -> `unknown`

Proof-gap claims:

- `failed-verification` -> `failed`
- `stale-verification-proof` -> `stale`
- blocking or warning gaps -> `unsupported`
- info gaps -> `needs_review`

Readiness claim:

- Mirrors the readiness state as the final contract claim so reviewers can see
  the contract verdict without reading every row.

## Rendering

High-density surfaces show a compact subset:

- terminal status: top contract claims after Review first
- handoff: top contract claims before Proof gaps
- resume prompt: contract section between Review Focus and Proof Gaps

Artifacts show a fuller compact section:

- Markdown report: full contract claim list, capped only by practical renderer
  formatting
- HTML replay: full contract section with escaped claim text, status, files,
  and evidence

JSON status includes the full `review.contract` object.

## Security and Performance Notes

- The builder is pure and synchronous.
- No command execution is added.
- No file reads are added.
- Complexity is linear in focus rows plus proof gaps.
- Renderer output escapes HTML through the existing replay escape helpers.
