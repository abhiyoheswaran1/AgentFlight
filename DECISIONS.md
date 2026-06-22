# Decisions

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
