# Decisions

## 2026-06-27: Review Passport Is The End-Of-Session Artifact

Decision: make `agentflight finish` the default end-of-session command and
write a source-free Review Passport JSON plus Markdown artifact alongside the
existing handoff, report, replay, and resume outputs.

Rationale:

- Reviewers need one local artifact that names readiness, proof gaps,
  verification runs, review focus, routes, artifacts, and the next action.
- AgentFlight already records the local evidence, so the passport should reuse
  existing Review Intelligence instead of creating a hosted workflow.
- Baseframe sessions need a single command that also finalizes
  `agentflight-result.json` for AgentLoopKit reconciliation.

Consequence:

- `agentflight finish` refreshes the local review packet and writes
  `.agentflight/reports/<session-id>-review-passport.json` and `.md`.
- In Baseframe sessions, `finish` also finalizes
  `.baseframe/evidence/<task-id>/agentflight-result.json` and preserves
  generated Baseframe output outside scope-drift analysis.
- `agentflight finalize` remains available for users who only need the
  Baseframe result artifact.

## 2026-06-27: Baseframe Suite Integration Uses Local JSON Contracts

Decision: integrate AgentFlight with ProjScan and AgentLoopKit through local,
versioned Baseframe JSON artifacts instead of importing either tool's internals.

Rationale:

- The tools need to compose without becoming one product or sharing runtime
  implementation details.
- AgentFlight already owns local session, verification, report, replay, and
  resume evidence, so the unified result should be another local artifact.
- Deterministic scope and gate reconciliation are review evidence, not cloud or
  identity features.

Consequence:

- `agentflight start --from-task` records optional Baseframe integration context
  on the session while old sessions remain valid.
- `agentflight finalize` writes `.baseframe/evidence/<task-id>/agentflight-result.json`
  and updates only the `agentflight` section of `.baseframe/agent-workflow.json`.
- Future suite changes should version the JSON contracts before changing
  AgentFlight behavior.

## 2026-06-23: Project Review Contract Explanations Live In Core

Decision: generate Project Review Contract explanations in the core evaluator,
then render the same source-free metadata through status, handoff, report,
replay, resume, and Review Contract claims.

Rationale:

- Reviewers need to know why a rule matched, what proof satisfied it, and what
  remains unsafe to trust.
- The evaluator already has the right deterministic inputs: changed-file
  categories, verification commands, recorded verification runs, proof status,
  and proof freshness.
- Rendering layers should not independently infer proof meaning because that
  would create drift between terminal, Markdown, HTML, and handoff outputs.
- Explanations can stay local-first and source-free by using paths, categories,
  proof kinds, commands, statuses, and manual check labels.

Consequence:

- Future contract-calibration work should add or refine evaluator metadata
  before changing individual renderers.
- More distribution-oriented features such as PR comments, CI enforcement, and
  hosted dashboards remain deferred.

## 2026-06-23: Project Review Contract Is Local Project Config

Decision: define repo-specific required proof and manual review checks in
`.agentflight/config.json` as `projectReviewContract`, then render the
evaluation through existing local review surfaces.

Rationale:

- Engineers need to know what proof a change type requires before they can
  trust a coding agent session.
- The existing Review Contract is already the shared review spine, so required
  proof should become another claim source instead of a new command or hosted
  workflow.
- The contract can stay deterministic and source-free by using changed-file
  categories, proof kinds, proof statuses, proof-gap ids, suggested commands,
  and manual check labels.
- Missing, failed, and stale required proof should continue to use the same
  proof-gap and readiness machinery reviewers already see.

Consequence:

- Future proof-standard improvements should extend the local config/evaluator
  first, then render through status, report, replay, resume, and handoff.
- Hosted review, PR comments, CI enforcement, telemetry, and model-based source
  extraction remain separate deferred product decisions.

## 2026-06-22: Review Contract Is The Shared Review Spine

Decision: keep Review Contract traceability inside the existing local review
surfaces instead of adding a new command, hosted surface, PR comment, export
mode, or telemetry-backed workflow.

Rationale:

- Engineers need one local path from claim to proof, not another artifact to
  remember.
- Status, report, replay, resume, and handoff already cover the review moments.
- Claim proof references can stay source-free by using file paths, proof
  statuses, proof-gap ids, readiness reasons, and suggested commands.
- Replay can provide deeper navigation through static local anchors while
  terminal surfaces stay compact.

Consequence:

- Future Review Contract improvements should update the shared model first,
  then render through existing surfaces.
- Distribution features such as PR comments, hosted review, JSON/CI expansion,
  and export modes remain deferred until the local review path is excellent.
