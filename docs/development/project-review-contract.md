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
recorded verification runs, and source-free proof freshness. They do not include
source contents or external analysis.

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

## Repo Calibration

Project Review Contract defines what proof the repo expects now. Repo
calibration compares today's proof with similar local handoffs that were already
recorded as ready for review.

Calibration is suggestion-only. It does not change required-proof status, proof
gaps, readiness, or exit codes by itself. It helps reviewers notice cases where
proof exists but is weaker than this repo's local history.

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
comments, CI policy enforcement, named verification profiles, source upload, and
telemetry remain outside this release.
