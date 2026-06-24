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

Review Contract:
Review path: Review 2 unsupported claims and 1 manual-review claim before sharing.
- unsupported - Required proof: Auth/session contract
- unsupported - Changed file reviewed: src/auth/session.ts
```

## Scope Boundaries

Project Review Contract covers local review surfaces only. Hosted review, PR
comments, CI policy enforcement, named verification profiles, source upload, and
telemetry remain outside this release.
