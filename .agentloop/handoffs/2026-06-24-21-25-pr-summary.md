# PR Summary

- Generated: 2026-06-24-21-25
- Task context: `Release AgentFlight v0.13.0`
- Verification status: Overall status: pass

## Summary
This summary was generated deterministically from git status, the latest task contract, and the latest verification report.

## Changed Files
- M `AGENTFLIGHT_DEVLOG.md`
- M `CHANGELOG.md`
- M `README.md`
- M `docs/development/product-direction.md`
- M `docs/development/project-review-contract.md`
- M `package-lock.json`
- M `package.json`
- M `src/cli.ts`
- M `src/commands/handoff.ts`
- M `src/commands/history.ts`
- M `src/commands/resume.ts`
- M `src/commands/start.ts`
- M `src/commands/status.ts`
- M `src/core/artifacts.ts`
- M `src/core/output.ts`
- M `src/core/process.ts`
- M `src/core/project-review-contract.ts`
- M `src/core/proof-calibration.ts`
- M `src/core/review-contract.ts`
- M `src/core/review-intelligence.ts`
- M `src/core/session.ts`
- M `src/core/verification.ts`
- M `src/renderers/html-replay.ts`
- M `src/renderers/markdown-report.ts`
- M `src/renderers/resume-prompt.ts`
- M `src/types/index.ts`
- M `tests/commands/evidence-output.test.ts`
- M `tests/commands/history.test.ts`
- M `tests/commands/workflow.test.ts`
- M `tests/core/output.test.ts`
- M `tests/core/proof-calibration.test.ts`
- M `tests/core/review-contract.test.ts`
- M `tests/core/review-intelligence.test.ts`
- M `tests/core/session.test.ts`
- M `tests/core/verification.test.ts`
- M `tests/renderers/html-replay.test.ts`
- M `tests/renderers/markdown-report.test.ts`
- M `tests/renderers/resume-prompt.test.ts`
- ?? `docs/development/v0.13.0-release-audit.md`
- ?? `docs/superpowers/plans/2026-06-24-review-receipts-handoff-staleness.md`
- ?? `docs/superpowers/plans/2026-06-24-role-aware-review-routing.md`
- ?? `docs/superpowers/plans/2026-06-24-trust-delta-review-guidance.md`
- ?? `src/core/ids.ts`
- ?? `src/core/proof-kind.ts`
- ?? `src/core/session-id.ts`
- ?? `tests/core/ids.test.ts`
- ?? `tests/core/process.test.ts`
- AgentLoop evidence: `24` file(s) grouped under `.agentloop/handoffs/`, `.agentloop/runs/`, `.agentloop/state.json`, `.agentloop/tasks/`, `.agentloop/tasks/archive/`.
- Full paths remain in JSON output and run-ledger evidence.

## Change Areas
### Risk-Sensitive
- M `package-lock.json`

### Source
- M `src/cli.ts`
- M `src/commands/handoff.ts`
- M `src/commands/history.ts`
- M `src/commands/resume.ts`
- M `src/commands/start.ts`
- M `src/commands/status.ts`
- M `src/core/artifacts.ts`
- M `src/core/output.ts`
- M `src/core/process.ts`
- M `src/core/project-review-contract.ts`
- M `src/core/proof-calibration.ts`
- M `src/core/review-contract.ts`
- M `src/core/review-intelligence.ts`
- M `src/core/session.ts`
- M `src/core/verification.ts`
- M `src/renderers/html-replay.ts`
- M `src/renderers/markdown-report.ts`
- M `src/renderers/resume-prompt.ts`
- M `src/types/index.ts`
- ?? `src/core/ids.ts`
- ?? `src/core/proof-kind.ts`
- ?? `src/core/session-id.ts`

### Tests
- M `tests/commands/evidence-output.test.ts`
- M `tests/commands/history.test.ts`
- M `tests/commands/workflow.test.ts`
- M `tests/core/output.test.ts`
- M `tests/core/proof-calibration.test.ts`
- M `tests/core/review-contract.test.ts`
- M `tests/core/review-intelligence.test.ts`
- M `tests/core/session.test.ts`
- M `tests/core/verification.test.ts`
- M `tests/renderers/html-replay.test.ts`
- M `tests/renderers/markdown-report.test.ts`
- M `tests/renderers/resume-prompt.test.ts`
- ?? `tests/core/ids.test.ts`
- ?? `tests/core/process.test.ts`

### Documentation
- M `AGENTFLIGHT_DEVLOG.md`
- M `CHANGELOG.md`
- M `README.md`
- M `docs/development/product-direction.md`
- M `docs/development/project-review-contract.md`
- ?? `docs/development/v0.13.0-release-audit.md`
- ?? `docs/superpowers/plans/2026-06-24-review-receipts-handoff-staleness.md`
- ?? `docs/superpowers/plans/2026-06-24-role-aware-review-routing.md`
- ?? `docs/superpowers/plans/2026-06-24-trust-delta-review-guidance.md`

### Config / Package
- M `package.json`

### AgentLoop Evidence
- AgentLoop evidence: `24` file(s) grouped under `.agentloop/handoffs/`, `.agentloop/runs/`, `.agentloop/state.json`, `.agentloop/tasks/`, `.agentloop/tasks/archive/`.
- Full paths remain in JSON output and run-ledger evidence.

## Diff Stats
```text
AGENTFLIGHT_DEVLOG.md                       | 291 +++++++-
 CHANGELOG.md                                | 134 +++-
 README.md                                   | 162 ++++-
 docs/development/product-direction.md       |  66 +-
 docs/development/project-review-contract.md | 116 +++-
 package-lock.json                           |   4 +-
 package.json                                |   2 +-
 src/cli.ts                                  |  10 +-
 src/commands/handoff.ts                     | 507 ++++++++++++--
 src/commands/history.ts                     |  67 +-
 src/commands/resume.ts                      |  17 +-
 src/commands/start.ts                       |   6 +-
 src/commands/status.ts                      |  82 ++-
 src/core/artifacts.ts                       |   2 +
 src/core/output.ts                          | 283 +++++++-
 src/core/process.ts                         |   4 +-
 src/core/project-review-contract.ts         | 144 ++--
 src/core/proof-calibration.ts               | 124 +++-
 src/core/review-contract.ts                 |   7 +-
 src/core/review-intelligence.ts             | 990 ++++++++++++++++++++++++++--
 src/core/session.ts                         | 114 +++-
 src/core/verification.ts                    |  56 ++
 src/renderers/html-replay.ts                | 335 ++++++++--
 src/renderers/markdown-report.ts            | 206 ++++--
 src/renderers/resume-prompt.ts              | 184 +++++-
 src/types/index.ts                          | 109 +++
 tests/commands/evidence-output.test.ts      | 144 +++-
 tests/commands/history.test.ts              | 123 ++++
 tests/commands/workflow.test.ts             | 319 ++++++++-
 tests/core/output.test.ts                   | 262 +++++++-
 tests/core/proof-calibration.test.ts        | 175 +++++
 tests/core/review-contract.test.ts          |  39 +-
 tests/core/review-intelligence.test.ts      | 935 +++++++++++++++++++++++++-
 tests/core/session.test.ts                  | 144 ++++
 tests/core/verification.test.ts             |  45 ++
 tests/renderers/html-replay.test.ts         | 468 ++++++++++++-
 tests/renderers/markdown-report.test.ts     | 319 ++++++++-
 tests/renderers/resume-prompt.test.ts       | 249 +++++++
 38 files changed, 6814 insertions(+), 430 deletions(-)
docs/development/v0.13.0-release-audit.md | untracked
docs/superpowers/plans/2026-06-24-review-receipts-handoff-staleness.md | untracked
docs/superpowers/plans/2026-06-24-role-aware-review-routing.md | untracked
docs/superpowers/plans/2026-06-24-trust-delta-review-guidance.md | untracked
src/core/ids.ts | untracked
src/core/proof-kind.ts | untracked
src/core/session-id.ts | untracked
tests/core/ids.test.ts | untracked
tests/core/process.test.ts | untracked
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

## Verification Report Not Run
- No skipped commands were recorded.

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
