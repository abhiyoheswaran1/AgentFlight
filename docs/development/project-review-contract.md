# Project Review Contract

Project Review Contract is AgentFlight's local proof standard for agentic
engineering work. It maps changed-file categories to required proof and manual
review checks, then shows the result in `status`, `report`, `replay`,
`resume`, and `handoff`.

It keeps review evidence local. AgentFlight reads paths, changed-file
categories, proof kinds, verification runs, and source-free proof freshness. It
does not upload source, call a model, sync to a hosted service, or post PR
comments.

## Config Shape

New `.agentflight/config.json` files include:

```json
{
  "projectReviewContract": {
    "enabled": true,
    "rules": [
      {
        "id": "missing-auth-test-proof",
        "label": "Sensitive auth, payment, or security review",
        "categories": ["auth", "billing/payments", "security/secrets"],
        "requiredProof": ["test"],
        "manualReview": [
          "Review session, permission, identity, payment, or credential boundaries manually."
        ],
        "severity": "blocking"
      }
    ]
  }
}
```

Existing configs without `projectReviewContract` keep working. Command paths
resolve the built-in default contract when the field is missing, while direct
core API calls can still run without a contract for legacy tests and fixtures.

## Rule Fields

- `id`: stable proof-gap id when required proof is missing.
- `label`: human-readable requirement name.
- `categories`: changed-file categories that activate the rule.
- `requiredProof`: proof kinds accepted for the rule. The matching behavior is
  OR-based: any passing required proof kind satisfies the automated proof part.
  When several accepted proof kinds exist, AgentFlight prefers current proof
  over covered proof over stale proof, then uses the latest run as the
  tie-breaker.
- `manualReview`: human checks that remain visible even when automated proof is
  current.
- `severity`: `blocking`, `warning`, or `info`.
- `message`: optional custom proof-gap message.

Supported proof kinds are `test`, `build`, `typecheck`, `lint`, `install`, and
`unknown`.

## Default Baseline

The built-in baseline covers:

- auth, payment, and security-sensitive paths: test proof plus manual boundary
  review
- database migrations: test or build proof plus migration safety review
- backend/API paths: test or build proof plus request/API behavior review
- dependency metadata: install, build, typecheck, or test proof plus package
  review
- config and CI: lint, typecheck, or build proof plus runtime/CI review
- frontend paths: build or test proof
- source paths: test, typecheck, or build proof
- test files: test proof
- docs and AgentFlight config: manual review only

## Status Semantics

Each matched requirement reports:

- `supported`: required automated proof is present and no manual check remains.
- `needs_review`: automated proof is satisfied or not required, but manual
  review checks remain.
- `missing`: required automated proof has not passed.
- `failed`: a matching required proof kind has an unresolved failed run.
- `stale`: a matching passing proof exists, but proof freshness indicates files
  changed afterward.
- `not_required`: no automated proof or manual review is required.
- `unknown`: AgentFlight cannot classify the proof state.

Missing required proof creates a proof gap using the rule id. Failed proof keeps
using the shared `failed-verification` gap. Stale proof keeps using the shared
`stale-verification-proof` gap.

When several requirements are stale, Trust Delta and the review queue merge the
stale requirement files into one rerun step. The individual requirement rows
remain visible in contract details.

## Proof Freshness Attribution

When proof is stale, AgentFlight records which changed files no longer match the
source-free proof snapshot captured during verification.

AgentFlight groups stale files by changed-file category:

- proof-required categories, such as auth, source, tests, config, backend/API,
  dependencies, database migrations, frontend, billing, and security paths
- manual-review categories, such as docs and generated guidance files

If proof-required files changed after verification, AgentFlight keeps the
`stale-verification-proof` gap and suggests rerunning the recorded proof command.
If only manual-review files changed after verification, AgentFlight shows proof
freshness attribution but keeps the work on the manual-review path instead of
creating rerun-only proof noise.

Example:

```text
Proof freshness:
- Verification proof is stale for auth changes after proof was captured. Rerun verification for these files. Docs changes also need manual review.
- Proof-required stale files: auth (src/auth/session.ts)
- Manual-review stale files: docs (README.md)
```

## Explainability Fields

Each matched requirement also carries local, source-free explanation metadata:

- `matchedCategories`: changed-file categories and file paths that activated
  the rule.
- `matchReason`: compact text explaining why the rule matched.
- `satisfiedProof`: the passing proof kind and command that satisfied the
  automated proof requirement, when one exists.
- `proofReason`: compact text explaining whether proof is current, covered,
  stale, failed, missing, or not required.
- `remainingReview`: concrete reviewer actions still needed before trusting the
  change.

These fields are derived from paths, categories, configured proof commands,
recorded verification runs, and proof freshness fingerprints. AgentFlight may
hash changed files locally to compare fingerprints, but it does not store,
render, upload, or analyze source contents.

## Review Surfaces

AgentFlight renders the same contract evaluation in:

- terminal `status`
- Markdown `report`
- HTML `replay`
- `resume` prompt
- `handoff`
- `status --format json`

The rendered data stays source-free: file paths, categories, proof kinds, proof
statuses, proof-gap ids, matched-category explanations, satisfying proof
commands, suggested commands, and manual check labels.

## Review Receipts

`agentflight handoff --accept` records a local review receipt when a reviewer
accepts the handoff. The receipt is a local note attached to the session, not
identity, signature, approval automation, or a PR comment.

The receipt snapshot stores:

- decision
- recorded timestamp
- changed paths
- readiness state
- proof pass/fail counts
- branch and commit
- handoff artifact path
- source-free proof snapshot fingerprints

Status, handoff, report, replay, resume, history, and status JSON show whether
the latest accepted receipt is current or stale. If changed-file fingerprints no
longer match the receipt snapshot, AgentFlight marks the receipt stale and adds
a review queue step to refresh the handoff after re-review.

If unresolved proof fails after an accepted receipt was recorded, AgentFlight
also marks the receipt stale. The receipt can still show what was accepted, but
the current review path must resolve the failed proof and regenerate the
handoff before the acceptance can be trusted again.

Review receipts stay local. Receipt freshness may compare local changed-file
fingerprints, but receipts do not store, render, upload, or analyze source
contents, full diffs, stdout/stderr evidence, hosted services, or model output.

## Trust Delta And Review Queue

Trust Delta summarizes the current trust change before a reviewer reads the
full contract. AgentFlight builds it from existing local metadata:

- unresolved failed proof
- stale proof-required files and manual-review stale files
- missing required proof gaps
- manual-review requirements
- repo-calibration suggestions from similar local ready handoffs
- stale accepted review receipts

The review queue turns those same signals into ordered next steps. Proof
failures, stale proof, and missing proof come before manual review. File
inspection stays visible after proof actions, so reviewers still see where to
look.

Dense review rows may shorten long suggested commands. Status and handoff keep
a separate full-command block when a command is shortened, so reviewers can
copy the exact `agentflight verify -- ...` action without opening another
artifact.

Trust Delta and review queue data remain source-free. They use paths,
changed-file categories, proof-gap ids, proof commands, proof freshness
metadata, Project Review Contract statuses, and repo-calibration summaries.
Proof freshness may compare local changed-file fingerprints, but Trust Delta and
review queue do not store, render, upload, or analyze source contents,
historical stdout/stderr evidence, full diffs, or external services.

## Review Routing

Review routing answers who should inspect each review path. AgentFlight derives
routes for:

- Maintainer: highest-signal changed files and the current trust state.
- Verification: failed, stale, missing, incomplete, or under-proven proof.
- Security: auth, payment, secret, database, dependency, and runtime config
  paths.
- Docs/DX: documentation, examples, AgentFlight config, command copy, and
  report/replay/resume copy.
- Release: package metadata, changelog/devlog, CI/config, release audit notes,
  and dependency metadata.

Routes are advisory. They do not change readiness, proof gaps, exit codes,
review receipt state, or Project Review Contract status. Status, handoff,
Markdown reports, HTML replays, resume prompts, and status JSON all show the
same route list.

Status and resume may point reviewers at an existing handoff artifact when the
current work is ready for review. That shortcut should only appear when the
latest recorded review summary still matches the current ready changed-file
count. If the current ready work changed after the last review artifact was
generated, the next action should ask for a fresh handoff.

Review routing stays source-free. It uses changed-file paths and categories,
proof gaps, proof freshness, Trust Delta, review queue, repo calibration, review
receipt state, and readiness. Proof freshness may compare local changed-file
fingerprints, but routing does not store, render, upload, or analyze source
contents, full diffs, stdout/stderr evidence, hosted services, or model output.

## Repo Calibration

Project Review Contract defines what proof the repo expects now. Repo
calibration compares today's proof with similar local handoffs that were already
recorded as ready for review.

Calibration is suggestion-only. It does not change required-proof status, proof
gaps, readiness, or exit codes by itself. It helps reviewers notice cases where
proof exists but is weaker than this repo's local history. When enough similar
accepted review receipts exist, calibration uses those sessions before ready-only
handoffs. If accepted receipt history is sparse, it falls back to ready handoffs
for backward compatibility.

Accepted handoffs form a calibration boundary. If a session records more proof
after an accepted receipt, AgentFlight does not treat that later proof as part
of the accepted handoff when it builds future repo-calibration suggestions.

Calibration reads:

- `.agentflight/sessions/*.json`
- recorded readiness metadata from report or replay events
- changed-file categories
- verification command names and pass/fail status
- source-free proof snapshot changed-file paths

Calibration does not read historical stdout/stderr evidence files, source
contents, or full diffs. It does not upload data, call a model, or sync to a
hosted service.

AgentFlight requires at least two similar ready local handoffs before it
suggests an additional historical proof command. This keeps the guidance
conservative and avoids treating one old session as a repo standard.

## Example

```text
Required proof:
- missing - Auth/session contract
   Matched: Matched auth changes: src/auth/session.ts
   Proof: missing
   Proof detail: No passing test proof recorded.
   Accepted proof: test
   Manual review: Review auth flow, session lifetime, and permission boundaries.
   Files: src/auth/session.ts
   Remaining: Run agentflight verify -- npm test.
   Remaining: Review auth flow, session lifetime, and permission boundaries.
   Suggested proof: agentflight verify -- npm test

Repo calibration:
- Similar local ready handoffs suggest 1 additional proof command for this change. Source: local session history; scanned 4, matched 2.
- under-proven - auth
   Current proof: npm test
   Historical proof: npm run e2e:auth, npm test
   Suggested proof: agentflight verify -- npm run e2e:auth
   Based on: 2 similar ready handoffs

Review Contract:
Review path: Review 2 unsupported claims and 1 manual-review claim before sharing.
- unsupported - Required proof: Auth/session contract
- unsupported - Changed file reviewed: src/auth/session.ts
```

## Scope Boundaries

Project Review Contract covers local review surfaces only. Hosted review, PR
comments, CI policy enforcement, verification-profile management, source upload,
and telemetry remain outside this contract layer.
