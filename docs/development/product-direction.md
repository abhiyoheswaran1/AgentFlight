# AgentFlight Product Direction

Date: 2026-06-20

Status: working direction for post-v0.6.0 development. Do not treat this as a
release plan.

## Product North Star

AgentFlight is a local-first review layer for coding agent sessions.

It should help real engineers answer three questions quickly:

1. What changed?
2. What proof exists or failed?
3. Is this ready to review, and what should I open first?

The product should keep building around agentic engineering trust, review
speed, and maintainable evidence. Cloud, accounts, billing, hosted review,
GitHub App surfaces, and automatic PR comments stay deferred until the local
artifact is excellent.

## Prioritized Work Areas

### 1. Local Handoff Golden Path

The handoff command should be the default end-of-session path. It must remain
local-only, deterministic, and concise. It should point to report, replay, and
resume artifacts without replacing them.

Ready-session discovery should open the handoff packet first. Replay remains the
best artifact for chronological inspection, and report remains the best artifact
for failed or incomplete proof.

User problem: engineers should not need to choose between five AgentFlight
commands when deciding whether work is reviewable.

### 2. First-Run Workspace Hygiene

First-run generated files should not make a simple trial look riskier than the
actual user change. AgentFlight runtime files stay filtered, project config
stays visible, and generated tool state such as `.projscan-memory/memory.json`
stays suggestion-only rather than globally ignored.

User problem: first-time users decide whether to trust a tool quickly. Review
focus should not lead with generated tool memory when a real app file or
project config needs attention.

Generated helper files such as `.agentflight/.gitignore` should remain visible,
but should not outrank `.agentflight/config.json` or real app changes in the
first-run review path.

### 3. Local Session Discovery

Users should be able to find recent local sessions and existing report/replay
artifacts without remembering `.agentflight/` paths. This should stay read-only:
no search index, sync, export, or session switching until those workflows earn
their keep through dogfood.

User problem: after several agent loops, the evidence exists locally but the
developer may not know which replay or report to open.

Start-only sessions without proof or review artifacts should remain visible,
but they should not take the same scan space as sessions with handoff, report,
replay, or resume artifacts.

### 4. Replay And Review Ergonomics

Long sessions need faster navigation and less repetition. Replay should remain
the best artifact to inspect when verification is complete, while report should
remain the best artifact when verification failed.

User problem: reviewers need to find the failed proof, relevant changed files,
and next action without reading a full transcript.

Markdown reports should answer proof and readiness before chronology. Long
timelines belong later in the report because replay remains the better artifact
for inspecting the full flight record.

### 5. Proof Guidance Quality

Suggested verification commands should be compact, relevant, and consistent
across status, report, replay, resume, and handoff. Failure excerpts should stay
stderr-preferred and raw evidence should remain intact.

User problem: proof guidance should reduce uncertainty, not add output noise.

### 6. Engine-Backed Review Ranking

ProjScan-enriched ranking can improve prioritization, but it should stay
deterministic, optional, and explainable. AgentFlight should not become a hidden
black-box reviewer.

User problem: high-signal files should rise above low-signal files without
hiding the reason.

## Team Persona Opinions

- Product Maintainer: keep the handoff loop as the golden path and avoid
  premature distribution features.
- CLI Engineer: prefer small composable command behavior over parallel
  renderers or hidden state.
- Verification Engineer: every behavior change needs focused regression tests
  plus full repo verification.
- Docs and DX Writer: public docs should explain local files and first-run
  guidance in user language.
- Security Reviewer: keep no upload, no telemetry, no auto-posting, and no
  secret printing as non-negotiable defaults.
- Release Engineer: do not release from this workstream unless explicitly asked.
- Repo Steward: keep changes small, archived tasks tidy, and generated evidence
  out of product diffs.

## Current Build Loop

Work one item at a time:

1. choose the highest-priority real user friction
2. create or pin an AgentLoopKit task
3. run the work inside an AgentFlight session
4. use ProjScan for health/preflight signals
5. write focused tests before behavior changes
6. implement the smallest maintainable fix
7. run a bug pass immediately after implementation
8. document findings when they affect product direction
9. do not release unless explicitly asked
