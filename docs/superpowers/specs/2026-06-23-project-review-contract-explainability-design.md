# Project Review Contract Explainability Design

## Goal

Make the existing Project Review Contract feel repo-calibrated and trustworthy by
explaining why each requirement matched, what proof satisfied it, and what
review action remains before the work can be trusted.

## Product Shape

AgentFlight should keep the same command surface. `status`, `handoff`, `report`,
`replay`, and `resume` should all tell the same story:

- why a required-proof rule matched
- which changed-file categories and files activated it
- which proof command and proof kind satisfied it
- whether the proof is current, covered, stale, failed, missing, or not required
- which manual checks still remain

The primary product moment is the handoff decision. It should lead with a short
decision and a few evidence-backed reasons before the detailed review path.

## Architecture

Add explainability metadata to `ProjectReviewRequirementStatus` in the core
Project Review Contract evaluator. Rendering layers should consume that metadata
instead of recomputing rule reasons independently.

The core evaluator remains local and deterministic. It uses changed-file
categories, configured verification commands, recorded verification runs, and
proof freshness state. It does not read source contents, call external services,
upload evidence, or execute commands.

## Data Model

Each requirement should include:

- `matchedCategories`: categories from the rule that had changed files
- `matchReason`: concise explanation of why the rule matched
- `satisfiedProof`: matching passed verification proof command/kind, if present
- `proofReason`: concise explanation of proof state
- `remainingReview`: reviewer actions still needed

Existing fields stay intact so current reports and JSON consumers keep working.

## Rendering

Shared output helpers should format:

- the handoff decision line
- the decision reason bullets
- required-proof detail lines

Status, Markdown report, HTML replay, resume, and handoff should reuse those
helpers where practical. HTML replay must escape all new text.

## Non-Goals

- no new top-level command
- no PR comments
- no hosted or cloud workflow
- no source upload or telemetry
- no CI JSON expansion
- no named verification profiles
- no version bump, release, tag, push, or publish

## Testing

Regression tests should cover:

- matched category and file explanation
- satisfied proof command/kind selection
- missing proof retains suggested command
- manual review remains visible after current proof
- handoff decision copy
- Markdown and HTML rendering of explanation lines
- HTML escaping for explanation fields
- legacy sessions without `verificationCommands`
