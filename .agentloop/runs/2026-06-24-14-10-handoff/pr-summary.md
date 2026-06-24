# PR Summary

- Generated: 2026-06-24-14-10
- Task context: `Release AgentFlight v0.12.0`
- Verification status: Overall status: pass

## Summary
This summary was generated deterministically from git status, the latest task contract, and the latest verification report.

## Changed Files
- M `AGENTFLIGHT_DEVLOG.md`
- M `CHANGELOG.md`
- M `README.md`
- M `docs/development/project-review-contract.md`
- M `docs/examples/basic-agentflight-session.md`
- M `package-lock.json`
- M `package.json`
- M `src/commands/handoff.ts`
- M `src/commands/replay.ts`
- M `src/commands/report.ts`
- M `src/commands/resume.ts`
- M `src/commands/status.ts`
- M `src/core/output.ts`
- M `src/core/project-review-contract.ts`
- M `src/core/review-intelligence.ts`
- M `src/renderers/html-replay.ts`
- M `src/renderers/markdown-report.ts`
- M `src/renderers/resume-prompt.ts`
- M `src/types/index.ts`
- M `tests/commands/evidence-output.test.ts`
- M `tests/core/review-intelligence.test.ts`
- M `tests/renderers/html-replay.test.ts`
- M `tests/renderers/markdown-report.test.ts`
- M `tests/renderers/resume-prompt.test.ts`
- ?? `.agentloop/state.json`
- ?? `docs/development/v0.12.0-release-audit.md`
- ?? `docs/superpowers/plans/2026-06-24-proof-freshness-attribution.md`
- ?? `docs/superpowers/plans/2026-06-24-repo-calibrated-proof-guidance.md`
- ?? `docs/superpowers/specs/2026-06-24-repo-calibrated-proof-guidance-design.md`
- ?? `src/core/proof-calibration.ts`
- ?? `tests/core/proof-calibration.test.ts`
- AgentLoop evidence: `7` file(s) grouped under `.agentloop/handoffs/`, `.agentloop/tasks/`, `.agentloop/tasks/archive/`.
- Full paths remain in JSON output and run-ledger evidence.

## Change Areas
### Risk-Sensitive
- M `package-lock.json`

### Source
- M `src/commands/handoff.ts`
- M `src/commands/replay.ts`
- M `src/commands/report.ts`
- M `src/commands/resume.ts`
- M `src/commands/status.ts`
- M `src/core/output.ts`
- M `src/core/project-review-contract.ts`
- M `src/core/review-intelligence.ts`
- M `src/renderers/html-replay.ts`
- M `src/renderers/markdown-report.ts`
- M `src/renderers/resume-prompt.ts`
- M `src/types/index.ts`
- ?? `src/core/proof-calibration.ts`

### Tests
- M `tests/commands/evidence-output.test.ts`
- M `tests/core/review-intelligence.test.ts`
- M `tests/renderers/html-replay.test.ts`
- M `tests/renderers/markdown-report.test.ts`
- M `tests/renderers/resume-prompt.test.ts`
- ?? `tests/core/proof-calibration.test.ts`

### AgentLoop
- ?? `.agentloop/state.json`

### Documentation
- M `AGENTFLIGHT_DEVLOG.md`
- M `CHANGELOG.md`
- M `README.md`
- M `docs/development/project-review-contract.md`
- M `docs/examples/basic-agentflight-session.md`
- ?? `docs/development/v0.12.0-release-audit.md`
- ?? `docs/superpowers/plans/2026-06-24-proof-freshness-attribution.md`
- ?? `docs/superpowers/plans/2026-06-24-repo-calibrated-proof-guidance.md`
- ?? `docs/superpowers/specs/2026-06-24-repo-calibrated-proof-guidance-design.md`

### Config / Package
- M `package.json`

### AgentLoop Evidence
- AgentLoop evidence: `7` file(s) grouped under `.agentloop/handoffs/`, `.agentloop/tasks/`, `.agentloop/tasks/archive/`.
- Full paths remain in JSON output and run-ledger evidence.

## Diff Stats
```text
AGENTFLIGHT_DEVLOG.md                       |  72 +++++++++
 CHANGELOG.md                                |  23 +++
 README.md                                   |  61 ++++++--
 docs/development/project-review-contract.md |  60 ++++++++
 docs/examples/basic-agentflight-session.md  |   9 +-
 package-lock.json                           |   4 +-
 package.json                                |   2 +-
 src/commands/handoff.ts                     | 151 +++++++++++++++++++
 src/commands/replay.ts                      |   5 +
 src/commands/report.ts                      |   5 +
 src/commands/resume.ts                      |   7 +
 src/commands/status.ts                      |  44 +++++-
 src/core/output.ts                          |  67 +++++++++
 src/core/project-review-contract.ts         |   2 +-
 src/core/review-intelligence.ts             | 117 ++++++++++++++-
 src/renderers/html-replay.ts                |  57 +++++++
 src/renderers/markdown-report.ts            |  45 ++++++
 src/renderers/resume-prompt.ts              |  38 +++++
 src/types/index.ts                          |  40 +++++
 tests/commands/evidence-output.test.ts      | 223 +++++++++++++++++++++++++++-
 tests/core/review-intelligence.test.ts      | 208 ++++++++++++++++++++++++++
 tests/renderers/html-replay.test.ts         |  95 ++++++++++++
 tests/renderers/markdown-report.test.ts     | 119 +++++++++++++++
 tests/renderers/resume-prompt.test.ts       |  87 +++++++++++
 24 files changed, 1513 insertions(+), 28 deletions(-)
```

## Behaviour Changed
- Review changed files and task contract to confirm intended behavior.

## Review Focus
- Review source changes for behavior and public API impact.
- Check tests cover the changed behavior.
- Check docs match the implemented command behavior.
- Review package and config changes for install, build, and publish impact.
- Review AgentLoop artifacts for accurate task, verification, and handoff evidence.
- Review risk-sensitive paths such as migrations, auth, security, billing, env, deployment, and lockfiles with extra care.

## Verification Performed
- Overall status: pass

## Verification Not Performed
- Check the verification report for skipped commands.

## Risks
- Re-check protected files such as migrations, secrets, auth, billing, deployment, and public APIs before merge.

## Rollback Notes
- Revert the changed files or revert the merge commit if this lands as a PR.

## Reviewer Checklist
- [ ] Acceptance criteria match the task contract.
- [ ] Verification evidence is adequate for the change.
- [ ] Risk areas have been reviewed.
- [ ] Rollback plan is clear.

## Follow-Ups
- Capture any deferred work in ROADMAP.md or a new task contract.
