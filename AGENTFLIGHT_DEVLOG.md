# AgentFlight Devlog

This log records setup, dogfooding, and verification evidence for the AgentFlight MVP.

## 2026-06-21

### Prefer Configured Proof in Start Output

Dogfood finding:

- AgentFlight's own config now has `verification.commands`, but
  `agentflight start` still displayed detected package scripts as the suggested
  proof. That made the no-arg `agentflight verify` path less obvious at the
  start of a coding agent session.

Team persona notes:

- Product Maintainer: the first instruction after start should match the
  configured workflow users are expected to run.
- CLI Engineer: change terminal guidance only; do not alter verification
  execution, session metadata, or command flags.
- Verification Engineer: keep detected fallback coverage for repos with empty
  configs.
- Docs and DX Writer: make `agentflight verify` the visible primary action when
  config commands exist.
- Security Reviewer: keep all commands local and repo-scoped.

Implemented locally:

- `agentflight start` now displays `agentflight verify` plus the configured
  commands when `.agentflight/config.json` has verification commands.
- Repos with empty verification config still see detected package proof scripts
  as the fallback.

Verification so far:

- Red AgentFlight-captured `npm test -- tests/commands/workflow.test.ts` failed
  because start output still showed detected package scripts first.
- Green AgentFlight-captured `npm test -- tests/commands/workflow.test.ts`
  passed with 1 file / 12 tests.
- AgentFlight-captured `npm run verify` passed with 22 files / 207 tests plus
  build.
- AgentFlight-captured `npm run format:check` initially failed on the new plan
  Markdown file; Prettier fixed the file and the rerun passed.
- AgentFlight-captured `npm pack --dry-run` passed for `agentflight@0.6.0`.
- ProjScan doctor passed with health `100/A`.
- ProjScan preflight returned the known accumulated branch scale caution:
  manual review sign-off recommended for large handoff risk.
- ProjScan review returned the known scale-only `block` verdict with 48 current
  changed files and maximum changed-file risk score `212.1 >= 80`; it reported
  no risky functions, dependency changes, contract changes, new cycles, taint
  flows, or dataflow risks.
- AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-13-23-verification-report.md`.

### Show Latest Artifact in Clean Status

Dogfood finding:

- After a clean handoff, `agentflight status` correctly said the worktree was
  clean, but made the user run `agentflight history --limit 1` to reopen the
  latest local artifact. That added an avoidable lookup step in the coding agent
  session review loop.

Team persona notes:

- Product Maintainer: clean status should be a direct review doorway, not just
  a pointer to another command.
- CLI Engineer: keep status read-only and repo-relative; reuse history's
  artifact-selection rule.
- Verification Engineer: cover the clean-worktree path after artifacts exist.
- Docs and DX Writer: keep the copy short with a familiar `Open first:` line.
- Security Reviewer: expose only local repo-relative paths and do not add sync,
  export, or PR-comment behavior.

Implemented locally:

- Added a shared review-artifact helper for report/replay/handoff/resume paths
  and open-first selection.
- `agentflight history` now uses the shared helper instead of owning a duplicate
  artifact chooser.
- Clean-worktree `agentflight status` now prints `Open first: ...` when the
  current session already has a local artifact, while keeping the start-new-task
  next action.

Verification so far:

- Red AgentFlight-captured `npm test -- tests/commands/evidence-output.test.ts`
  failed because clean status did not show the replay artifact path.
- Green AgentFlight-captured `npm test -- tests/commands/evidence-output.test.ts
tests/commands/history.test.ts` passed with 2 files / 41 tests.
- AgentFlight-captured `npm run verify` passed with 22 files / 207 tests plus
  build.
- AgentFlight-captured `npm run format:check` initially failed on the updated
  devlog, plan, and status test formatting; Prettier fixed the files and the
  rerun passed.
- AgentFlight-captured `npm pack --dry-run` passed for `agentflight@0.6.0`.
- ProjScan doctor passed with health `100/A`.
- ProjScan preflight returned the known accumulated branch scale caution:
  manual review sign-off recommended for large handoff risk.
- ProjScan review returned the known scale-only `block` verdict with 48 current
  changed files and maximum changed-file risk score `212.1 >= 80`; it reported
  no risky functions, dependency changes, contract changes, new cycles, taint
  flows, or dataflow risks.
- AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-13-11-verification-report.md`.

### Configure AgentFlight Repo Default Verification

Dogfood finding:

- After the repo was clean, `agentflight doctor` still warned that
  `.agentflight/config.json` had no configured verification commands even though
  package proof scripts existed. New repos now get seeded verification commands,
  but AgentFlight's own tracked config predated that behavior.

Team persona notes:

- Product Maintainer: the project should dogfood the no-arg verification path it
  recommends to real coding agent sessions.
- CLI Engineer: use the existing config contract rather than adding command
  behavior.
- Verification Engineer: point no-arg `agentflight verify` at the same all-up
  proof command maintainers already run.
- Security Reviewer: keep the command local and repository-scoped.
- Repo Steward: avoid source changes; this is tracked project configuration and
  documentation only.

Implemented locally:

- Set AgentFlight's tracked `.agentflight/config.json` verification command to
  `npm run verify`.

Verification so far:

- Red AgentFlight-captured `node dist/cli.js verify` failed because no command
  was configured.
- AgentFlight-captured `node dist/cli.js doctor` passed and reported
  `.agentflight/config.json` has 1 configured verification command.
- Green AgentFlight-captured `node dist/cli.js verify` passed by running the
  configured `npm run verify` command with 22 files / 207 tests plus build.
- AgentFlight-captured `npm run verify` passed with 22 files / 207 tests plus
  build.
- AgentFlight-captured `npm run format:check` initially failed on the new plan
  Markdown file; Prettier fixed the file and the rerun passed.
- AgentFlight-captured `npm pack --dry-run` passed for `agentflight@0.6.0`.
- ProjScan doctor passed with health `100/A`.
- ProjScan preflight returned the known accumulated branch scale caution:
  manual review sign-off recommended for large handoff risk.
- ProjScan review returned the known scale-only `block` verdict with 47 current
  changed files and maximum changed-file risk score `212.1 >= 80`; it reported
  no risky functions, dependency changes, contract changes, new cycles, taint
  flows, or dataflow risks.
- AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-12-58-verification-report.md`.

### History Previous Artifact Guidance

Dogfood finding:

- A short smoke session became the current AgentFlight session before it had
  handoff/report/replay artifacts. `agentflight history` correctly told the
  user to run handoff, but the latest-action block no longer surfaced the
  previous useful replay/report artifact, slowing local review during agentic
  engineering work.

Team persona notes:

- Product Maintainer: local session discovery should keep useful prior evidence
  visible without pretending the current coding agent session is complete.
- CLI Engineer: preserve read-only history behavior and avoid session switching,
  search, export, or sync.
- Docs and DX Writer: add one concise `Previous artifact:` line instead of a
  tutorial.
- Security Reviewer: keep artifact hints repo-relative and local-only.
- Repo Steward: keep the change small and avoid tracking runtime evidence.

Implemented locally:

- `agentflight history` now scans older sessions for the nearest existing
  open-first artifact when the newest current session has none.
- The latest-action block keeps `Next: run agentflight handoff` for the current
  session and appends a repo-relative `Previous artifact:` fallback.

Verification:

- Red AgentFlight-captured `npm test -- tests/commands/history.test.ts` failed
  because the latest-action block did not show a previous artifact.
- Green AgentFlight-captured `npm test -- tests/commands/history.test.ts`
  passed with 1 file / 7 tests.
- AgentFlight-captured `npm test -- tests/commands/history.test.ts` passed with
  1 file / 7 tests after documentation updates.
- AgentFlight-captured `npm run verify` passed with 22 files / 207 tests plus
  build.
- AgentFlight-captured `npm run format:check` passed.
- AgentFlight-captured `npm pack --dry-run` passed for `agentflight@0.6.0`.
- ProjScan doctor passed with health `100/A`.
- ProjScan preflight returned the known accumulated branch scale caution:
  manual review sign-off recommended for large handoff risk.
- ProjScan review returned the known scale-only `block` verdict with 47 current
  changed files and maximum changed-file risk score `212.1 >= 80`; it reported
  no risky functions, dependency changes, contract changes, new cycles, taint
  flows, or dataflow risks.
- AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-12-48-verification-report.md`.
- AgentLoopKit task doctor passed with no task-folder hygiene issues.

### Share First-Run File Guidance Helpers

Dogfood finding:

- After `start --yes` gained first-run generated-file guidance, `init` and
  `start` each owned separate path-ordering and local-file guidance helpers.
  That created drift risk in the first-run workspace-hygiene path.

Team persona notes:

- Product Maintainer: first-run trust should not depend on two copies of the
  same local-file story staying in sync.
- CLI Engineer: centralize the formatting helper and keep command behavior
  unchanged.
- Docs and DX Writer: preserve the current wording while making future edits
  safer.
- Security Reviewer: keep config visible and runtime evidence local; no new
  ignore behavior.
- Repo Steward: prefer a small shared helper over duplicated local formatters.

Implemented locally:

- Added shared output helpers for AgentFlight generated-file ordering and
  first-run local-file guidance.
- `agentflight init` now uses the shared helpers for created/skipped file lists
  and the `Local files:` guidance block.
- `agentflight start --yes` now uses the shared generated-file list helper and
  shared config/runtime guidance strings.

Verification:

- Red AgentFlight-captured `npm test -- tests/core/output.test.ts
tests/commands/workflow.test.ts` failed because the shared helper exports did
  not exist yet.
- Green AgentFlight-captured `npm test -- tests/core/output.test.ts
tests/commands/workflow.test.ts` passed with 2 files / 15 tests.
- AgentFlight-captured `npm run verify` passed with 22 files / 207 tests plus
  build.
- AgentFlight-captured `npm run format:check` passed.
- AgentFlight-captured `npm pack --dry-run` passed for `agentflight@0.6.0`.
- ProjScan doctor passed with health `100/A`.
- ProjScan preflight returned the known accumulated branch scale caution:
  280 changed files and maximum changed-file risk score `212.1 >= 80`.
- ProjScan review returned the known scale-only `block` verdict with 47 current
  changed files; it reported no risky functions, dependency changes, contract
  changes, new cycles, taint flows, or dataflow risks.
- AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-12-33-verification-report.md`.

### Explain Start Yes Generated Files

Dogfood finding:

- `agentflight start --yes` safely initialized AgentFlight in a fresh repo, but
  the output went straight to the started session. First-run users missed the
  `init` guidance that `.agentflight/config.json` is project config while
  runtime evidence stays local and excluded from AgentFlight changed-file
  analysis.

Team persona notes:

- Product Maintainer: first-run trust depends on explaining generated files at
  the moment they appear.
- CLI Engineer: keep `start --yes` behavior unchanged except for a concise
  output block.
- Docs and DX Writer: reuse the same local-file framing as `init` without
  adding a long tutorial.
- Security Reviewer: no hidden ignore behavior; config remains visible and
  runtime evidence remains local.
- Repo Steward: keep the change in `start` output and workflow tests only.

Implemented locally:

- `agentflight start --yes` now lists generated AgentFlight files when it
  auto-initializes a repo.
- The output explains that `.agentflight/config.json` is project config and
  runtime evidence stays local/excluded from AgentFlight changed-file analysis.
- `agentflight start` without `--yes` keeps the existing missing-init error.

Verification:

- Red AgentFlight-captured `npm test -- tests/commands/workflow.test.ts` failed
  because `start --yes` did not print an `Initialized:` block.
- Green AgentFlight-captured `npm test -- tests/commands/workflow.test.ts`
  passed with 1 file / 12 tests.
- AgentFlight-captured `npm run verify` passed with 21 files / 204 tests plus
  build.
- AgentFlight-captured `npm run format:check` initially failed on
  `src/commands/start.ts`; Prettier fixed the formatting, and later reruns
  passed.
- AgentFlight-captured `npm pack --dry-run` passed for `agentflight@0.6.0`.
- ProjScan doctor passed with health `100/A`.
- ProjScan preflight initially reported one high-complexity function signal for
  `runStartCommand`; the auto-init branch was extracted and the rerun cleared
  risky functions.
- Final ProjScan preflight returned the known accumulated branch scale caution:
  276 changed files and maximum changed-file risk score `212.1 >= 80`.
- Final ProjScan review returned the known scale-only `block` verdict with 46
  current changed files; it reported no risky functions, dependency changes,
  contract changes, new cycles, taint flows, or dataflow risks.
- AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-12-15-verification-report.md`.

### Speed Up First-Run Tool Inspection

Dogfood finding:

- First-run `agentflight init` and `agentflight start` only need concise
  ProjScan availability and version output, but the shared ProjScan inspector
  also ran a `--help` probe. That extra probe can add avoidable latency before
  users see the local handoff workflow.

Team persona notes:

- Product Maintainer: keep the first-run path fast and focused on the handoff
  workflow.
- CLI Engineer: use one adapter with a clear option instead of duplicating tool
  inspection logic.
- Docs and DX Writer: do not add more first-run copy; make the current path
  appear sooner.
- Security Reviewer: keep checks local and deterministic; no telemetry,
  install mutation, or hidden setup.
- Repo Steward: leave `doctor` as the deeper diagnostic surface.

Implemented locally:

- Added a ProjScan inspection option for concise availability checks.
- `agentflight init` and `agentflight start` now skip ProjScan help probing.
- `agentflight doctor` still uses the default deeper ProjScan diagnostics path.

Verification:

- Red AgentFlight-captured `npm test -- tests/adapters/projscan.test.ts
tests/commands/workflow.test.ts` failed because `includeHelp: false` still ran
  ProjScan help probing.
- Green AgentFlight-captured `npm test -- tests/adapters/projscan.test.ts
tests/commands/workflow.test.ts` passed with 2 files / 20 tests.
- AgentFlight-captured `npm run verify` passed with 21 files / 203 tests plus
  build.
- AgentFlight-captured `npm run format:check` passed.
- AgentFlight-captured `npm pack --dry-run` passed for `agentflight@0.6.0`.
- ProjScan doctor passed with health `100/A`.
- ProjScan preflight returned the known accumulated branch scale caution:
  273 changed files and maximum changed-file risk score `212.1 >= 80`.
- ProjScan review returned the known scale-only `block` verdict with 46 current
  changed files; it reported no risky functions, dependency changes, contract
  changes, new cycles, taint flows, or dataflow risks.
- AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-11-59-verification-report.md`.

### Readable Doctor Proof Suggestions

Dogfood finding:

- `agentflight doctor` suggested detected proof commands in one long
  semicolon-separated sentence when `.agentflight/config.json` had no
  configured verification commands. The commands were correct, but the warning
  was noisy.

Implemented locally:

- Doctor now keeps the full command text but formats multiple detected proof
  suggestions as an indented list.
- Multiline suggested fixes render under the relevant check instead of running
  across one terminal line.

Verification:

- Red AgentFlight-captured `npm test -- tests/core/doctor.test.ts
tests/commands/workflow.test.ts` failed on the old one-line suggestion.
- Green AgentFlight-captured `npm test -- tests/core/doctor.test.ts
tests/commands/workflow.test.ts` passed with 2 files / 21 tests.
- AgentFlight-captured `npm run verify` passed with 21 files / 201 tests plus
  build.
- AgentFlight-captured `npm run format:check` initially failed on
  `AGENTFLIGHT_DEVLOG.md`; Prettier fixed the devlog wrapping, and the rerun
  passed.
- AgentFlight-captured `npm pack --dry-run` passed for `agentflight@0.6.0`.
- ProjScan doctor passed with health `100/A`.
- ProjScan preflight returned the known accumulated branch scale caution:
  270 changed files and maximum changed-file risk score `212.1 >= 80`.
- ProjScan review returned the known scale-only `block` verdict with 46 current
  changed files; it reported no risky functions, dependency changes, contract
  changes, new cycles, taint flows, or dataflow risks.
- AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-11-43-verification-report.md`.

### Prefer Review-Ready History Artifacts

Dogfood finding:

- Historical sessions that generated a ready replay and later generated a
  clean-worktree report could show `Recorded readiness: Clean worktree` in
  history, even though the preserved replay was the more useful artifact to open
  first.

Implemented locally:

- Added a regression test for a ready replay followed by a clean report.
- Updated session summary selection to prefer the newest non-clean review
  artifact metadata, falling back to clean metadata only when no non-clean
  artifact metadata exists.

Verification:

- Red AgentFlight-captured `npm test -- tests/core/session.test.ts
tests/commands/history.test.ts` failed because history selected
  `clean_worktree`.
- Green AgentFlight-captured `npm test -- tests/core/session.test.ts
tests/commands/history.test.ts` passed with 2 files / 15 tests.
- AgentFlight-captured `npm run verify` passed with 21 files / 201 tests plus
  build.
- AgentFlight-captured `npm run format:check` initially failed on
  `AGENTFLIGHT_DEVLOG.md`; Prettier fixed the devlog wrapping, and the rerun
  passed.
- AgentFlight-captured `npm pack --dry-run` passed for `agentflight@0.6.0`.
- ProjScan doctor passed with health `100/A`.
- ProjScan preflight returned the known accumulated branch scale caution:
  267 changed files and manual review signoff recommended.
- ProjScan review returned the known scale-only `block` verdict with maximum
  changed-file risk score `212.1 >= 80`; it reported no risky functions,
  dependency changes, contract changes, dataflow risks, or cycles.
- AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-11-29-verification-report.md`.

### Preserve Review Artifacts On Clean Handoff

Dogfood finding:

- After the clean-worktree handoff exit-code fix, running handoff after commit
  could still regenerate the session report/replay/resume with zero changed
  files. That preserved a successful command result but weakened the useful
  review artifact.

Implemented locally:

- Added a regression test that creates a ready handoff, runs a later
  clean-worktree handoff, and confirms the existing session report, replay,
  resume, and session handoff artifacts are unchanged.
- Clean-worktree handoff now reuses existing session-specific artifacts when
  they are already present, writes only the current handoff pointer, and leaves
  first-time clean handoff generation unchanged.

Verification:

- Red AgentFlight-captured `npm test -- tests/commands/evidence-output.test.ts`
  failed because the later clean handoff overwrote the report artifact.
- Green AgentFlight-captured `npm test -- tests/commands/evidence-output.test.ts`
  passed with 1 file / 34 tests.
- AgentFlight-captured `npm run verify` passed with 21 files / 200 tests plus
  build.
- AgentFlight-captured `npm run format:check` initially failed on
  `tests/commands/evidence-output.test.ts`; Prettier fixed the test formatting,
  and the rerun passed.
- AgentFlight-captured `npm pack --dry-run` passed for `agentflight@0.6.0`.
- ProjScan doctor passed with health `100/A`.
- ProjScan preflight returned the known accumulated branch scale caution:
  264 changed files and manual review signoff recommended.
- ProjScan review returned the known scale-only `block` verdict with maximum
  changed-file risk score `212.1 >= 80`; it reported no risky functions,
  dependency changes, contract changes, dataflow risks, or cycles.
- AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-11-17-verification-report.md`.

### Clean Handoff Exit Success

Dogfood finding:

- After completing and committing a task, `node dist/cli.js handoff` printed a
  normal clean-worktree handoff but exited with code `1`. That made a calm
  informational state look like a command failure.

Implemented locally:

- Added a regression test for clean-worktree handoff exit code.
- Changed only the handoff exit-code predicate so `ready_for_review` and
  `clean_worktree` return success, while blocked proof states still return
  nonzero.

Verification:

- Red AgentFlight-captured `npm test -- tests/commands/evidence-output.test.ts`
  failed with received exit code `1` for the clean-worktree handoff.
- Green AgentFlight-captured `npm test -- tests/commands/evidence-output.test.ts`
  passed with 1 file / 33 tests.
- AgentFlight-captured `npm run verify` passed with 21 files / 199 tests plus
  build.
- AgentFlight-captured `npm run format:check` passed.
- AgentFlight-captured `npm pack --dry-run` passed for `agentflight@0.6.0`.
- ProjScan doctor passed with health `100/A`.
- ProjScan preflight returned the known accumulated branch scale caution:
  261 changed files and manual review signoff recommended.
- ProjScan review returned the known scale-only `block` verdict with maximum
  changed-file risk score `212.1 >= 80`; it reported no risky functions,
  dependency changes, contract changes, dataflow risks, or cycles.
- AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-11-05-verification-report.md`.

### Public Positioning Reference Cleanup

Product note:

- After the current positioning copy was updated, older public docs and
  changelog entries still used stale assistant-style phrasing. Those files can
  still be read from the repo or package context, so they should follow the same
  `coding agent sessions` language.

Implemented locally:

- Cleaned remaining public references in CHANGELOG, dogfooding docs, v0.4
  roadmap planning docs, and v0.3 launch-note draft copy.
- Left devlog transcripts and archived task contracts unchanged because they
  are historical evidence, not current product positioning.

Verification:

- Targeted public-doc scan passed with no matches for `AI coding`, `AI-agent`,
  or `coding assistant` in README, CHANGELOG, PRODUCT.md, package metadata,
  docs/development, docs/roadmap, docs/marketing, docs/assets, src, or tests.
- AgentFlight-captured `npm run format:check` passed.
- AgentFlight-captured `npm run verify` passed with 21 files / 198 tests plus
  build.
- AgentFlight-captured `npm pack --dry-run` passed for `agentflight@0.6.0`.
- ProjScan doctor passed with health `100/A`.
- ProjScan preflight returned the known accumulated branch scale caution:
  258 changed files and manual review signoff recommended.
- ProjScan review returned the known scale-only `block` verdict with maximum
  changed-file risk score `212.1 >= 80`; it reported no risky functions,
  dependency changes, contract changes, dataflow risks, or cycles.
- AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-10-55-verification-report.md`.

### Coding Agent Positioning Copy

Product note:

- Current product positioning should avoid `AI coding` and coding-assistant
  phrasing. The preferred terms are `coding agent sessions`, `coding agents`,
  and, where broader framing helps, `agentic engineering`.

Persona readout:

- Product Maintainer: product copy should sound like serious engineering
  infrastructure, not hype around assistants.
- Docs and DX Writer: use `coding agent sessions` for the tagline and reserve
  `agentic engineering` for broader positioning.
- CLI Engineer: keep command descriptions short and exact.
- Repo Steward: avoid rewriting historical task contracts and command
  transcripts just to change old evidence.

Implemented locally:

- CLI/package metadata now says
  `Local-first review layer for coding agent sessions.`
- `start` command help now says `Start or resume a coding agent session.`
- README, PRODUCT.md, product direction, roadmap, the v0.6.0 website prompt,
  ProjScan intent strings, and the CLI demo SVG description now use the new
  positioning.

Verification:

- Red AgentFlight-captured CLI entrypoint test failed because the CLI
  description still said `AI coding sessions`.
- Green AgentFlight-captured CLI entrypoint test passed:
  `npm test -- tests/cli-entrypoint.test.ts` passed with 1 file / 5 tests.
- Targeted stale-copy scan passed with no matches for `AI coding`, `AI-agent`,
  or `coding assistant` in current public/runtime surfaces.
- Full verification initially hit workflow-test timeouts in fixtures that
  exercised init before the behavior under test. Those fixtures now pass stubbed
  init tool results so they do not call real optional tooling under suite load.
- AgentFlight-captured `npm test -- tests/commands/workflow.test.ts` passed with
  1 file / 11 tests after the fixture fixes.
- Bug-pass verification passed: `npm run verify` passed with 21 files / 198
  tests plus build, `npm run format:check` passed, and `npm pack --dry-run`
  passed for `agentflight@0.6.0`.
- ProjScan doctor passed with health `100/A`.
- ProjScan preflight stayed at the known accumulated branch scale caution:
  252 changed files and manual review signoff recommended.
- ProjScan review returned the known scale-only `block` verdict with maximum
  changed-file risk score `212.1 >= 80`; it reported no risky functions,
  dependency changes, contract changes, dataflow risks, or cycles.
- AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-10-45-verification-report.md`.

### Idempotent Init Detected Proof

Dogfood finding:

- Running `agentflight init` again in this repo skipped the existing
  `.agentflight/config.json` as intended, but because that older config has
  empty `verification.commands`, the primary workflow fell back to
  `agentflight verify -- <proof command>` even though package proof scripts were
  detected.

Persona readout:

- Product Maintainer: idempotent init should be safe and still useful as a
  setup-health reminder.
- CLI Engineer: do not mutate existing config; choose copy based on loaded
  config plus detected package scripts.
- Docs and DX Writer: avoid placeholders when AgentFlight can name a real next
  command.
- Security Reviewer: no migration, no upload, no telemetry, no extra writes.

Implemented locally:

- `initAgentFlight` now returns detected package proof commands alongside the
  loaded or generated config.
- `agentflight init` uses no-arg `agentflight verify` when config commands are
  present, a concrete explicit command when config commands are empty but proof
  scripts are detected, and `<proof command>` only when nothing is detected.
- Existing config files remain unchanged.

Verification:

- Red AgentFlight-captured core config test failed because detected commands
  were not returned from idempotent init.
- Red AgentFlight-captured workflow test initially exposed a test-harness
  timeout from unstubbed tool inspection, then failed as expected because init
  still printed `<proof command>`.
- Green AgentFlight-captured focused tests passed:
  `npm test -- tests/core/config.test.ts` passed with 1 file / 5 tests, and
  `npm test -- tests/commands/workflow.test.ts` passed with 1 file / 11 tests.
- Combined focused run passed:
  `npm test -- tests/core/config.test.ts tests/commands/workflow.test.ts`
  passed with 2 files / 16 tests.
- Bug-pass verification passed after formatting the workflow test and plan:
  `npm run verify` passed with 21 files / 198 tests plus build,
  `npm run format:check` passed, and `npm pack --dry-run` passed for
  `agentflight@0.6.0`.
- ProjScan doctor passed with health `100/A`.
- ProjScan preflight stayed at the known accumulated branch scale caution:
  247 changed files and manual review signoff recommended.
- ProjScan review returned the known scale-only `block` verdict with maximum
  changed-file risk score `212.1 >= 80`; it reported no risky functions,
  dependency changes, contract changes, dataflow risks, or cycles.
- AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-10-20-verification-report.md`.
- Built CLI smoke `node dist/cli.js init` in this repo printed
  `agentflight verify -- npm run typecheck`; `.agentflight/config.json` still
  had an empty `verification.commands` array afterward.

### Init Configured Verify Workflow

Dogfood finding:

- `agentflight init` now seeds detected package proof commands into
  `.agentflight/config.json`, but the primary workflow still told users to run
  one explicit command: `agentflight verify -- npm run typecheck`. That made the
  first-run path underuse the configured no-arg verify workflow it had just set
  up.

Persona readout:

- Product Maintainer: the golden path should exercise the product's configured
  proof loop, not a one-off command when config is ready.
- CLI Engineer: change only init copy; do not change command execution.
- Docs and DX Writer: quickstart and examples should match what first-run users
  see in the terminal.
- Security Reviewer: no telemetry, no config migration, no extra writes beyond
  init's existing generated files.

Implemented locally:

- `agentflight init` now prints `agentflight verify` in the primary workflow
  when generated config includes verification commands.
- Repos without detected proof scripts still print
  `agentflight verify -- <proof command>`.
- README and the basic session example now show configured `verify` in the
  first-run workflow while keeping explicit `verify -- <command>` documented.

Verification:

- Red AgentFlight-captured workflow test failed because init still printed
  `agentflight verify -- npm run typecheck`.
- Green AgentFlight-captured workflow test passed:
  `npm test -- tests/commands/workflow.test.ts` passed with 1 file / 10 tests.
- Bug-pass verification passed: `npm run verify` passed with 21 files / 197
  tests plus build, `npm run format:check` passed, and `npm pack --dry-run`
  passed for `agentflight@0.6.0`.
- ProjScan doctor passed with health `100/A`.
- ProjScan preflight stayed at the known accumulated branch scale caution:
  244 changed files and manual review signoff recommended.
- ProjScan review returned the known scale-only `block` verdict with maximum
  changed-file risk score `212.1 >= 80`; it reported no risky functions,
  dependency changes, contract changes, dataflow risks, or cycles.
- AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-09-59-verification-report.md`.
- Built CLI smoke in a temp repo printed `agentflight verify` in init's primary
  workflow and generated config with `npm run typecheck` and `npm test`.

### Doctor Concrete Verify Suggestions

Dogfood finding:

- After `agentflight verify` learned to suggest detected package proof commands,
  `agentflight doctor` still warned with the placeholder
  `agentflight verify -- <command>`. That kept the health check one step less
  actionable than the failed command it was diagnosing.

Persona readout:

- Product Maintainer: first-run and old-config guidance should converge on the
  same next action.
- CLI Engineer: reuse detected proof command ordering; do not mutate config.
- Docs and DX Writer: doctor warnings should be copy-pasteable without reading
  implementation docs.
- Security Reviewer: keep doctor read-only, local-only, and path-safe.

Implemented locally:

- Doctor evaluation now accepts detected verification commands and uses them to
  render concise `agentflight verify -- ...` suggestions.
- `runDoctorCommand` passes the same detected package proof commands used by
  verify/init guidance into core doctor checks.
- Repos without detected proof commands keep the original concise fallback.

Verification:

- Red AgentFlight-captured core doctor test failed because the warning still
  used `agentflight verify -- <command>`.
- Red AgentFlight-captured workflow test failed because real package scripts did
  not appear in doctor output.
- Green AgentFlight-captured focused tests passed:
  `npm test -- tests/core/doctor.test.ts` passed with 1 file / 10 tests, and
  `npm test -- tests/commands/workflow.test.ts` passed with 1 file / 10 tests.
- Combined focused run passed:
  `npm test -- tests/core/doctor.test.ts tests/commands/workflow.test.ts`
  passed with 2 files / 20 tests.
- Bug-pass verification passed: `npm run verify` passed with 21 files / 197
  tests plus build, `npm run format:check` passed, and `npm pack --dry-run`
  passed for `agentflight@0.6.0`.
- ProjScan doctor passed with health `100/A`.
- ProjScan preflight stayed at the known accumulated branch scale caution:
  241 changed files and manual review signoff recommended.
- ProjScan review returned the known scale-only `block` verdict with maximum
  changed-file risk score `212.1 >= 80`; it reported no risky functions,
  dependency changes, contract changes, dataflow risks, or cycles.
- AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-09-48-verification-report.md`.
- Built CLI smoke `node dist/cli.js doctor` now suggests
  `agentflight verify -- npm run typecheck`, `agentflight verify -- npm run lint`,
  `agentflight verify -- npm test`, and `agentflight verify -- npm run build`.

### Verify Empty Command Guidance

Dogfood finding:

- After the doctor empty-config warning, `agentflight verify` itself still ended
  at a dead-end when `.agentflight/config.json` had no configured commands. It
  knew no command was configured, but did not show the package proof commands
  AgentFlight can already detect.

Persona readout:

- Product Maintainer: diagnosis and next action should meet at the command that
  failed.
- CLI Engineer: keep config immutable; suggest explicit commands only.
- Docs and DX Writer: show copy-pasteable `agentflight verify -- <command>`
  examples.
- Security Reviewer: no upload, no telemetry, no config migration.

Implemented locally:

- The no-command `agentflight verify` error now detects package proof scripts
  and prints concise `agentflight verify -- ...` suggestions.
- Repos with no detected package proof scripts keep the original concise error.
- Named profile errors remain unchanged and do not include package-script
  suggestions.

Verification:

- Red AgentFlight-captured focused verify test failed because the empty-command
  error had no `Try one of:` guidance.
- Green AgentFlight-captured focused verify test passed:
  `npm test -- tests/commands/verify.test.ts` passed with 1 file / 13 tests.
- Bug-pass verification passed after removing an unused local caught by lint:
  `npm run verify` passed with 21 files / 197 tests plus build,
  `npm run format:check` passed, and `npm pack --dry-run` passed for
  `agentflight@0.6.0`.
- ProjScan doctor passed with health `100/A`.
- ProjScan preflight stayed at the known accumulated branch scale caution:
  238 changed files and manual review signoff recommended.
- ProjScan review returned the known scale-only `block` verdict with maximum
  changed-file risk score `212.1 >= 80`; it reported no risky functions,
  dependency changes, contract changes, dataflow risks, or cycles.
- AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-09-35-verification-report.md`.
- Built CLI smoke `node dist/cli.js verify` now prints concise `Try one of:`
  suggestions for detected package proof commands while leaving config
  unchanged.

### Doctor Empty Verification Config Guidance

Dogfood finding:

- This repo's older `.agentflight/config.json` still had an empty
  `verification.commands` array even though package proof scripts exist. That
  makes `agentflight verify` without an explicit command fail after doctor
  reports the scripts themselves as configured.

Persona readout:

- Product Maintainer: first-run and older-config health checks should prevent
  obvious proof-command dead ends.
- CLI Engineer: warn only; do not mutate config or introduce migration logic.
- Docs and DX Writer: give a concise fix that works for explicit-command users
  and config-command users.
- Security Reviewer: keep doctor local-only and path-safe.

Implemented locally:

- Core doctor evaluation now reports a `verification commands` check when the
  command layer supplies the configured command count.
- `agentflight doctor` warns when no commands are configured while package proof
  scripts are available, suggesting `verification.commands` or an explicit
  `agentflight verify -- <command>`.
- Doctor reports OK when commands are configured, and avoids this warning when
  no package proof scripts are detected.

Verification:

- Red AgentFlight-captured core doctor tests failed because no
  `verification commands` check existed.
- Green AgentFlight-captured core doctor tests passed:
  `npm test -- tests/core/doctor.test.ts` passed with 1 file / 10 tests.
- Red AgentFlight-captured workflow test failed because `runDoctorCommand` did
  not pass configured command count into core doctor evaluation.
- Green AgentFlight-captured workflow test passed:
  `npm test -- tests/commands/workflow.test.ts` passed with 1 file / 10 tests.
- Combined focused run passed:
  `npm test -- tests/core/doctor.test.ts tests/commands/workflow.test.ts`
  passed with 2 files / 20 tests.
- Bug-pass verification passed: `npm run verify` passed with 21 files / 195
  tests plus build, `npm run format:check` passed, and `npm pack --dry-run`
  passed for `agentflight@0.6.0`.
- ProjScan doctor passed with health `100/A`.
- ProjScan preflight stayed at the known accumulated branch scale caution:
  234 changed files and maximum changed-file risk score `212.1 >= 80`.
- ProjScan review returned a scale-only `block` verdict for manual signoff, with
  no cycles, risky functions, dependency changes, contract changes, taint flows,
  or dataflow risks.
- AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-09-21-verification-report.md`.
- Built CLI smoke `node dist/cli.js doctor` now reports
  `Warning verification commands` for this repo's intentionally old empty
  verification config.

### History Malformed Session Paths

Dogfood finding:

- `agentflight history` already counted malformed local session files, but the
  count alone did not tell engineers which local evidence file needed cleanup.

Persona readout:

- Product Maintainer: local session discovery should stay trustworthy when old
  local artifacts are malformed.
- CLI Engineer: keep the command read-only; surface repo-relative paths only.
- Docs and DX Writer: cap the list so history remains scannable.
- Security Reviewer: avoid absolute workspace paths and noisy parser details.

Implemented locally:

- History now renders a `Skipped malformed sessions:` block with up to three
  repo-relative `.agentflight/sessions/*.json` paths.
- Additional malformed session files are summarized with an omitted-count line.
- The command still does not repair, delete, upload, or sync any session data.

Verification:

- Red AgentFlight-captured focused test failed because history only printed the
  malformed-file count.
- Green AgentFlight-captured focused test passed:
  `npm test -- tests/commands/history.test.ts` passed with 1 file / 7 tests.
- Bug-pass verification passed:
  `npm test -- tests/commands/history.test.ts`, `npm run verify`,
  `npm run format:check`, and `npm pack --dry-run`.
- ProjScan doctor passed with health `100/A`.
- ProjScan preflight stayed at the known accumulated branch scale caution:
  231 changed files and maximum changed-file risk score `212.1 >= 80`.
- ProjScan review returned a scale-only `block` verdict for manual signoff, with
  no cycles, risky functions, dependency changes, contract changes, taint flows,
  or dataflow risks.
- AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-09-09-verification-report.md`.

### Document History Latest Action Workflow

Dogfood finding:

- The CLI now uses `agentflight history --limit 1` as the clean-status path
  back to the latest local artifacts, but README and the basic example still
  described history mostly as a generic session list.

Persona readout:

- Product Maintainer: public docs should reinforce history as the local artifact
  reopening path, not just a ledger.
- Docs and DX Writer: keep the wording short and concrete; show the exact
  command.
- CLI Engineer: docs only; no runtime behavior change.
- Security Reviewer: preserve local-only/no-upload wording.

Implemented locally:

- README history copy now mentions the latest action, recorded readiness,
  open-first artifact guidance, and local artifact paths.
- The basic session example now shows
  `npx agentflight@latest history --limit 1` after handoff as the way to reopen
  the latest local artifacts.

Verification:

- AgentFlight-captured `npm run format:check` passed after formatting the plan.
- AgentFlight-captured `npm run verify` passed with 21 files / 190 tests, plus
  build.
- AgentFlight-captured `npm pack --dry-run` passed for `agentflight@0.6.0`.
- Final AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-08-58-verification-report.md`.

### Clean Status History Guidance

Dogfood finding:

- After committing a completed session, `agentflight status` correctly reports a
  clean worktree but only tells the user to start a new session. The just-built
  local report/replay/handoff artifacts are discoverable through
  `agentflight history`, but status does not point there.

Persona readout:

- Product Maintainer: clean status should close the loop by pointing to the
  latest local artifacts and then the next session.
- CLI Engineer: keep this as text guidance only; do not change Review
  Intelligence, JSON status, or artifact generation.
- Docs and DX Writer: make the command exact and short:
  `agentflight history --limit 1`.
- Security Reviewer: status remains read-only and local-only.

Implemented locally:

- Text status now adds a clean-worktree line:
  `Run agentflight history --limit 1 to reopen the latest local artifacts.`
- The existing next line remains visible:
  `Start a new AgentFlight session when you begin the next task.`
- JSON status `nextAction` remains unchanged so scripted callers do not see a
  behavior shift.

Verification:

- Red AgentFlight-captured focused test failed because clean status did not
  mention `agentflight history --limit 1`.
- Green AgentFlight-captured focused test passed:
  `npm test -- tests/commands/evidence-output.test.ts` passed with 1 file / 32
  tests.
- AgentFlight-captured `npm run format:check` passed after formatting the
  devlog and plan.
- AgentFlight-captured `npm run verify` passed with 21 files / 190 tests, plus
  build.
- AgentFlight-captured `npm pack --dry-run` passed for `agentflight@0.6.0`.
- AgentFlight-captured `npm audit --audit-level=moderate` found
  `0 vulnerabilities`.
- AgentFlight-captured `npx projscan@latest doctor --format json` passed with
  health `100/A`.
- AgentFlight-captured
  `npx projscan@latest preflight --mode before_commit --format json` returned
  the known accumulated branch scale caution: 225 changed files and maximum
  changed-file risk score `212.1 >= 80`.
- AgentFlight-captured `npx projscan@latest review --format json` exited `0`
  but returned a scale-only `block` verdict for manual release signoff. Saved
  evidence reported risky functions `0`, dependency changes `0`, contract
  changes `0`, and dataflow risks `0`.
- Final AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-08-44-verification-report.md`.

### History Latest Action Readiness

Dogfood finding:

- The top-level `Latest action:` block now points to the artifact or handoff
  step, but it still omitted whether the latest recorded session was ready,
  blocked, or not recorded. That left one of the product's core review
  questions in the detailed row only.

Persona readout:

- Product Maintainer: the top summary should pair "what should I open?" with
  the latest readiness state.
- CLI Engineer: reuse the existing `formatReadiness` wording; do not add a
  second readiness model.
- Docs and DX Writer: keep the top block compact and leave detailed session
  rows unchanged.
- Security Reviewer: no new file reads beyond existing local session metadata.

Implemented locally:

- The `Latest action:` block now includes `Recorded readiness: ...`.
- Ready latest sessions show the same risk/changed-file wording as the detailed
  row.
- Current no-artifact sessions show `Recorded readiness: not recorded`.

Verification:

- Red AgentFlight-captured focused test failed because the top block did not
  include recorded readiness.
- Green AgentFlight-captured focused test passed:
  `npm test -- tests/commands/history.test.ts` passed with 1 file / 6 tests.
- AgentFlight-captured `npm run format:check` passed after formatting the plan
  and history test.
- AgentFlight-captured `npm run verify` passed with 21 files / 190 tests, plus
  build.
- AgentFlight-captured `npm pack --dry-run` passed for `agentflight@0.6.0`.
- AgentFlight-captured `npm audit --audit-level=moderate` found
  `0 vulnerabilities`.
- AgentFlight-captured `npx projscan@latest doctor --format json` passed with
  health `100/A`.
- AgentFlight-captured
  `npx projscan@latest preflight --mode before_commit --format json` returned
  the known accumulated branch scale caution: 222 changed files and maximum
  changed-file risk score `212.1 >= 80`.
- AgentFlight-captured `npx projscan@latest review --format json` exited `0`
  but returned a scale-only `block` verdict for manual release signoff. Saved
  evidence reported risky functions `0`, dependency changes `0`, contract
  changes `0`, and dataflow risks `0`.
- Final AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-08-31-verification-report.md`.
- Built CLI smoke passed: before handoff, `node dist/cli.js history --limit 2`
  printed `Recorded readiness: not recorded`; after handoff, it printed
  `Recorded readiness: Ready for review (risk medium, 6 changed files)`.

### History Latest Action Before Artifacts

Dogfood finding:

- After adding the top-level `Latest action:` block, a freshly started current
  session with no generated handoff/report/replay artifacts showed
  `Open first: none yet`. That is accurate but leaves the user without the
  handoff golden-path step.

Persona readout:

- Product Maintainer: keep the newest session as the anchor, but tell users how
  to create the review packet when no artifact exists yet.
- CLI Engineer: history must remain read-only; it should never generate the
  handoff itself.
- Docs and DX Writer: keep `Open first: none yet` for honesty, then add one
  concise next action.
- Security Reviewer: no upload, no telemetry, no hidden mutation.

Implemented locally:

- The top-level `Latest action:` block now appends
  `Next: run agentflight handoff` only when the newest session is also the
  current session and no primary artifact exists yet.
- Sessions with existing artifacts keep the previous top-level latest-action
  output with no extra next-action line.
- Per-session history rows remain unchanged.

Verification:

- Red AgentFlight-captured focused test failed because the next-action line was
  not rendered yet.
- A second focused run still failed because the test helper saved the older
  session after starting the current session, which rewrote the current pointer.
  The fixture now finalizes the older replay session first and starts the
  current no-artifact session last.
- Green AgentFlight-captured focused test passed:
  `npm test -- tests/commands/history.test.ts` passed with 1 file / 6 tests.
- AgentFlight-captured `npm run format:check` passed after formatting the plan.
- AgentFlight-captured `npm run verify` passed with 21 files / 190 tests,
  plus build.
- AgentFlight-captured `npm pack --dry-run` passed for `agentflight@0.6.0`.
- AgentFlight-captured `npm audit --audit-level=moderate` found
  `0 vulnerabilities`.
- AgentFlight-captured `npx projscan@latest doctor --format json` passed with
  health `100/A`.
- AgentFlight-captured
  `npx projscan@latest preflight --mode before_commit --format json` returned
  the known accumulated branch scale caution: 219 changed files and maximum
  changed-file risk score `212.1 >= 80`.
- AgentFlight-captured `npx projscan@latest review --format json` exited `0`
  but returned a scale-only `block` verdict for manual release signoff. Saved
  evidence reported risky functions `0`, dependency changes `0`, contract
  changes `0`, and dataflow risks `0`.
- Final AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-08-19-verification-report.md`.
- Built CLI smoke passed: before handoff, `node dist/cli.js history --limit 2`
  printed `Next: run agentflight handoff`; after handoff, it printed the
  current session replay path instead.

### History Latest Action

Dogfood finding:

- `agentflight history --limit 5` now includes actionable artifact paths, but a
  reviewer still has to scan into the first session block to find the newest
  thing to open.

Persona readout:

- Product Maintainer: session discovery should answer the newest local review
  action before the detailed ledger.
- CLI Engineer: reuse the existing `Open first:` artifact-selection logic; do
  not add search, session switching, export modes, or hidden state.
- Docs and DX Writer: keep the full session list and artifact paths intact, but
  give the first action a predictable top-level spot.
- Security Reviewer: keep paths repo-relative and local-only.

Implemented locally:

- `agentflight history` now renders a top-level `Latest action:` block before
  `Recent sessions:`.
- The latest action uses the same open-first selection logic as each session
  row, so ready sessions still prefer replay and blocked sessions still prefer
  report.
- Per-session `Open first:`, handoff, report, replay, and resume lines remain
  unchanged.

Verification:

- Red AgentFlight-captured focused test failed because `Latest action:` was not
  rendered yet.
- Green AgentFlight-captured focused test passed:
  `npm test -- tests/commands/history.test.ts` passed with 1 file / 5 tests.
- First full `npm run verify` pass failed at typecheck because `sessions[0]`
  remained typed as possibly undefined after the empty-history branch.
- Added an explicit latest-session guard and centralized empty-history copy in
  `formatEmptyHistory`.
- AgentFlight-captured `npm run verify` then passed with 21 files / 189 tests,
  plus build.
- AgentFlight-captured `npm run format:check` passed after formatting
  `src/commands/history.ts` and the plan document.
- AgentFlight-captured `npm pack --dry-run` passed for `agentflight@0.6.0`.
- AgentFlight-captured `npm audit --audit-level=moderate` found
  `0 vulnerabilities`.
- AgentFlight-captured `npx projscan@latest doctor --format json` passed with
  health `100/A`.
- Final AgentFlight-captured
  `npx projscan@latest preflight --mode before_commit --format json` returned
  the known accumulated branch scale caution: 217 changed files and maximum
  changed-file risk score `212.1 >= 80`.
- AgentFlight-captured `npx projscan@latest review --format json` exited `0`
  but returned a scale-only `block` verdict for manual release signoff. Saved
  evidence reported risky functions `0`, dependency changes `0`, contract
  changes `0`, and dataflow risks `0`.
- Final AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-08-05-verification-report.md`.
- AgentFlight-captured `npm run build` passed.
- Built CLI smoke passed: after `node dist/cli.js handoff`,
  `node dist/cli.js history --limit 2` printed the top-level
  `Latest action:` with the current session replay path.
- `npx agentloopkit@latest check-gates` passed after generating
  `.agentloop/handoffs/2026-06-21-08-06-pr-summary.md`.

### Handoff Open First Path

Dogfood finding:

- The golden-path handoff output selected `Open first: replay` or
  `Open first: report`, but reviewers still had to map the label to a later
  artifact path line before opening the file.

Persona readout:

- Product Maintainer: the handoff packet should answer the next review action
  without extra lookup work.
- CLI Engineer: derive the path from already generated artifact paths and leave
  exit codes/readiness unchanged.
- Docs and DX Writer: keep the artifact list intact while making the first
  action directly actionable.
- Security Reviewer: keep paths repo-relative and local-only.

Implemented locally:

- Ready handoffs now render `Open first: replay <path>`.
- Blocked or not-ready handoffs now render `Open first: report <path>`.
- Handoff artifact generation, exit codes, and local-only wording are unchanged.

Verification:

- Red AgentFlight-captured focused test failed because handoff output still
  printed only the open-first artifact label.
- Green AgentFlight-captured focused test passed:
  `npm test -- tests/commands/evidence-output.test.ts` passed with 1 file / 32
  tests.
- Clean-session bug pass:
  `npm test -- tests/commands/evidence-output.test.ts` passed with 1 file / 32
  tests.
- AgentFlight-captured `npm run verify` passed with 21 files / 189 tests,
  plus build.
- AgentFlight-captured `npm run format:check` passed.
- AgentFlight-captured `npm pack --dry-run` passed for `agentflight@0.6.0`.
- AgentFlight-captured `npm audit --audit-level=moderate` found
  `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the known accumulated branch scale caution: 213 changed files versus the
  threshold of 50 and maximum changed-file risk score `212.1 >= 80`.
- `npx projscan@latest review --format json` returned a scale-only review block
  on the same max changed-file risk score, with no cycles, risky functions,
  dependency changes, contract changes, taint flows, or dataflow risks reported.
- AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-07-47-verification-report.md`.
- Final AgentFlight handoff smoke printed
  `Open first: replay .agentflight/reports/...-replay.html`.
- Post-handoff AgentFlight-captured `npm run format:check` passed.
- `npx agentloopkit@latest check-gates` passed with current verification and
  handoff evidence, while still naming an older archived task contract in the
  task-contract gate. This is the same AgentLoopKit stale-task-selection
  feedback observed in prior tasks.

### History Open First Path

Dogfood finding:

- `agentflight history` correctly chose an `Open first:` artifact, but in long
  lists the user still had to map that label to a separate artifact path line.

Persona readout:

- Product Maintainer: local session discovery should answer what to open without
  adding search, sync, or session switching.
- CLI Engineer: keep the command read-only and reuse existing artifact path
  lookup instead of adding state.
- Docs and DX Writer: keep output compact; show the path where the decision is
  made and leave the full artifact list intact.
- Repo Steward: treat this as scanability polish, not a new workflow.

Implemented locally:

- `agentflight history` now renders `Open first: <artifact> <path>` when the
  chosen artifact exists.
- Sessions without a primary artifact still render `Open first: none yet`.
- Handoff, report, replay, and resume path lines remain visible for complete
  local context.

Verification:

- Red AgentFlight-captured focused test failed because `Open first:` still only
  printed the artifact label.
- Green AgentFlight-captured focused test passed:
  `npm test -- tests/commands/history.test.ts` passed with 1 file / 5 tests.
- First format pass caught Prettier drift in `src/commands/history.ts`; after
  formatting, AgentFlight-captured focused history tests and `format:check`
  passed.
- AgentFlight-captured `npm run verify` passed with 21 files / 189 tests,
  plus build.
- AgentFlight-captured `npm pack --dry-run` passed for `agentflight@0.6.0`.
- AgentFlight-captured `npm audit --audit-level=moderate` found
  `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the known accumulated branch scale caution: 210 changed files versus the
  threshold of 50 and maximum changed-file risk score `212.1 >= 80`.
- `npx projscan@latest review --format json` returned a scale-only review block
  on the same max changed-file risk score, with no cycles, risky functions,
  dependency changes, contract changes, taint flows, or dataflow risks reported.
- AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-07-34-verification-report.md`.
- Built CLI smoke passed:
  `node dist/cli.js history --limit 2` printed `Open first: replay` with the
  selected local replay path on the same line.
- Post-handoff AgentFlight-captured `npm run format:check` passed.
- `npx agentloopkit@latest check-gates` passed with current verification and
  handoff evidence, while still naming an older archived task contract in the
  task-contract gate. This is the same AgentLoopKit stale-task-selection
  feedback observed in prior tasks.

### Generated Tool State Review Ranking

Dogfood finding:

- First-run handoff dogfood still showed `.projscan-memory/memory.json` as
  capable of outranking real review targets when generated tool state received
  a high ProjScan risk hint.

Persona readout:

- First-Time Developer: the first review list should point at project config and
  user changes before generated tool cache state.
- Product Maintainer: keep `.projscan-memory/**` suggestion-only; do not hide
  generated memory by default.
- Verification Engineer: preserve ProjScan hint ranking for normal files while
  covering generated-tool-state ranking with a regression test.
- Repo Steward: keep the change narrow in Review Intelligence and avoid adding
  a broader workspace hygiene system.

Implemented locally:

- Added a regression test where `.projscan-memory/memory.json` has a high
  ProjScan risk hint and still ranks below `.agentflight/config.json` and
  `README.md`.
- Review Intelligence now suppresses ProjScan hint score boosts for files
  already classified as generated guidance.
- The generated memory file remains visible, keeps the generated-tool-state
  reason, and keeps the existing `changedFileFilters.ignore` suggestion.

Verification:

- Red AgentFlight-captured focused test failed on review focus ordering:
  `npm test -- tests/core/review-intelligence.test.ts`.
- Green AgentFlight-captured focused test passed: 1 file / 23 tests.
- Bug-pass AgentFlight-captured focused test passed again: 1 file / 23 tests.
- AgentFlight-captured `npm run verify` passed with 21 files / 189 tests,
  plus build.
- AgentFlight-captured `npm run format:check` passed.
- AgentFlight-captured `npm pack --dry-run` passed for `agentflight@0.6.0`.
- AgentFlight-captured `npm audit --audit-level=moderate` found
  `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the known accumulated branch scale caution: 207 changed files versus the
  threshold of 50 and maximum changed-file risk score `208.2 >= 80`.
- `npx projscan@latest review --format json` returned a scale-only review block
  on the same max changed-file risk score, with no cycles, risky functions,
  dependency changes, contract changes, taint flows, or dataflow risks reported.
- AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-07-25-verification-report.md`.
- Post-handoff AgentFlight-captured `npm run format:check` passed.
- `npx agentloopkit@latest check-gates` passed with current verification and
  handoff evidence, while still naming an older archived task contract in the
  task-contract gate. Treat this as the same AgentLoopKit stale-task-selection
  feedback observed in prior tasks.

### Docs Init Proof Seeding Alignment

Dogfood finding:

- After init began seeding detected verification commands into
  `.agentflight/config.json`, README and verification docs still described init
  more generically. The 60-second workflow also still put `status` before the
  handoff-first path.

Persona readout:

- First-Time Developer: the quickstart should match the exact first-run output
  and generated config.
- Product Maintainer: `handoff` should remain the default post-verification
  path in public docs.
- Docs and DX Writer: keep report, replay, resume, status, snapshot, and history
  visible as supporting artifacts and commands without making the first run feel
  like five required review steps.

Implemented locally:

- README now describes `init` as seeding detected verification commands when
  package scripts exist.
- README 60-second workflow now runs `handoff` immediately after verification,
  with `status`, `snapshot`, and `history` as follow-up commands.
- `docs/development/verification.md` now explains that init-created configs can
  include detected package-script commands, while existing configs remain
  untouched and repos without proof scripts keep an empty command list.

Verification:

- AgentFlight-captured `npm run format:check` passed.
- AgentFlight-captured `npm run verify` passed with 21 files / 188 tests,
  plus build.
- AgentFlight-captured `npm pack --dry-run` passed for `agentflight@0.6.0`.
- AgentFlight-captured `npm audit --audit-level=moderate` found
  `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the known accumulated branch scale caution: 204 changed files versus the
  threshold of 50 and maximum changed-file risk score `207.9 >= 80`.
- `npx projscan@latest review --format json` returned a scale-only review block
  on the same max changed-file risk score, with no cycles, risky functions,
  dependency changes, contract changes, taint flows, or dataflow risks reported.
- AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-07-16-verification-report.md`.
- Post-handoff AgentFlight-captured `npm run format:check` passed.
- `npx agentloopkit@latest check-gates` passed with current verification and
  handoff evidence, while still naming an older archived task contract in the
  task-contract gate. Treat this as AgentLoopKit stale-task-selection feedback,
  not a blocker for this docs-only change.

### Seed Init Verification Commands

Dogfood finding:

- `agentflight init` could display a detected proof command, but the generated
  `.agentflight/config.json` still contained an empty `verification.commands`
  list. That made the visible project config less useful on first run and
  weakened the connection between init guidance and project defaults.

Persona readout:

- First-Time Developer: the config created by init should explain the same
  proof path the terminal just suggested.
- Docs and DX Writer: keep the generated config useful without making users
  learn profiles on day one.
- Verification Engineer: use the existing deterministic package-script
  detector and cover both detected and no-proof-script repos.
- Repo Steward: never overwrite existing configs; first-run seeding should only
  apply when AgentFlight creates the config.

Implemented locally:

- `initAgentFlight` now seeds newly created configs with detected verification
  commands such as `npm run typecheck`, `npm run lint`, `npm test`, and
  `npm run build`.
- Repos without proof scripts still get an empty `verification.commands` array.
- Existing configs are still skipped and not overwritten.
- `agentflight init` now uses `result.config.verification.commands` for its
  primary workflow line, so terminal guidance and generated config agree.

Verification:

- Red AgentFlight-captured focused tests failed because new configs still had
  an empty `verification.commands` array.
- AgentFlight-captured focused tests now pass:
  `npm test -- tests/core/config.test.ts tests/commands/workflow.test.ts`
  passed: 2 files / 14 tests.
- AgentFlight-captured `npm run build` passed.
- Built CLI smoke passed in temp repos: detected proof scripts were written to
  `.agentflight/config.json`, profiles stayed empty, init output pointed to
  `agentflight verify -- npm run typecheck`, and a repo with only `dev` script
  kept empty commands with the `<proof command>` fallback.
- AgentFlight-captured full verification passed: `npm run verify` passed with
  21 files / 188 tests, plus build.
- First format pass caught Prettier drift in
  `tests/commands/workflow.test.ts`; after formatting,
  `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale caution: 200 changed files and maximum
  changed-file risk score `207.9`.
- `npx projscan@latest review --format json` returned the same manual-signoff
  scale block only: maximum changed-file risk score `207.9`, no risky
  functions, no dependency changes, no contract changes, no taint flows, no
  dataflow risks, and no cycles.
- AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-07-05-verification-report.md`.
- Post-handoff `npm run format:check` passed under AgentFlight capture.
- `npx agentloopkit@latest check-gates` passed. The output still named an
  older archived task contract while using the current verification report and
  handoff, which remains AgentLoopKit feedback rather than an AgentFlight
  blocker.

### Init Detected Proof Guidance

Dogfood finding:

- After the init golden-path copy moved users toward `start`, `verify`, and
  `handoff`, the verify line still hardcoded `npm test`. In repos where
  AgentFlight detects `typecheck`, `lint`, or `build` as the first proof
  command, that guidance can send first-run users to the wrong initial proof.

Persona readout:

- First-Time Developer: the first suggested verify command should match the
  current repo, not a generic npm convention.
- CLI Engineer: reuse existing package-script verification detection instead
  of creating a second command-ranking rule.
- Verification Engineer: keep a clear fallback when no proof command is
  detected, and cover both detected and fallback paths.
- Repo Steward: keep config generation unchanged; this is display guidance,
  not a schema or profile change.

Implemented locally:

- `agentflight init` now reads `package.json` for display-only verification
  guidance and uses the first detected command in the primary workflow.
- When no proof command is detected, init prints
  `agentflight verify -- <proof command>`.
- `.agentflight/config.json` defaults, package metadata, and session behavior
  are unchanged.

Verification:

- Red AgentFlight-captured workflow test failed because init still printed the
  hardcoded `agentflight verify -- npm test` line.
- AgentFlight-captured focused workflow test now passes:
  `npm test -- tests/commands/workflow.test.ts` passed: 1 file / 9 tests.
- AgentFlight-captured `npm run build` passed.
- Built CLI smoke passed for both detected and fallback paths:
  `agentflight init` printed `agentflight verify -- npm run typecheck` when
  `typecheck` was detected first, and `agentflight verify -- <proof command>`
  when no proof script was detected.
- Bug pass: two malformed smoke-script attempts were recorded as failed
  verification runs; they were resolved by rerunning the same smoke command
  strings through a temporary fake shell, then rerunning the corrected smoke.
- AgentFlight-captured full verification passed: `npm run verify` passed with
  21 files / 186 tests, plus build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale caution: 197 changed files and maximum
  changed-file risk score `207.9`.
- `npx projscan@latest review --format json` returned the same manual-signoff
  scale block only: maximum changed-file risk score `207.9`, no risky
  functions, no dependency changes, no contract changes, no taint flows, no
  dataflow risks, and no cycles.
- AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-06-53-verification-report.md`.
- Post-handoff `npm run format:check` passed under AgentFlight capture.
- `npx agentloopkit@latest check-gates` passed. The output still named an
  older archived task contract while using the current verification report and
  handoff, which remains AgentLoopKit feedback rather than an AgentFlight
  blocker.

### Init Handoff Golden Path

Dogfood finding:

- Post-v0.6.0 research and handoff dogfood made `agentflight handoff` the local
  end-of-session path, but `agentflight init` still ended by sending first-run
  users to `status` before `doctor`. That made the first-run CLI guidance lag
  behind the product's current golden path.

Persona readout:

- First-Time Developer: the first output should say what to do next without
  making users choose between status, report, replay, resume, and handoff.
- Maintainer or Reviewer: the useful path is `start`, captured verification,
  then the handoff packet.
- Docs and DX Writer: keep status and doctor visible, but frame them as
  supporting checks rather than the primary workflow.
- CLI Engineer: change copy only; do not alter generated files, config, or
  runtime behavior.

Implemented locally:

- `agentflight init` now prints a `Primary workflow` block:
  `agentflight start --task "Describe the work"`,
  `agentflight verify -- npm test`, and `agentflight handoff`.
- `agentflight status` and `agentflight doctor` remain visible in a
  `Supporting checks` block.

Verification:

- Red AgentFlight-captured workflow test failed because init still printed the
  old `Next commands` block with `status` and `doctor`.
- AgentFlight-captured focused workflow test now passes:
  `npm test -- tests/commands/workflow.test.ts` passed: 1 file / 8 tests.
- AgentFlight-captured `npm run build` passed.
- Built CLI smoke passed in a clean temp repo: `agentflight init` printed
  `Primary workflow`, `agentflight verify -- npm test`, `agentflight handoff`,
  `Supporting checks`, `agentflight status`, and `agentflight doctor`.
- AgentFlight-captured full verification passed: `npm run verify` passed with
  21 files / 185 tests, plus build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale caution: 194 changed files and maximum
  changed-file risk score `207.9`.
- `npx projscan@latest review --format json` returned the same manual-signoff
  scale block only: maximum changed-file risk score `207.9`, no risky
  functions, no dependency changes, no contract changes, no taint flows, no
  dataflow risks, and no cycles.
- AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-06-40-verification-report.md`.
- Post-handoff `npm run format:check` passed under AgentFlight capture.
- `npx agentloopkit@latest check-gates` passed. The output still named an
  older archived task contract while using the current verification report and
  handoff, which remains AgentLoopKit feedback rather than an AgentFlight
  blocker.

### Parallel Artifact Event Preservation

Dogfood finding:

- Running `history`, `doctor`, `resume`, and `report` in parallel showed a
  freshly generated report did not update history's recorded readiness. The
  artifact commands were saving stale session snapshots, so the last writer
  could drop another command's event.

Persona readout:

- Verification Engineer: report, replay, and resume are review evidence and
  their generated events should survive concurrent review tooling.
- CLI Engineer: use the existing locked session mutation path instead of adding
  a new synchronization mechanism.
- Repo Steward: keep artifact formats unchanged; only fix persistence.

Implemented locally:

- `report`, `replay`, and `resume` now persist generated events through
  `appendSessionEvent(...)`, which merges against the latest locked session.
- Report and replay still use a local event copy for timeline rendering.
- The incomplete-verification fixture now uses `saveSession(...)` so current
  and canonical session files stay in sync.

Verification:

- Red AgentFlight-captured focused test failed because concurrent report,
  replay, and resume left only `resume_generated` in the persisted session.
- AgentFlight-captured focused verification now passes:
  `npm test -- tests/commands/evidence-output.test.ts tests/core/session.test.ts`
  passed: 2 files / 39 tests.
- Built-CLI dogfood generated `report`, `replay`, and `resume` concurrently
  for this session; `history --limit 1` then showed recorded readiness plus all
  three artifact paths.
- AgentFlight-captured full verification passed: `npm run verify` passed with
  21 files / 185 tests, plus build.
- First format pass caught Prettier drift in `src/commands/report.ts` and
  `src/commands/replay.ts`; after formatting, `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale caution: 191 changed files and maximum
  changed-file risk score `207.9`.
- `npx projscan@latest review --format json` returned the same manual-signoff
  scale block only: maximum changed-file risk score `207.9`, no risky
  functions, no dependency changes, no contract changes, no taint flows, no
  dataflow risks, and no cycles.
- AgentFlight-captured `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-06-29-verification-report.md`.
- Post-handoff `npm run format:check` passed under AgentFlight capture.
- `npx agentloopkit@latest check-gates` passed. The output still named an
  older archived task contract while using the current verification report and
  handoff, which remains AgentLoopKit feedback rather than an AgentFlight
  blocker.

### Clean Risk Reason Wording

Dogfood finding:

- After `Risk: none` landed, clean status still showed the shared risk reason
  `No changed files detected yet.` That made a post-commit clean worktree sound
  like work had not started.

Persona readout:

- Product Maintainer: the clean state should feel final and reviewable after a
  commit, not tentative.
- CLI Engineer: update the shared risk reason so text and JSON remain aligned.
- Docs and DX Writer: reuse the existing Review Intelligence wording:
  `No changed files are currently detected.`

Implemented locally:

- `analyzeRisk([])` now returns the reason
  `No changed files are currently detected.`
- Risk levels, categories, and non-empty risk reasons are unchanged.

Verification:

- Red AgentFlight-captured focused test failed because the risk reason still
  contained `No changed files detected yet.`
- AgentFlight-captured focused verification now passes:
  `npm test -- tests/core/risk.test.ts tests/commands/evidence-output.test.ts`
  passed: 2 files / 50 tests.
- AgentFlight-captured full verification passed: `npm run verify` passed with
  21 files / 184 tests, plus build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale caution: 188 changed files and maximum
  changed-file risk score `207.9`.
- `npx projscan@latest review --format json` returned the same manual-signoff
  scale block only: maximum changed-file risk score `207.9`, no risky
  functions, no dependency changes, no contract changes, no taint flows, no
  dataflow risks, and no new cycles.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-06-13-verification-report.md`.
- `npx agentloopkit@latest check-gates` passed with current verification and
  handoff evidence.
- Built CLI smoke passed in a clean temp repo: `agentflight status` reported
  `Risk: none`, used `No changed files are currently detected.`, and did not
  include the old `No changed files detected yet.` wording.

### Clean Status Risk Wording

Dogfood finding:

- After committing the doctor guidance task, `agentflight status` correctly
  reported `Readiness: Clean worktree` but still printed `Risk: unknown`. That
  made a known clean state sound ambiguous.

Persona readout:

- Product Maintainer: clean should be calm and explicit; unknown should mean
  AgentFlight lacks enough metadata.
- CLI Engineer: fix the shared risk analysis result so text and JSON agree.
- Docs and DX Writer: keep the copy short: `Risk: none` is scannable and pairs
  cleanly with `Changed files: 0`.

Implemented locally:

- Added `none` to the `RiskLevel` model for zero changed files.
- `analyzeRisk([])` now returns `level: "none"` with the existing
  `No changed files detected yet.` reason.
- Historical `unknown` risk metadata remains readable for old artifact events.

Verification:

- Red AgentFlight-captured focused test failed because zero changed files still
  returned `level: "unknown"`.
- AgentFlight-captured focused verification now passes:
  `npm test -- tests/core/risk.test.ts tests/commands/evidence-output.test.ts`
  passed: 2 files / 50 tests.
- AgentFlight-captured full verification passed: `npm run verify` passed with
  21 files / 184 tests, plus build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale caution: 185 changed files and maximum
  changed-file risk score `207.9`.
- `npx projscan@latest review --format json` returned the same manual-signoff
  scale block only: maximum changed-file risk score `207.9`, no risky
  functions, no dependency changes, no contract changes, no taint flows, no
  dataflow risks, and no new cycles.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-06-04-verification-report.md`.
- `npx agentloopkit@latest check-gates` passed with current verification and
  handoff evidence.
- Built CLI smoke passed in a clean temp repo: `agentflight status` reported
  `Risk: none` and `Readiness: Clean worktree`.
- An earlier smoke attempt wrote `status.txt` inside the temp repo before
  running status, so AgentFlight correctly saw one changed docs file. The same
  command was rerun with a temporary git exclude for `status.txt` and passed,
  resolving that evidence as smoke-script noise.

### Doctor Current Session Guidance

Dogfood finding:

- In a freshly initialized repo, `agentflight doctor` warned that no current
  session existed even though that is normal before work begins. The warning
  made a healthy first-run setup look less ready than it was.

Persona readout:

- Product Maintainer: doctor should answer whether local setup is healthy, not
  imply that every repo must have an active session at rest.
- CLI Engineer: keep session-required command errors unchanged; this is only a
  doctor check classification change.
- Docs and DX Writer: keep the start-session instruction visible in the same
  row so first-run users still know what to do next.

Implemented locally:

- The missing `current session` doctor check now reports OK guidance:
  `No current session is active. Run agentflight start --task "..." when you begin work.`
- Existing active-session OK output remains unchanged.
- Commands that require an active session are unchanged.

Verification:

- Red AgentFlight-captured focused test failed because doctor still returned
  `warning` when only the current session was missing.
- AgentFlight-captured focused verification now passes:
  `npm test -- tests/core/doctor.test.ts tests/commands/workflow.test.ts`
  passed: 2 files / 15 tests.
- AgentFlight-captured full verification passed: `npm run verify` passed with
  21 files / 184 tests, plus build.
- `npm run format:check` passed after formatting the new plan file and again
  after handoff markdown updates.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale caution: 182 changed files and maximum
  changed-file risk score `207.9`.
- `npx projscan@latest review --format json` returned the same manual-signoff
  scale block only: maximum changed-file risk score `207.9`, no risky
  functions, no dependency changes, no contract changes, no taint flows, no
  dataflow risks, and no new cycles.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-05-50-verification-report.md`.
- `npx agentloopkit@latest check-gates` passed with current verification and
  handoff evidence.
- Built CLI doctor smoke passed: a temp repo with proof scripts configured and
  no active AgentFlight session reported `Overall: OK` and `OK current session`
  with the start-session guidance.

### Replay Historical Failed Ledger Labels

Dogfood finding:

- Ready sessions with resolved red/green failures correctly remove urgent
  failed-run navigation, but the replay ledger still showed resolved failed rows
  as plain `FAIL`. That can make a ready replay look more currently broken than
  the proof summary says.

Persona readout:

- Product Maintainer: resolved failures should remain visible as trust evidence
  without looking like current action items.
- Verification Engineer: preserve urgent unresolved failure behavior and do not
  infer per-run resolution when mixed unresolved/resolved failures exist.
- Docs and DX Writer: keep the label compact in the ledger; the proof summary
  already explains historical counts.

Implemented locally:

- HTML replay now renders failed ledger rows as `HIST` with historical styling
  when `verificationSummary.unresolvedFailed` is `0`.
- Unresolved failed rows still render as `FAIL` and keep urgent navigation.
- Raw stdout/stderr evidence paths and failure excerpts remain unchanged.

Verification:

- Red focused replay test failed because resolved failed rows still used
  `entry--failed`.
- AgentFlight-captured focused verification now passes:
  `npm test -- tests/renderers/html-replay.test.ts tests/commands/evidence-output.test.ts`
  passed: 2 files / 38 tests.
- Final AgentFlight-captured full verification passed: `npm run verify` passed
  with 21 files / 182 tests, plus build.
- `npm run format:check` passed after a focused Prettier fix to the replay test.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale caution.
- `npx projscan@latest review --format json` returned the same
  manual-signoff scale block only: maximum changed-file risk score `207.9`, no
  risky functions, no dependency changes, no contract changes, and no dataflow
  risks.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-05-38-verification-report.md`.
- Built CLI replay smoke passed: `agentflight replay` generated HTML containing
  `entry--historical-failed` and `stamp--historical-failed`.

### Doctor Path-Safe Repository Root Output

Dogfood finding:

- `agentflight doctor` printed the absolute local repository root. That is
  useful for local debugging but too easy to paste into a handoff, issue, or
  support thread with a username or private folder structure.

Persona readout:

- Security Reviewer: successful doctor output should avoid local path leakage
  when the path is not required to act.
- Docs and DX Writer: the useful success signal is "repo root detected"; the
  absolute path is extra noise.
- CLI Engineer: preserve repository-root detection and the missing-root error;
  change only the successful check text.

Implemented locally:

- The successful `repository root` doctor check now prints
  `Repository root detected.`.
- The missing-root error still says AgentFlight could not determine a
  repository root and tells users to run inside a git repository or project
  directory.

Verification:

- Red focused test failed because doctor still returned the absolute root path.
- AgentFlight-captured focused verification now passes:
  `npm test -- tests/core/doctor.test.ts tests/commands/workflow.test.ts`
  passed: 2 files / 13 tests.
- Final AgentFlight-captured full verification passed: `npm run verify` passed
  with 21 files / 182 tests, plus build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale caution.
- `npx projscan@latest review --format json` returned the same
  manual-signoff scale block only: maximum changed-file risk score `207.9`, no
  risky functions, no dependency changes, no contract changes, and no dataflow
  risks.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-05-29-verification-report.md`.
- Built CLI doctor smoke passed: the output contained
  `Repository root detected.` and did not contain the local repo root path.

### AgentFlight Repo ProjScan Memory Filter

Dogfood finding:

- After `agentflight doctor` learned to warn on local ProjScan memory, this repo
  correctly reported `.projscan-memory/memory.json` as present and reviewable.
  In AgentFlight itself that file is generated local evidence, so the repo
  should follow AgentFlight's own suggestion and opt into filtering it.

Persona readout:

- Product Maintainer: this validates the suggestion-only workflow in a real
  repo instead of changing product defaults.
- CLI Engineer: keep built-in filters unchanged; use project config for project
  policy.
- Security Reviewer: no deletion or mutation of generated evidence is needed.

Implemented locally:

- `.agentflight/config.json` now includes
  `changedFileFilters.ignore: [".projscan-memory/**"]`.
- Built-in changed-file filters remain unchanged.

Verification:

- Red doctor smoke confirmed the generated tool state warning appeared before
  the config change.
- AgentFlight-captured doctor smoke now reports generated tool state as OK after
  the repo config filter.
- `npm run format:check` passed.
- `npm run verify` passed with 21 files / 180 tests, plus build.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale caution.
- `npx projscan@latest review --format json` returned the same
  manual-signoff scale block only: maximum changed-file risk score `207.9`, no
  risky functions, no dependency changes, no contract changes, and no dataflow
  risks.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-05-21-verification-report.md`.

### History Recorded Readiness Label

Dogfood finding:

- After a task is committed, `agentflight status` correctly reports a clean
  worktree, while `agentflight history` still shows the latest stored review
  metadata for that session. The data is useful, but the `Readiness:` label can
  read like a live worktree claim for the current session.

Persona readout:

- Product Maintainer: history should be honest that it is showing recorded
  artifact state, not recomputing review readiness.
- CLI Engineer: keep history read-only; change the label rather than adding git
  status work to session listing.
- Docs and DX Writer: align the CLI with existing README wording: recorded
  readiness.
- Verification Engineer: keep `Open first:` and artifact path behavior
  unchanged.

Implemented locally:

- `agentflight history` now prints `Recorded readiness:`.
- Older sessions without metadata now print `Recorded readiness: not recorded`.
- Session storage, readiness metadata, artifact selection, and open-first
  guidance are unchanged.

Verification:

- Red focused test failed because history still printed `Readiness:`.
- AgentFlight-captured focused verification now passes:
  `npm test -- tests/commands/history.test.ts tests/core/session.test.ts`
  passed: 2 files / 12 tests.
- Final AgentFlight-captured full verification passed: `npm run verify` passed
  with 21 files / 180 tests, plus build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale caution.
- `npx projscan@latest review --format json` returned the same
  manual-signoff scale block only: maximum changed-file risk score `207.9`, no
  risky functions, no dependency changes, no contract changes, and no dataflow
  risks.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-05-15-verification-report.md`.
- Built CLI smoke passed: `agentflight history --limit 2` printed
  `Recorded readiness:` for recent sessions.

### Doctor Generated Artifact Guidance

Dogfood finding:

- First-run workspace hygiene keeps coming up in research and dogfood:
  `.projscan-memory/memory.json` should remain visible unless the project opts
  out, but users need a direct setup-health surface to explain what to do when
  that generated state appears.

Persona readout:

- First-Time Developer: doctor should answer "is this setup okay?" without
  requiring a separate docs search.
- Product Maintainer: keep `.projscan-memory/**` suggestion-only; do not hide
  repo policy decisions behind defaults.
- CLI Engineer: add a dynamic doctor check rather than another review renderer.
- Security Reviewer: read local paths and config only; do not mutate config or
  upload anything.

Implemented locally:

- `agentflight doctor` now checks for `.projscan-memory/memory.json`.
- When the file exists and remains reviewable, doctor prints a concise warning
  suggesting `.projscan-memory/**` in `changedFileFilters.ignore`.
- When the repo already filters it, doctor reports the generated tool state as
  OK.
- Built-in changed-file filters remain unchanged; `.projscan-memory/**` is not
  hardcoded as ignored.

Verification:

- Red targeted test failed because doctor did not include generated tool state.
- AgentFlight-captured targeted verification now passes:
  `npm test -- tests/core/doctor.test.ts tests/commands/workflow.test.ts`
  passed: 2 files / 11 tests.
- Final AgentFlight-captured full verification passed: `npm run verify` passed
  with 21 files / 180 tests, plus build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale caution.
- `npx projscan@latest review --format json` returned the same
  manual-signoff scale block only: maximum changed-file risk score `207.9`, no
  risky functions, no dependency changes, no contract changes, and no dataflow
  risks.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-05-06-verification-report.md`.
- Built CLI smoke in a temp repo showed `agentflight doctor` warning when
  `.projscan-memory/memory.json` remained reviewable, then reporting OK after
  `.projscan-memory/**` was added to `changedFileFilters.ignore`.

### Init Created/Skipped File Lists

Dogfood finding:

- Fresh `agentflight init` output said `Created: 2` and
  `Skipped existing files: 0`. The local-file guidance was good, but first-run
  trust is stronger when the CLI names the project config and local `.gitignore`
  it touched.

Persona readout:

- Product Maintainer: first-run output should make local file creation obvious
  without requiring users to inspect the worktree.
- CLI Engineer: reuse the existing `created` and `skipped` arrays; do not change
  init behavior or config shape.
- Docs and DX Writer: keep paths repo-relative and line-oriented for scanning.
- Security Reviewer: avoid absolute user paths in first-run output.

Implemented locally:

- `agentflight init` now prints `Created files:` and
  `Skipped existing files:` lists.
- Empty lists render as `- none`.
- Paths are repo-relative and sorted so `.agentflight/config.json` appears
  before `.agentflight/.gitignore`.

Verification:

- Red targeted test failed because init still printed only counts.
- AgentFlight-captured targeted verification now passes:
  `npm test -- tests/commands/workflow.test.ts tests/core/config.test.ts`
  passed: 2 files / 9 tests.
- Final AgentFlight-captured full verification passed: `npm run verify` passed
  with 21 files / 177 tests, plus build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale caution: 160 changed files exceeds the
  preflight threshold of 50, maximum changed-file risk score `207.9`, and no
  concrete blockers.
- `npx projscan@latest review --format json` returned the same
  manual-signoff scale block only: no cycles, risky functions, dependency
  changes, contract changes, taint flows, or dataflow risks.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-04-52-verification-report.md`.
- Built CLI smoke in a temp repo showed fresh init listing
  `.agentflight/config.json` and `.agentflight/.gitignore` under created files,
  and a second init listing the same files under skipped existing files.

### Incomplete Verification Blocks Clean Readiness

Dogfood finding:

- A post-commit status check was run in parallel with
  `agentflight verify -- npm run format:check`. During that live verification,
  status showed `Readiness: Clean worktree` while proof gaps also showed an
  incomplete verification. Rerunning after verification completed was clean, but
  the transient state exposed a readiness-ordering bug.

Persona readout:

- Product Maintainer: clean status must never mask a verification still in
  progress.
- CLI Engineer: keep this in Review Intelligence so status/report/replay agree.
- Verification Engineer: add regression coverage for zero changed files with a
  `verification_started` event and no completed run.
- Security Reviewer: no storage, command execution, or evidence mutation
  changes.

Implemented locally:

- Review Intelligence now evaluates actionable proof gaps before the
  clean-worktree branch.
- Unresolved failed verification remains the highest-priority readiness state.
- Clean-worktree readiness still applies when zero files are changed and no
  failed or incomplete verification remains.

Verification:

- Red targeted test failed because zero changed files plus incomplete
  verification still returned `state: "clean_worktree"`.
- AgentFlight-captured targeted verification now passes:
  `npm test -- tests/core/review-intelligence.test.ts tests/commands/evidence-output.test.ts`
  passed: 2 files / 53 tests.
- `npm run format:check` initially failed on
  `tests/commands/evidence-output.test.ts`; `npm run format` applied the
  mechanical Prettier fix.
- Final AgentFlight-captured full verification passed: `npm run verify` passed
  with 21 files / 176 tests, plus build.
- Final `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale caution: 157 changed files exceeds the
  preflight threshold of 50, maximum changed-file risk score `203.7`, and no
  concrete blockers.
- `npx projscan@latest review --format json` returned the same
  manual-signoff scale block only: no cycles, risky functions, dependency
  changes, contract changes, taint flows, or dataflow risks.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-04-43-verification-report.md`.

### Clean Status Verification Detail Tuck

Dogfood finding:

- After compacting long status verification lists, clean-checkout status still
  showed the latest 8 verification commands even though there were no files left
  to review. The count line was useful; the run details were review noise.

Persona readout:

- Product Maintainer: clean status should feel done and short, while still
  proving that verification exists.
- CLI Engineer: make this a terminal-only branch keyed to clean worktree plus
  no unresolved failed verification.
- Verification Engineer: unresolved failed verification must still print the
  failed command, and JSON must keep all runs.
- Security Reviewer: no evidence mutation, no report/replay changes, and no
  storage shape change.

Implemented locally:

- Clean-worktree status now shows the verification count plus a tucked-details
  line instead of individual run commands when no unresolved failed verification
  remains.
- Dirty-worktree status keeps the recent-run compaction behavior.
- Clean status with unresolved failed verification still prints failed run
  details.

Verification:

- Red targeted test failed because clean status did not print the tucked-details
  line and still exposed individual run details.
- AgentFlight-captured targeted verification now passes:
  `npm test -- tests/commands/evidence-output.test.ts` passed: 1 file / 30
  tests.
- `npm run format:check` failed during the loop on `src/commands/status.ts`
  and later on devlog wrapping; `npm run format` applied the mechanical
  Prettier fixes.
- ProjScan review then flagged `formatVerificationRuns` as a concrete
  risky-function blocker after the new branch. The formatter was split into
  smaller helpers, and the rerun had `0` risky functions.
- Final AgentFlight-captured full verification passed: `npm run verify` passed
  with 21 files / 174 tests, plus build.
- Final `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale caution: 154 changed files exceeds the
  preflight threshold of 50, maximum changed-file risk score `203.7`, and no
  concrete blockers after the formatter refactor.
- `npx projscan@latest review --format json` returned the same
  manual-signoff scale block only after the refactor: no cycles, risky
  functions, dependency changes, contract changes, taint flows, or dataflow
  risks.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-04-34-verification-report.md`.
- Built CLI smoke in a clean temp repo showed the tucked verification-details
  line, while JSON still reported one stored verification run and
  `state: "clean_worktree"`.

### Compact Status Verification Lists

Dogfood finding:

- After several verification and bug-pass commands, `agentflight status` became
  noisy because it printed every verification run even though the count line
  already summarized the ledger. The full report/replay evidence remains useful,
  but status should stay quick to scan.

Persona readout:

- Product Maintainer: status should answer "where am I right now?" without
  overwhelming the user during long sessions.
- CLI Engineer: compact only terminal status; keep JSON and local evidence
  complete for scripts and audit.
- Verification Engineer: add regression coverage proving omitted terminal runs
  are still present in JSON and raw stdout/stderr evidence.
- Security Reviewer: no mutation or deletion of evidence, no upload, and no
  report/replay ledger changes.

Implemented locally:

- Terminal `agentflight status` now shows the latest 8 verification runs when a
  session has a longer run list.
- Status prints an explicit omitted-run note pointing to report/replay and JSON
  for the full ledger.
- Status JSON and stored verification evidence remain complete.

Verification:

- Red targeted test failed because status still printed every verification run
  and had no omitted-run note.
- AgentFlight-captured targeted verification now passes:
  `npm test -- tests/commands/evidence-output.test.ts` passed: 1 file / 29
  tests.
- Final AgentFlight-captured full verification passed: `npm run verify` passed
  with 21 files / 173 tests, plus build.
- `npm run format:check` failed during the loop on `src/commands/status.ts`
  and later on devlog wrapping; `npm run format` applied the mechanical
  Prettier fixes and the final rerun passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale caution: 151 changed files exceeds the
  preflight threshold of 50, maximum changed-file risk score `203.7`, and no
  concrete blockers.
- `npx projscan@latest review --format json` returned the same
  manual-signoff scale block only: no cycles, risky functions, dependency
  changes, contract changes, taint flows, or dataflow risks.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-04-20-verification-report.md`.
- Built CLI smoke on the current long session showed
  `Showing latest 8 of 15 verification runs` and
  `7 earlier verification runs remain in report/replay and JSON output`.

### Clean Worktree Status Readiness

Dogfood finding:

- After committing a completed task, `agentflight status` still showed the
  previous task but reported `Readiness: Unknown` because no changed files were
  detected. That made a clean checkout feel ambiguous instead of done.

Persona readout:

- Product Maintainer: clean status should answer whether there is hidden review
  work, not imply uncertainty after a commit.
- CLI Engineer: keep the change in shared Review Intelligence so status,
  JSON, report, replay, and handoff labels stay consistent.
- Verification Engineer: preserve blocked readiness for unresolved failed
  verification even when the worktree is currently clean.
- Security Reviewer: no file writes, network behavior, export, or session
  storage shape change.

Implemented locally:

- Review Intelligence now has an explicit `clean_worktree` readiness state.
- Zero changed files with no unresolved failed verification reports
  `Clean worktree`.
- Session history metadata parsing now accepts `clean_worktree` so clean
  report/replay artifact readiness remains visible later.

Verification:

- Red targeted test failed because zero changed files still returned
  `state: "unknown"`.
- AgentFlight-captured targeted verification now passes:
  `npm test -- tests/core/review-intelligence.test.ts tests/commands/evidence-output.test.ts tests/core/session.test.ts`
  passed: 3 files / 56 tests.
- Final AgentFlight-captured full verification passed: `npm run verify` passed
  with 21 files / 172 tests, plus build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale caution: 148 changed files exceeds the
  preflight threshold of 50, maximum changed-file risk score `199.1`, and no
  concrete blockers.
- `npx projscan@latest review --format json` returned the same
  manual-signoff scale block only: no cycles, risky functions, dependency
  changes, contract changes, taint flows, or dataflow risks.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-04-07-verification-report.md`.
- Built CLI smoke in a clean temp repo showed status text
  `Readiness: Clean worktree` and JSON readiness
  `state: "clean_worktree"`.

### Init Tool Availability Consistency

Dogfood finding:

- First-run dogfood observed `agentflight init` reporting ProjScan unavailable
  while later `start` and report paths found and used ProjScan. The cause was
  different detection models: init looked for repo marker files, while later
  commands inspected the actual CLIs.

Persona readout:

- Product Maintainer: first-run trust depends on consistent local tool status.
- CLI Engineer: init should use the same concise ToolAdapterResult formatter as
  start/report surfaces.
- Verification Engineer: tests should inject tool results so workflow coverage
  stays deterministic and does not depend on local npx availability.
- Security Reviewer: keep checks local-only and avoid heavy baselines or doctor
  calls on init.

Implemented locally:

- `agentflight init` now inspects ProjScan and AgentLoopKit CLI availability
  when results are not injected.
- Init uses the shared compact tool formatter, so unavailable tools get the
  same concise follow-up guidance as other surfaces.
- AgentLoopKit init inspection skips the heavier doctor call.

Verification:

- Red targeted test failed because init still rendered marker-file availability.
- AgentFlight-captured targeted verification now passes:
  `npm test -- tests/commands/workflow.test.ts tests/core/config.test.ts`
  passed: 2 files / 8 tests.
- Final AgentFlight-captured full verification passed: `npm run verify` passed
  with 21 files / 168 tests, plus build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale caution: 145 changed files exceeds the
  preflight threshold of 50, maximum changed-file risk score `199.1`, and no
  concrete blockers.
- `npx projscan@latest review --format json` returned the same
  manual-signoff scale block only: no cycles, risky functions, dependency
  changes, contract changes, taint flows, or dataflow risks.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-03-55-verification-report.md`.
- Built CLI smoke in a temp repo showed `agentflight init` reporting
  `ProjScan: available 4.9.3` and `AgentLoopKit: available 0.37.0` without
  requiring repo marker files first.

### History Open-First Empty State

Dogfood finding:

- After adding `Open first:` guidance to history, sessions with no generated
  handoff/report/replay artifacts would have shown `Open first: missing`. That
  mirrors artifact path state, but reads like jargon in a command summary.

Persona readout:

- Product Maintainer: empty-state copy should reduce uncertainty, not expose
  implementation labels.
- CLI Engineer: keep the existing artifact path rows as `missing`, but make the
  recommendation line human-readable.
- Docs and DX Writer: no new docs concept is needed for this microcopy fix.

Implemented locally:

- `agentflight history` now prints `Open first: none yet` when no primary
  artifact exists for a session.
- Existing replay/report/handoff guidance remains unchanged when those
  artifacts are available.

Verification:

- Red focused test failed because a no-artifact session did not show
  `Open first: none yet`.
- Adjacent AgentFlight-captured command verification now passes:
  `npm test -- tests/commands/history.test.ts tests/cli-entrypoint.test.ts tests/commands/evidence-output.test.ts`
  passed: 3 files / 37 tests.
- Final AgentFlight-captured full verification passed: `npm run verify` passed
  with 21 files / 167 tests, plus build.
- The exact red focused command was rerun after the adjacent pass so the failed
  history verification was resolved: `npm test -- tests/commands/history.test.ts`
  passed: 1 file / 5 tests.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale caution: 142 changed files, maximum
  changed-file risk score `199.1`, and no concrete blockers.
- `npx projscan@latest review --format json` returned the same manual-signoff
  scale block only: no cycles, risky functions, dependency changes, contract
  changes, taint flows, or dataflow risks.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-03-48-verification-report.md`.
- Built CLI smoke: before generating handoff/report/replay for this session,
  `agentflight history --limit 1` showed `Open first: none yet` with all
  primary artifacts listed as `missing`.

### History Open-First Guidance

Research signal:

- `agentflight history` now points to stable local handoff/report/replay/resume
  artifacts, but users still had to infer which one to open first when scanning
  older sessions.

Persona readout:

- Product Maintainer: history should answer the same "what should I open?"
  question as the handoff command.
- CLI Engineer: keep history read-only and derive guidance from recorded
  readiness plus existing artifact paths.
- Docs and DX Writer: describe the behavior in command docs without adding a
  new workflow concept.
- Security Reviewer: no search index, session switching, export, upload, or PR
  comment behavior.

Implemented locally:

- `agentflight history` now prints `Open first:` for each session.
- Ready sessions prefer `replay` when replay exists.
- Blocked, not-ready, or needs-verification sessions prefer `report` when the
  report exists.
- Sessions without recorded readiness prefer an existing `handoff` artifact.

Verification:

- Red focused test failed because history had no `Open first:` line.
- Focused AgentFlight-captured verification now passes:
  `npm test -- tests/commands/history.test.ts` passed: 1 file / 5 tests.
- Adjacent AgentFlight-captured command verification now passes:
  `npm test -- tests/commands/history.test.ts tests/cli-entrypoint.test.ts tests/commands/evidence-output.test.ts`
  passed: 3 files / 37 tests.
- Final AgentFlight-captured full verification passed: `npm run verify` passed
  with 21 files / 167 tests, plus build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale caution: 139 changed files, maximum
  changed-file risk score `199.1`, and no concrete blockers.
- `npx projscan@latest review --format json` returned the same manual-signoff
  scale block only: no cycles, risky functions, dependency changes, contract
  changes, taint flows, or dataflow risks.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-03-42-verification-report.md`.
- Built CLI smoke: `agentflight history --limit 1` showed
  `Open first: replay` with stable handoff/report/replay/resume paths for the
  current session.

### Concurrent Verification Evidence Collision

Dogfood finding:

- Running two `agentflight verify` commands in parallel exposed an evidence
  integrity bug: both commands could claim the same `verification-N` stdout and
  stderr paths, and one session update could overwrite the other.

Persona readout:

- Product Maintainer: verification evidence is the product's trust anchor, so
  ambiguous or dropped runs must be fixed before more feature work.
- CLI Engineer: keep the terminal output shape and evidence paths familiar,
  but make allocation safe under concurrent local commands.
- Verification Engineer: add a deterministic regression test that forces two
  verification commands to overlap.
- Security Reviewer: keep all locking and reservation state local under
  `.agentflight/`; no daemon, service, upload, or hidden network behavior.

Implemented locally:

- Verification evidence paths now use hidden local claim files so concurrent
  runs reserve distinct `verification-N` stdout/stderr paths.
- Session event and verification-run appends now use a short local file lock and
  reload the persisted session before mutating it, so concurrent appends merge
  instead of overwriting one another.
- Existing sequential verify output remains unchanged.

Verification:

- Red regression passed through AgentFlight as a failure first:
  `npm test -- tests/commands/verify.test.ts` failed because both concurrent
  runs returned the same stdout path.
- Focused AgentFlight-captured verification now passes:
  `npm test -- tests/commands/verify.test.ts` passed: 1 file / 11 tests.
- Broader targeted AgentFlight-captured verification now passes:
  `npm test -- tests/commands/verify.test.ts tests/commands/evidence-output.test.ts`
  passed: 2 files / 38 tests.
- Final AgentFlight-captured full verification passed: `npm run verify` passed
  with 21 files / 166 tests, plus build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale caution: 136 changed files, maximum
  changed-file risk score `199.1`, and no concrete blockers.
- `npx projscan@latest review --format json` returned the same manual-signoff
  scale block only: no cycles, risky functions, dependency changes, contract
  changes, taint flows, or dataflow risks.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-03-33-verification-report.md`.
- Built CLI concurrent smoke ran two parallel `agentflight verify` commands and
  reported distinct paths:
  `verification-11.stdout.txt` / `verification-12.stdout.txt`.
- Stored session evidence contained both parallel smoke commands and preserved
  raw stdout: `parallel smoke one` and `parallel smoke two`.

### History Resume Artifact Discovery

Research signal:

- Resume prompts were still current-only artifacts at
  `.agentflight/current/resume-prompt.md`. Since resume is part of the local
  handoff packet, prior sessions should keep a stable continuation prompt just
  like report, replay, and handoff artifacts.

Persona readout:

- Product Maintainer: the full local review packet should be recoverable from
  history, including the continuation prompt.
- CLI Engineer: preserve the current resume pointer and add a stable
  session-specific copy instead of changing the resume command surface.
- Security Reviewer: keep paths local and repo-relative; no upload, sync, or
  PR comment.
- Docs and DX Writer: describe history as finding handoff/report/replay/resume
  artifacts.

Implemented locally:

- `agentflight resume` now writes both
  `.agentflight/current/resume-prompt.md` and
  `.agentflight/reports/<session-id>-resume.md`.
- `agentflight handoff` now lists the stable resume path plus the current
  resume pointer.
- `agentflight history` now shows a `Resume:` line and reports `missing` when
  no stable resume artifact exists.
- README and changelog copy now describe history as showing
  handoff/report/replay/resume artifact paths.

Verification:

- Red focused tests failed because no session-specific resume was written and
  history had no `Resume:` line.
- AgentFlight-captured focused verification passed:
  `npm test -- tests/commands/evidence-output.test.ts tests/commands/history.test.ts`
  passed: 2 files / 31 tests.
- Final AgentFlight-captured full verification passed: `npm run verify` passed
  with 21 files / 165 tests, plus build.
- `npm run format:check` passed after a narrow Prettier write on
  `tests/commands/evidence-output.test.ts` and `tests/commands/history.test.ts`.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale caution: 132 changed files, maximum
  changed-file risk score `199.1`, and no concrete blockers.
- `npx projscan@latest review --format json` returned the same manual-signoff
  scale block only: no cycles, risky functions, dependency changes, contract
  changes, taint flows, or dataflow risks.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-03-22-verification-report.md`.
- Built CLI smoke: `agentflight handoff` wrote
  `.agentflight/reports/af-20260621-011503-surface-resume-artifacts-in-history-output-resume.md`,
  and `agentflight history --limit 1` listed stable handoff/report/replay/resume
  paths for the current session.

### History Handoff Artifact Discovery

Research signal:

- `agentflight handoff` is now the golden local review packet, but
  `agentflight history` only showed report and replay paths. Engineers looking
  back at a previous session still had to infer where the handoff went, and the
  current handoff pointer is overwritten by later sessions.

Persona readout:

- Product Maintainer: history should point to the handoff packet first because
  it is the review artifact users are meant to share.
- CLI Engineer: preserve `.agentflight/current/handoff.md` as a current-session
  pointer and add a stable session-specific artifact rather than changing
  history into a generator or switcher.
- Security Reviewer: keep everything local and repo-relative; no upload, sync,
  or PR comment.
- Docs and DX Writer: describe history as finding handoff/report/replay
  artifacts, not just report/replay.

Implemented locally:

- `agentflight handoff` now writes both `.agentflight/current/handoff.md` and
  `.agentflight/reports/<session-id>-handoff.md`.
- The handoff artifact list shows the stable handoff path plus the current
  pointer.
- `agentflight history` now shows a `Handoff:` line before report/replay paths
  and reports `missing` when no session-specific handoff exists.
- README and changelog copy now describe history as showing
  handoff/report/replay artifact paths.

Verification so far:

- Red focused tests failed because no session-specific handoff was written and
  history had no `Handoff:` line.
- AgentFlight-captured focused verification passed:
  `npm test -- tests/commands/evidence-output.test.ts tests/commands/history.test.ts`
  passed: 2 files / 31 tests.
- Final AgentFlight-captured full verification passed: `npm run verify` passed
  with 21 files / 165 tests, plus build.
- `npm run format:check` passed after a narrow Prettier write on
  `tests/commands/evidence-output.test.ts`.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale caution: 129 changed files, maximum
  changed-file risk score `199.1`, and no concrete blockers.
- `npx projscan@latest review --format json` returned the same manual-signoff
  scale block only: no cycles, risky functions, dependency changes, contract
  changes, taint flows, or dataflow risks.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-03-10-verification-report.md`.
- Built CLI smoke: `agentflight handoff` wrote
  `.agentflight/reports/af-20260621-010404-surface-handoff-artifacts-in-history-output-handoff.md`,
  and `agentflight history --limit 1` listed that path.

### History Resolved Failure Wording

Dogfood finding:

- `agentflight history` still listed total failed verification counts for ready
  sessions. After the status/resume fixes, that made the session list look more
  alarming than the actual unresolved proof state.

Persona readout:

- Product Maintainer: history should help engineers pick the right artifact
  without making resolved red/green work look currently blocked.
- CLI Engineer: keep history read-only, local, and text-first; reuse shared
  count formatting.
- Verification Engineer: derive unresolved/resolved counts from stored runs
  without mutating session JSON.
- Repo Steward: avoid adding a dependency cycle between session loading and
  verification summaries.

Implemented locally:

- Added dependency-free verification-run helpers for command parsing,
  normalization, and unresolved failed-run detection.
- Re-exported those helpers from `src/core/verification.ts` so existing imports
  remain compatible.
- Session summaries now carry unresolved and resolved failed-run counts.
- `agentflight history` now formats verification counts with the shared
  unresolved/resolved count helper.
- Bug pass: split the extracted command parser into small state helpers after
  ProjScan flagged the newly added parser as high complexity.

Verification so far:

- Red history regression failed because resolved historical failures still
  rendered without unresolved/resolved context.
- AgentFlight-captured focused verification passed:
  `npm test -- tests/commands/history.test.ts tests/core/verification.test.ts`
  passed: 2 files / 16 tests.
- Final AgentFlight-captured full verification passed: `npm run verify` passed
  with 21 files / 165 tests, plus build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- Initial ProjScan preflight flagged one new high-complexity parser function;
  the parser was split and rerun.
- `npx projscan@latest preflight --mode before_commit --format json` then
  returned only the existing accumulated branch-scale caution: 126 changed
  files, maximum changed-file risk score `199.1`, and no concrete blockers.
- `npx projscan@latest review --format json` returned the same manual-signoff
  scale block only: no cycles, risky functions, dependency changes, contract
  changes, taint flows, or dataflow risks.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-02-59-verification-report.md`.
- Built CLI smoke: `agentflight history --limit 1` showed the current session as
  ready with report/replay paths and resolved-failure context:
  `16 passed, 1 failed (0 unresolved, 1 resolved)`.

### Resume Resolved Failure Wording

Dogfood finding:

- After the replay resolved-failure tone fix, `agentflight resume` still showed
  total failed verification counts beside `Ready for review`. That made a
  continuation prompt look more blocked than status/report/replay/handoff.

Persona readout:

- Product Maintainer: continuation prompts should match the current review
  state, not just the raw historical ledger.
- CLI Engineer: reuse the shared verification count formatter rather than
  introducing resume-only wording.
- Verification Engineer: keep raw verification runs and failure excerpts intact.
- Docs and DX Writer: keep the prompt compact; the count line is enough.

Implemented locally:

- `agentflight resume` now formats verification counts with the shared
  unresolved/resolved helper.
- The resume renderer input shape and captured verification evidence remain
  unchanged.

Verification so far:

- Red command regression failed because a resolved historical failure still
  rendered as `1 passed, 1 failed`.
- AgentFlight-captured focused verification passed:
  `npm test -- tests/commands/evidence-output.test.ts tests/core/verification.test.ts`
  passed: 2 files / 39 tests.
- Final AgentFlight-captured full verification passed: `npm run verify` passed
  with 21 files / 165 tests, plus build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale caution: 122 changed files, maximum
  changed-file risk score `199.1`, and no concrete blockers.
- `npx projscan@latest review --format json` returned the same manual-signoff
  scale block only: no cycles, risky functions, dependency changes, contract
  changes, taint flows, or dataflow risks.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-02-46-verification-report.md`.
- Built CLI smoke: `agentflight resume` on this dogfood session showed
  `8 passed, 1 failed (0 unresolved, 1 resolved)`.

### Replay Resolved Failure Tone

Research signal:

- After unresolved/resolved verification counts landed, HTML replay still showed
  urgent failed-run navigation whenever any historical failed run existed. That
  kept the evidence discoverable, but made ready sessions feel more blocked than
  the Review Intelligence verdict indicated.

Persona readout:

- Product Maintainer: historical failures should stay visible as trust-building
  evidence, not as current blockers.
- CLI Engineer: use the already-computed verification summary; do not mutate or
  rewrite stored verification evidence.
- Verification Engineer: keep unresolved-failure replay behavior unchanged.
- Docs and DX Writer: keep the label burden low; the summary already says
  unresolved versus historical.

Implemented locally:

- HTML replay now shows urgent failed-run jump links only when the verification
  summary reports unresolved failed runs.
- Historical failed verification runs remain anchored and visible in the replay
  ledger with their stored excerpts.

Verification so far:

- Red replay regression failed because resolved historical failures still
  emitted urgent failed-run navigation.
- AgentFlight-captured focused verification passed:
  `npm test -- tests/renderers/html-replay.test.ts` passed: 1 file / 7 tests.
- AgentFlight-captured focused verification passed:
  `npm test -- tests/renderers/html-replay.test.ts tests/commands/evidence-output.test.ts`
  passed: 2 files / 34 tests.
- Built CLI smoke: `agentflight replay` on this dogfood session showed
  `3 passed / 0 unresolved failed / 1 historical failed`, kept the failed
  ledger entry, and emitted no actual urgent failed-run anchor.
- Final AgentFlight-captured full verification passed: `npm run verify` passed
  with 21 files / 165 tests, plus build.
- `npm run format:check` passed after a narrow Prettier write on
  `src/renderers/html-replay.ts`.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale caution: 119 changed files, maximum
  changed-file risk score `199.1`, and no concrete blockers.
- `npx projscan@latest review --format json` returned the same manual-signoff
  scale block only: no cycles, risky functions, dependency changes, contract
  changes, taint flows, or dataflow risks.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-02-38-verification-report.md`.

### Unresolved Verification Failure Clarity

Research signal:

- The previous history-readiness dogfood loop fixed readiness blocking for
  resolved failures, but status/history/handoff could still show total failed
  run counts beside `Ready for review`. That was technically accurate ledger
  data, but not clear enough about what still needed action.

Persona readout:

- Product Maintainer: resolved failures should stay visible as evidence, but
  the product must make the current review state obvious.
- CLI Engineer: use exact stored command matching; do not rewrite captured
  verification runs.
- Verification Engineer: same-command later passes should resolve prior failed
  runs; a later failure after a pass must remain unresolved.
- Docs and DX Writer: keep the copy short: unresolved means action, historical
  means ledger evidence.
- Security Reviewer: keep all evidence local and preserve failure excerpts in
  report/replay.

Implemented locally:

- `buildVerificationSummary()` now exposes `unresolvedFailed`,
  `resolvedFailed`, and `unresolvedFailedRuns`.
- Review Intelligence now reuses the shared unresolved-failure helper.
- Status, Markdown report, HTML replay, and handoff output now distinguish
  unresolved failed verification from historical failed runs that later passed.
- Ready handoffs keep historical failed excerpts in report/replay instead of
  inlining them as current blockers.

Verification so far:

- Red core verification summary tests failed because resolved/unresolved fields
  did not exist and readiness still treated any failed run as blocked.
- AgentFlight-captured focused verification passed:
  `npm test -- tests/core/verification.test.ts tests/core/review-intelligence.test.ts`
  passed: 2 files / 31 tests.
- Red command-surface test failed because status/report/replay/handoff did not
  show resolved/unresolved failure copy.
- AgentFlight-captured focused verification passed:
  `npm test -- tests/core/verification.test.ts tests/core/review-intelligence.test.ts tests/commands/evidence-output.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts`
  passed: 5 files / 71 tests.
- Built CLI smoke: after rerunning the exact failed commands, `agentflight status`
  showed `5 passed, 2 failed (0 unresolved, 2 resolved)`, report/replay kept the
  historical excerpts, and `agentflight handoff` exited `0` with no proof gaps.
- Final AgentFlight-captured full verification passed: `npm run verify` passed
  with 21 files / 164 tests, plus build.
- `npm run format:check` passed after Prettier normalized touched TypeScript
  files.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale manual signoff caution: 116 changed
  files against `origin/main`, maximum changed-file risk score `194.1`, and no
  concrete blockers.
- `npx projscan@latest review --format json` returned the same scale/manual
  signoff block only: no cycles, risky functions, dependency changes, contract
  changes, taint flows, or dataflow risks.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-02-26-verification-report.md`.

### History Readiness Recording

Research signal:

- After adding `agentflight history`, engineers could find prior local sessions
  and artifacts, but still had to open a report or replay to know whether the
  last generated review artifact said the work was ready, blocked, or missing
  proof.

Persona readout:

- Product Maintainer: history should help users pick the right artifact to open
  without becoming search, analytics, export, or cloud sync.
- CLI Engineer: record the readiness at artifact-generation time instead of
  recalculating old sessions from the current workspace.
- Verification Engineer: malformed historical metadata must not crash history.
- Security Reviewer: keep the summary local in existing session JSON; do not
  upload source, evidence, or telemetry.
- Repo Steward: use a small shared helper and avoid another local index file.

Implemented locally:

- Report and replay generation now store compact readiness metadata in their
  existing session events: state, label, risk level, changed-file count,
  verification pass/fail counts, and artifact path.
- `agentflight history` now shows the latest recorded readiness when present.
- Older sessions without recorded readiness show `Readiness: not recorded`.
- Malformed readiness metadata is ignored rather than making history fail.
- Bug pass: Review Intelligence now treats earlier failed verification as
  resolved when the same command later passes, preventing TDD red/green or
  format-fix loops from leaving a session permanently blocked.
- Bug pass: ready handoffs now keep historical failed verification excerpts in
  report/replay instead of inlining them as current action items.

Verification so far:

- Red focused verification failed because `latestReview` was undefined in
  session summaries.
- AgentFlight-captured focused verification passed:
  `npm test -- tests/core/session.test.ts tests/commands/history.test.ts tests/commands/evidence-output.test.ts`
  passed: 3 files / 36 tests.
- Red Review Intelligence regression failed because `failed-verification` was
  still emitted after a later pass of the same command.
- AgentFlight-captured Review Intelligence regression passed:
  `npm test -- tests/core/review-intelligence.test.ts` passed: 1 file / 19
  tests.
- Red handoff regression failed because a ready handoff still inlined historical
  failed excerpts.
- AgentFlight-captured handoff regression passed:
  `npm test -- tests/commands/evidence-output.test.ts` passed: 1 file / 27
  tests.
- Combined focused verification passed:
  `npm test -- tests/core/session.test.ts tests/commands/history.test.ts tests/commands/evidence-output.test.ts tests/core/review-intelligence.test.ts`
  passed: 4 files / 56 tests.
- Built CLI smoke:
  `agentflight history --limit 1` showed `Readiness: Ready for review`; `agentflight handoff`
  exited `0` and kept historical failed excerpts in report/replay.
- Final AgentFlight-captured full verification passed: `npm run verify` passed
  with 21 files / 162 tests, plus build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale manual signoff caution: 111 changed
  files against `origin/main`, maximum changed-file risk score `189.4`, and no
  concrete blockers.
- `npx projscan@latest review --format json` returned the same scale/manual
  signoff block only: no cycles, risky functions, dependency changes, contract
  changes, taint flows, or dataflow risks.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-02-12-verification-report.md`.

### History Limit Handling

Dogfood finding:

- After adding `agentflight history`, invalid limits were still too permissive:
  `--limit nope` fell back to the default and `--limit 0` produced an empty
  history. CLI flags should fail loudly when the request is invalid.

Implemented locally:

- `agentflight history --limit` now accepts only positive integers.
- Non-integer, zero, negative, and fractional limits throw
  `History limit must be a positive integer.`

Verification:

- Red test failed because invalid limits still resolved successfully.
- `npm test -- tests/commands/history.test.ts tests/cli-entrypoint.test.ts`
  passed: 2 files / 9 tests.
- `npm run typecheck` passed.
- `npm run build` passed.
- Built CLI bug pass: `agentflight history --limit nope` exited `1` with the
  expected error, while `agentflight history --limit 1` exited `0` and listed
  the current session.
- AgentFlight-captured focused verification passed:
  `npm test -- tests/commands/history.test.ts tests/cli-entrypoint.test.ts`
  passed: 2 files / 9 tests.
- AgentFlight-captured full verification passed: `npm run verify` passed with
  21 files / 157 tests, plus typecheck, lint, and build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale manual signoff caution: 108 changed
  files against `origin/main`, maximum changed-file risk score `188.6`, and no
  concrete blockers.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-01-53-verification-report.md`.

### Local Session History

Research signal:

- After repeated dogfood loops, AgentFlight had useful local report/replay
  artifacts but no simple way to list recent sessions. Real engineers should
  not need to remember generated filenames or inspect `.agentflight/sessions/`
  directly to find the prior proof trail.

Persona readout:

- Product Maintainer: local session discovery supports the handoff ladder
  without becoming search, export, PR comments, or cloud sync.
- CLI Engineer: keep this as a read-only command with text output and no hidden
  session switching.
- Verification Engineer: malformed session files should not crash the command.
- Security Reviewer: artifact paths must stay repo-relative and local-only.
- Repo Steward: do not add indexing files or mutate historical session JSON.

Implemented locally:

- Added `agentflight history` to list recent local sessions newest first.
- History output shows the current-session marker, task, branch, verification
  pass/fail counts, and existing local report/replay paths.
- Malformed session files are counted and skipped rather than crashing output.
- The command does not generate artifacts, switch sessions, upload data, or
  write an index.

Verification so far:

- Red core test failed because `listSessionSummaries` did not exist.
- Added `listSessionSummaries` in `src/core/session.ts`; green result:
  `npm test -- tests/core/session.test.ts` passed: 1 file / 4 tests.
- Red command test failed because `src/commands/history.ts` did not exist.
- Added `runHistoryCommand`; after fixing an un-awaited formatter bug,
  `npm test -- tests/commands/history.test.ts` passed: 1 file / 3 tests.
- CLI wiring red test failed until `history` was registered in `src/cli.ts`;
  focused result passed: 3 files / 12 tests.
- Bug pass: built CLI `agentflight history --limit 3` in this repo listed the
  current session, recent report/replay artifacts, and missing artifacts using
  repo-relative paths.
- Bug pass: temp Git smoke created two sessions, corrupted one archived session
  JSON file, and `agentflight history --limit 5` still completed while reporting
  `Skipped: 1 malformed session file.`
- ProjScan initially flagged `src/core/session.ts:listSessionSummaries` as a new
  high-complexity function. The helper was split into directory-read,
  per-session-load, sorting, and limit-normalization helpers; the follow-up
  `projscan review --format json` reported no risky functions.
- AgentFlight-captured focused verification passed:
  `npm test -- tests/core/session.test.ts tests/commands/history.test.ts tests/cli-entrypoint.test.ts`
  passed: 3 files / 12 tests.
- AgentFlight-captured full verification passed: `npm run verify` passed with
  21 files / 156 tests, plus typecheck, lint, and build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0` and included
  `dist/commands/history.js`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  the existing accumulated branch-scale manual signoff caution: 106 changed
  files against `origin/main`, maximum changed-file risk score `188.6`, and no
  concrete blockers.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-01-47-verification-report.md`.

### First-Run Runtime Git Noise

Dogfood finding:

- First-run workspace hygiene remains a major trust signal. `agentflight init`
  already filters runtime evidence from AgentFlight review analysis, but it also
  created `.gitkeep` files in runtime directories, which could still add Git
  status noise in fresh repos.

Persona readout:

- Product Maintainer: first-run trials should make the useful project config
  visible without making generated runtime directories feel like review work.
- CLI Engineer: keep the behavior local and deterministic; do not mutate the
  project root `.gitignore`.
- Repo Steward: avoid creating trackable placeholder files for runtime evidence
  directories.
- Security Reviewer: `.agentflight/config.json` must remain visible because it
  can affect local verification and filtering behavior.

Implemented locally:

- `agentflight init` now writes `.agentflight/.gitignore` with runtime directory
  rules for `sessions/`, `reports/`, `evidence/`, and `current/`.
- Fresh init no longer creates runtime `.gitkeep` files.
- `.agentflight/config.json` remains visible project config.
- `.projscan-memory/**` remains suggestion-only guidance, not a built-in ignore.

Verification:

- Added config regression coverage for `.agentflight/.gitignore`, preserved
  existing config files, and absent runtime `.gitkeep` files.
- Updated workflow coverage for the new first-run init copy.
- `npm test -- tests/core/config.test.ts tests/commands/workflow.test.ts tests/core/changed-files.test.ts`
  passed: 3 files / 13 tests.
- After a stale `.gitkeep` expectation was found in command-output tests,
  updated the affected invalid-report-mode assertion and reran focused coverage:
  4 files / 38 tests passed.
- `npm run verify` passed: 20 files / 149 tests, plus typecheck, lint, and
  build.
- `npm run format:check` passed.
- Built-CLI temp Git smoke passed: fresh `agentflight init` created
  `.agentflight/.gitignore` and `.agentflight/config.json` without runtime
  `.gitkeep` files.
- Added risk/review coverage so `.agentflight/.gitignore` is classified as
  AgentFlight project config rather than unknown code.
- Expanded focused AgentFlight proof passed: 6 files / 75 tests.
- Final `npm run verify` passed: 20 files / 151 tests, plus typecheck, lint,
  and build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx projscan@latest doctor --format json` passed with health `100/A`.
- `npx projscan@latest preflight --mode before_commit --format json` returned
  a manual scale caution: 98 changed files against `origin/main`, maximum
  changed-file risk score `188.6`, and no concrete blockers.
- `npx projscan@latest review --format json` returned the matching
  release-scale block signal only: no cycles, risky functions, dependency
  changes, contract changes, taint flows, or dataflow risks.
- `npx agentloopkit@latest verify` passed and wrote
  `.agentloop/reports/2026-06-21-01-31-verification-report.md`.

Bug pass:

- Running `status`, `report`, `replay`, `resume`, and `handoff` concurrently
  exposed a real AgentFlight race: `replay` could fail with
  `Unexpected end of JSON input` while another command was overwriting
  `.agentflight/current/session.json`.
- Root cause: `writeJsonFileSafe(..., { overwrite: true })` used direct
  `writeFile`, so readers could observe a truncated JSON file during an
  overwrite.
- Added a regression test that repeatedly overwrites a JSON file while another
  loop parses it.
- Red result: `npm test -- tests/core/fs-safe.test.ts` failed with partial JSON
  parse errors, including `Unexpected end of JSON input`.
- Fix: `writeTextFileSafe` now writes to a same-directory temporary file and
  atomically renames it into place.
- Green result: `npm test -- tests/core/fs-safe.test.ts` passed: 1 file / 4
  tests.
- Built CLI concurrent artifact smoke passed: `status`, `report`, `replay`,
  `resume`, and `handoff` all completed without JSON parse failures.

### Compact Text Evidence Commands

Dogfood finding:

- After replay ledger commands were compacted, `agentflight status` still showed
  a full long passing verification command in the evidence list. That kept the
  terminal status dense and noisy for a run that was otherwise ready for review.

Persona readout:

- Product Maintainer: status and report should stay fast to scan because they
  are the first artifacts developers read before deciding what to open.
- CLI Engineer: compact display must not mutate `verificationRuns[].command` or
  stdout/stderr evidence paths.
- Docs and DX Writer: short commands should remain unchanged; only genuinely
  long evidence labels should collapse.
- Security Reviewer: this must remain local display formatting, not hidden
  evidence rewriting.

Implemented locally:

- Status verification evidence rows now use the shared compact command display
  helper for long run commands.
- Markdown report verification evidence rows use the same compact display helper
  for long run commands.
- Stored verification run commands and raw evidence files remain unchanged.

Verification:

- Added command/output regression coverage for compact status evidence labels,
  unchanged stored commands, and preserved stdout evidence.
- Added Markdown renderer coverage for compact verification evidence labels.
- `npm test -- tests/commands/evidence-output.test.ts tests/renderers/markdown-report.test.ts`
  passed: 2 files / 32 tests.
- Adjacent bug pass with evidence output, Markdown report, HTML replay, and
  Review Intelligence tests passed: 4 files / 56 tests.
- `npm run verify` passed: 20 files / 149 tests, plus typecheck, lint, and
  build.
- `npm run format:check` passed after formatting the new Markdown report test.
- AgentFlight captured `npm run verify` as passing evidence for this session.
- Dogfooded harmless long passing `agentflight verify` commands and regenerated
  status/report: the genuinely long verification command rendered compactly in
  both text surfaces while evidence paths remained visible.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found 0 vulnerabilities.
- `npx projscan@latest doctor --format json` passed with score 100/A.
- ProjScan preflight/review kept the existing accumulated branch-scale manual
  signoff caution: 90 changed files and max changed-file risk score 188.6, with
  no concrete cycle, risky-function, dependency, contract, taint, or dataflow
  blockers reported.
- `npx agentloopkit@latest verify` passed.

### Compact Replay Ledger Commands

Persona readout:

- Product Maintainer: replay should stay the best artifact to open after proof
  passes, so dense ledger rows should not be dominated by command noise.
- CLI Engineer: display compaction should not mutate captured verification
  command evidence.
- Security Reviewer: HTML title and visible command text must remain escaped.
- Docs and DX Writer: reviewers still need a way to inspect the full command
  when the visible label is shortened.

Implemented locally:

- HTML replay verification ledger rows now use the shared compact command
  display helper for long run commands.
- The full command remains available in the `title` attribute when the visible
  command is shortened.
- Stored verification run data and raw stdout/stderr evidence are unchanged.

Verification:

- Added a renderer regression test for compact visible ledger commands, full
  title text, and HTML escaping.
- `npm test -- tests/renderers/html-replay.test.ts` passed: 1 file / 6 tests.
- Dogfooded a harmless long passing `agentflight verify` command and regenerated
  replay: the long ledger command rendered compactly, the full command was
  escaped in `title`, and the passing stderr excerpt stayed tucked in details.
- Adjacent bug pass with HTML replay, Markdown report, evidence output, and
  Review Intelligence tests passed: 4 files / 54 tests.
- `npm run verify` passed: 20 files / 147 tests, plus typecheck, lint, and
  build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found 0 vulnerabilities.
- `npx projscan@latest doctor --format json` passed with score 100/A.
- ProjScan preflight/review kept the existing accumulated branch-scale manual
  signoff caution: 86 changed files and max changed-file risk score 188.6, with
  no concrete cycle, risky-function, dependency, contract, taint, or dataflow
  blockers reported.
- `npx agentloopkit@latest verify` passed.

## 2026-06-20

### Centralized Proof-Gap Rules

Maintainability finding:

- Review Intelligence proof-gap rules were repeated inline in
  `buildProofGaps`, making future command-preference changes easy to misorder.

Implemented locally:

- Moved category proof-gap rules into one ordered `categoryProofGapRules` table.
- Kept readiness, scoring, proof-gap IDs, messages, and command preferences
  unchanged.

Verification:

- `npm test -- tests/core/review-intelligence.test.ts` passed: 1 file / 18
  tests.

### Proof Command Preference

Dogfood finding:

- When source and test files changed together, the first handoff action could
  suggest `npm run typecheck` even though `npm test` would clear more review
  uncertainty.

Implemented locally:

- Review Intelligence now honors the proof-kind preference order defined by
  each proof-gap rule when choosing a suggested command.
- Source proof gaps prefer `test`, then `typecheck`, then `build`.
- Dependency proof gaps now prefer install/build-style proof before typecheck
  when those commands are configured.

Verification:

- `npm test -- tests/core/review-intelligence.test.ts tests/commands/evidence-output.test.ts`
  passed: 2 files / 42 tests.

### Handoff No-Verification Copy

Dogfood finding:

- A handoff with zero verification runs said `No failed verification excerpts
recorded`, which is technically true but hides the actual missing-proof
  state.

Implemented locally:

- Handoff verification details now show `No verification runs recorded.` when
  no verification has run.
- Passing handoffs with verification evidence still show that no failed
  excerpts were recorded.
- Failed handoffs still show stderr-preferred excerpts.

Verification:

- `npm test -- tests/commands/evidence-output.test.ts` passed: 1 file / 23
  tests.

### Repo-Relative Artifact Path Output

Persona readout:

- Security Reviewer: shareable handoff text should avoid leaking local usernames
  or workspace folder names.
- Docs and DX Writer: repo-relative `.agentflight/...` paths are easier to read
  and copy.
- CLI Engineer: command return values should stay absolute for callers that
  open the generated files programmatically.

Implemented locally:

- Start, report, replay, and handoff terminal output now display generated
  `.agentflight/...` artifact paths relative to the repository.
- Command result fields still return the absolute file paths used by local tests
  and programmatic callers.

Verification:

- `npm test -- tests/commands/workflow.test.ts tests/commands/evidence-output.test.ts`
  passed: 2 files / 27 tests.

### Handoff Missing-Proof Gate

Persona readout:

- Product Maintainer: the local handoff should not sound share-ready when
  Review Intelligence says proof is missing.
- CLI Engineer: the handoff exit code should be a trustworthy local readiness
  gate for scripts.
- Docs and DX Writer: missing-proof handoffs should point to the report first,
  not the replay, because the report is the fastest fix list.
- Security Reviewer: keep the command local-only and avoid automatic posting or
  hidden upload behavior.

Implemented locally:

- `agentflight handoff` now treats any non-ready Review Intelligence state as a
  non-zero handoff result.
- Missing-proof handoffs use `Fix before sharing`, retain the suggested
  `agentflight verify -- ...` command, and point users to the report first.
- Ready handoffs still exit `0` and open replay first. Failed verification
  handoffs still show stderr-preferred excerpts and open report first.

Verification:

- `npm test -- tests/commands/evidence-output.test.ts` passed: 1 file / 23
  tests.

### AgentLoopKit Linked-State Polish

Dogfood finding:

- After `agentflight start` stopped creating AgentLoopKit task contracts
  automatically, the terminal and report tooling rows still showed only
  AgentLoopKit availability. That hid whether an active task was actually
  linked.
- One stale diagnostic path still used task-creation wording, which no longer
  matches the product behavior.

Implemented locally:

- Shared tooling output now shows concise AgentLoopKit task state when known:
  `active task linked` or `no active task linked`.
- AgentLoopKit task-link diagnostics now use generic link-check wording instead
  of stale automatic task-creation wording.

Verification:

- `npm test -- tests/commands/workflow.test.ts tests/renderers/markdown-report.test.ts`
  passed: 2 files / 10 tests.

### Local Handoff Research And Worktree Cleanup

Research synthesis:

- Persona review found that AgentFlight's next usefulness gap was not another
  distribution surface. It was a single local end-of-session handoff loop.
- First-time developers need one command that tells them what to do after
  verification.
- Reviewers need a clear "open this first" artifact pointer rather than a list
  of unrelated outputs.
- Security and release personas require the workflow to stay local-only, with no
  hidden network calls, telemetry, cloud upload, or automatic PR posting.

Implemented locally:

- Added `agentflight handoff` as a local-only command that composes existing
  status, report, replay, and resume behavior.
- The handoff summary writes `.agentflight/current/handoff.md`, points to the
  generated report/replay/resume artifacts, and shows readiness, changed-file
  count, risk, review focus, proof gaps, and failed verification excerpts.
- Blocked handoffs exit non-zero when failed verification blocks review.
- Raw stdout/stderr evidence remains preserved.

Verification:

- `npm test -- tests/commands/evidence-output.test.ts tests/commands/workflow.test.ts`
  passed: 2 files / 22 tests.
- `npm run verify` passed: typecheck, lint, 19 test files / 123 tests, build.
- `npm run format:check` passed.
- Local built-CLI smoke passed for blocked handoff behavior.
- `npx --yes projscan@latest doctor --format json` passed with score `100` and
  grade `A`.
- `npx --yes projscan@latest review --format json` reported no concrete
  blockers: no cycles, risky functions, dependency changes, contract changes,
  taint flows, or dataflow risks. The remaining ProjScan result was a manual
  scale/risk caution caused by dirty local evidence and high-scoring touched
  modules.

## 2026-06-19

### v0.6.0 Local Review Ergonomics Release Pass

Release decision:

- The post-v0.5.1 work is a minor release, not a patch.
- New user-facing surfaces include replay navigation, named verification
  profiles, JSON status, compact report mode, local PR-comment draft mode,
  ProjScan review-hint enrichment hooks, and AgentLoopKit evidence filtering.
- The release remains local-first: no cloud, login, billing, telemetry, hosted
  services, source upload, GitHub App, or automatic PR posting.

Implemented since v0.5.1:

- Improved replay navigation and review ergonomics for long evidence ledgers.
- Added first-run workspace hygiene guidance for `.agentflight/` runtime paths.
- Updated product positioning to "local-first review layer for AI coding
  sessions."
- Added optional ProjScan review hints to Review Intelligence without making
  Review Intelligence invoke ProjScan.
- Added config-defined verification profiles for repeated local command groups.
- Added compact Markdown report mode.
- Added local PR-comment draft report mode; it writes a local artifact only.
- Added `agentflight status --format json`.
- Filtered local AgentLoopKit evidence paths from AgentFlight changed-file
  surfaces while keeping task contracts, policies, harness files, and gates
  visible.
- Refactored verification/profile handling and ProjScan hint normalization into
  smaller helpers after ProjScan flagged high-complexity functions.

Release verification plan:

```bash
npm test -- tests/commands/verify.test.ts tests/commands/evidence-output.test.ts tests/core/review-intelligence.test.ts
npm run verify
npm run format:check
npm pack --dry-run
npm audit --audit-level=moderate
npx --yes projscan@latest doctor --format json
npx --yes projscan@latest preflight --mode before_commit --format json
npx --yes projscan@latest review --format json
npx --yes agentloopkit@latest verify
```

Manual sign-off expectation:

- ProjScan is expected to return a scale/release-signoff caution because the
  accumulated v0.6.0 handoff is large.
- The release should not proceed if ProjScan reports concrete blockers such as
  dependency changes, contract changes, risky functions, cycles, taint flows, or
  dataflow risks.

Pre-release verification results:

- `npm test -- tests/commands/verify.test.ts tests/commands/evidence-output.test.ts tests/core/review-intelligence.test.ts`
  passed: 3 files / 43 tests.
- `npm run verify` passed: typecheck, lint, 19 test files / 121 tests, build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.6.0`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx --yes agentloopkit@latest verify` passed.
- `npx --yes projscan@latest doctor --format json` passed with score `100` and
  grade `A`.
- `npx --yes projscan@latest preflight --mode before_commit --format json`
  returned `caution`: `111` changed files exceeded the threshold of `50`, and
  maximum changed-file risk score was `172.7`.
- `npx --yes projscan@latest review --format json` reported no risky functions,
  no new cycles, no dependency changes, no contract changes, no new taint flows,
  and no new dataflow risks.
- Manual sign-off accepted the ProjScan result as a release-scale caution, not
  a concrete blocker.

## 2026-06-17

### v0.5.1 Dogfood Patch Candidate

Scope:

- Keep v0.5.1 focused on v0.5.0 dogfood findings.
- Do not start v0.6.0.
- Do not bump version, commit, push, tag, publish, or release.

Implemented patch candidate:

- Changed inline `agentflight verify` output to print the stored
  stderr-preferred output excerpt instead of rereading and printing stdout.
- Kept raw stdout and stderr evidence files unchanged.
- Added compact display helpers for long suggested proof commands in status,
  Markdown reports, HTML replays, and resume prompts.
- Kept full long suggested proof commands locally available in HTML replay
  `title` attributes while keeping visible review rows compact.
- Reduced noisy AgentLoopKit Tooling lines in Markdown reports to concise status
  messages when AgentLoopKit is unavailable or doctor reports local issues.
- Preserved `.projscan-memory/**` as suggestion-only guidance, not a built-in
  ignored path.
- Removed untracked dogfood artifacts from the sibling `fifa-predictor` repo:
  `.agentflight/` and `.projscan-memory/`.

TDD evidence:

```bash
npm test -- tests/commands/verify.test.ts
npm test -- tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts
```

Results:

- Initial terminal excerpt regression failed because `runVerifyCommand` printed
  saved stdout instead of `VerificationRun.outputExcerpt`.
- Initial report/replay compact-command tests failed because long commands were
  rendered in full.
- Initial AgentLoopKit Tooling test failed because report output embedded full
  doctor diagnostics.
- After the patch, the targeted command and renderer tests passed.

### v0.5.1 Release Audit Pass

Release scope:

- Bump package metadata from `0.5.0` to `0.5.1`.
- Document manual ProjScan sign-off for the scale/review caution.
- Commit, push, tag, and rely on Trusted Publishing for npm release.
- Do not add product features or start v0.6.0.

Audit evidence:

- `node dist/cli.js --version` reported `0.5.1` after the version bump and
  build.
- `docs/development/v0.5.1-release-audit.md` records the ProjScan caution:
  maximum changed-file risk score `165.3 >= 80`.
- The caution was accepted as a manual release sign-off because ProjScan
  reported no concrete blockers, dependency changes, contract changes, taint or
  dataflow risks, risky functions, or cycles.
- Local packed-package smoke testing confirmed stderr-preferred failure
  excerpts in terminal, report, and replay output while preserving raw evidence.

## 2026-06-13

### Repository Baseline

- Repository started as a fresh GitHub repo on `main`.
- Initial files: `README.md`, `LICENSE`.
- Existing license file is Apache License 2.0.

### ProjScan And AgentLoopKit Discovery

Commands run:

```bash
npm view projscan version
npm view agentloopkit version
npm view projscan bin
npm view agentloopkit bin
npx projscan@latest --help
npx agentloopkit@latest --help
npx projscan@latest --version
npx agentloopkit@latest --version
```

Discovered versions:

- ProjScan: `4.3.1`
- AgentLoopKit: `0.28.7`

Discovered binaries:

- ProjScan: `projscan`
- AgentLoopKit: `agentloopkit`, `agentloop`

### Required Tool Installation

Command run:

```bash
npm install -D projscan@latest agentloopkit@latest
```

Result:

- Installed ProjScan `^4.3.1`.
- Installed AgentLoopKit `^0.28.7`.
- `npm audit` reported `0 vulnerabilities`.
- npm emitted `allow-scripts` review warnings for tree-sitter packages and esbuild. No package scripts were manually approved during this setup.

### ProjScan Initialization And Baseline

Commands run:

```bash
npx projscan@latest init
npx projscan@latest start --intent "Build AgentFlight, a local-first flight recorder for AI coding agents"
npx projscan@latest coordinate --format json
npx projscan@latest preflight --mode before_edit --format json
npx projscan@latest privacy-check --offline
```

Results:

- `projscan init` created `.projscanrc.json`.
- Initial `projscan start` reported health `68/100`, expected for a new package with missing README/config.
- `projscan coordinate --format json` reported readiness `clear` and only one worktree.
- `projscan preflight --mode before_edit --format json` returned verdict `proceed`.
- `projscan privacy-check --offline` confirmed telemetry disabled and offline mode enabled for that run.

### AgentLoopKit Initialization And Task

Commands run:

```bash
npx agentloopkit@latest init
npx agentloopkit@latest doctor
npx agentloopkit@latest create-task --title "Build AgentFlight MVP" --type feature --problem "AgentFlight needs its first local-first TypeScript npm CLI MVP." --outcome "A working agentflight CLI with init, start, status, report, replay, resume, and doctor commands, documented dogfooding with ProjScan and AgentLoopKit, and verification evidence." --constraint "Local-first only; no cloud, auth, billing, telemetry, or source upload." --constraint "Use ProjScan and AgentLoopKit as development workflow dependencies from day one." --acceptance "npm run build, test, typecheck, lint, format:check, and verify pass." --acceptance "AgentFlight dogfoods itself using init, start, status, report, replay, resume, and doctor." --verify-command "npm run verify"
npx agentloopkit@latest task status .agentloop/tasks/2026-06-13-build-agentflight-mvp.md in-progress
```

Results:

- AgentLoopKit initialized `.agentloop/`, `AGENTS.md`, `AGENTLOOP.md`, and `agentloop.config.json`.
- Initial doctor status was `warn` because lint, typecheck, build, and format scripts did not exist yet.
- Created active task: `.agentloop/tasks/2026-06-13-build-agentflight-mvp.md`.
- Task status was updated to `in-progress`.

### Package And Implementation Checkpoints

Commands run after core implementation:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npx projscan@latest doctor
npx projscan@latest start --mode before_commit --intent "Review AgentFlight MVP core commands after package and build setup"
npx agentloopkit@latest status
```

Results:

- `npm test`: `12 passed`, `31 passed`.
- `npm run typecheck`: passed after strict optional-property fixes.
- `npm run lint`: passed after replacing an empty interface with a type alias.
- `npm run build`: passed.
- `projscan doctor`: health `94/100`; remaining issue was README content, addressed in this change.
- `agentloopkit status`: active task `Build AgentFlight MVP` was `in-progress`; command config was updated after this check to include lint, typecheck, build, and format.

### Current Known Limitations

- Verification evidence is represented honestly as missing unless an actual command run is recorded.
- Runtime reports include filenames and summaries, not full source diffs.
- ProjScan and AgentLoopKit adapters are defensive and may return unavailable if local commands are missing or fail.
- Pro/Team commands are placeholders only; no billing, login, or cloud behavior exists.

### AgentFlight Self-Dogfooding

Commands run:

```bash
npm run verify
npm run build
node dist/cli.js init
node dist/cli.js start --task "Dogfood AgentFlight MVP"
node dist/cli.js status
node dist/cli.js report
node dist/cli.js replay
node dist/cli.js resume
node dist/cli.js doctor
```

Results:

- `npm run verify`: passed. It ran typecheck, lint, tests, and build.
- `node dist/cli.js init`: initialized `.agentflight/`, created `.agentflight/config.json`, and detected AgentLoopKit and ProjScan.
- `node dist/cli.js start --task "Dogfood AgentFlight MVP"` created session `af-20260613-123923-dogfood-agentflight-mvp`.
- `start` detected git branch `main`, package manager `npm`, ProjScan available, and AgentLoopKit available.
- `start` suggested proof commands: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
- `status` reported `114` changed files, risk `high`, and verification evidence not recorded.
- `report` generated `.agentflight/reports/af-20260613-123923-dogfood-agentflight-mvp-proof.md`.
- `replay` generated `.agentflight/reports/af-20260613-123923-dogfood-agentflight-mvp-replay.html`.
- `resume` generated `.agentflight/current/resume-prompt.md` and printed a continuation prompt.
- `doctor` reported overall `OK`.

Dogfooding bugs found and fixed:

- `node dist/cli.js init` initially printed nothing because the ESM entrypoint guard compared a URL-encoded `import.meta.url` with a raw path containing spaces. Fixed with `fileURLToPath` and a regression test in `tests/cli-entrypoint.test.ts`.
- Git porcelain parsing initially truncated untracked filenames such as `README.md` to `EADME.md`. Fixed by preserving porcelain status columns and adding `tests/core/git.test.ts`.
- Risk classification initially treated Markdown policy docs with `secrets` in the filename as secret material. Fixed so Markdown docs are categorized as docs unless they are actual env/credential files.

### Final Verification Checkpoint

Commands run:

```bash
npm run verify
npm run format:check
npm view agentflight version
npx projscan@latest doctor
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest doctor
npx agentloopkit@latest verify --task .agentloop/tasks/2026-06-13-build-agentflight-mvp.md
```

Results:

- `npm run verify`: passed. It ran typecheck, lint, tests, and build.
- `npm run format:check`: passed.
- `npm view agentflight version`: returned `404 Not Found`, confirming the package name was not present on the public npm registry at check time.
- `projscan doctor`: health `100/100`; no issues detected.
- `projscan preflight --mode before_commit --format json`: verdict `proceed`; required checks passed.
- `agentloopkit doctor`: status `warn` because the working tree is dirty and generated runtime risk files exist; configured test, lint, typecheck, and build commands all passed detection.
- `agentloopkit verify --task .agentloop/tasks/2026-06-13-build-agentflight-mvp.md`: overall status `pass`; generated local report `.agentloop/reports/2026-06-13-14-44-verification-report.md`.

### v0.2.0 Verification Evidence Work

Task discipline:

```bash
npx agentloopkit@latest create-task --title "Prepare AgentFlight v0.2.0 verification evidence" --type feature --problem "AgentFlight needs real verification evidence capture so reports, replay, status, and resume prompts prove what ran." --outcome "agentflight verify records command evidence locally and downstream commands use that evidence honestly." --constraint "Do not publish or cut a version in this task." --constraint "Local-first only; no telemetry, cloud, auth, billing, GitHub App, or database." --constraint "Use safe child_process execution without shell interpolation." --acceptance "agentflight verify -- <command> records passing and failing command results." --acceptance "agentflight verify with no args runs configured commands." --acceptance "status, report, replay, and resume reflect captured verification evidence." --acceptance "npm run verify and npm run format:check pass." --verify-command "npm run verify" --verify-command "npm run format:check"
```

ProjScan before-edit command:

```bash
npx projscan@latest start --mode before_edit --intent "Prepare AgentFlight v0.2.0 verification evidence capture"
```

Result:

- ProjScan reported health `100/100`.
- Proceeded with a dirty worktree because the active task was already in progress.

TDD evidence:

```bash
npm test -- tests/core/session.test.ts tests/core/verification.test.ts tests/commands/verify.test.ts
npm test -- tests/commands/evidence-output.test.ts
npm test -- tests/core/fs-safe.test.ts
```

Results:

- The first run failed because `verificationRuns`, `getVerificationRuns`, `runVerificationCommand`, `parseCommandLine`, and `runVerifyCommand` did not exist.
- The evidence-output run failed because status, report, replay, and resume still ignored recorded verification runs.
- The safe-write run failed because `isPathWritable` did not exist, exposing the doctor writable-check bug.

Implementation checkpoint:

```bash
npm test -- tests/core/session.test.ts tests/core/verification.test.ts tests/commands/verify.test.ts
npm test -- tests/commands/evidence-output.test.ts
npm test -- tests/core/fs-safe.test.ts
npm test -- tests/core/session.test.ts tests/core/verification.test.ts tests/commands/verify.test.ts tests/commands/evidence-output.test.ts tests/commands/workflow.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts
npm run typecheck
```

Results:

- Verification core and command tests passed: `3` files, `11` tests.
- Evidence-aware output tests passed: `1` file, `4` tests.
- Writable-check test passed: `1` file, `3` tests.
- Targeted integration and renderer tests passed: `8` files, `19` tests.
- `npm run typecheck` passed.

AgentFlight v0.2 self-dogfooding commands:

```bash
npm run build
node dist/cli.js start --task "Dogfood AgentFlight v0.2.0 verification evidence"
node dist/cli.js verify -- npm run typecheck
node dist/cli.js verify -- npm run lint
node dist/cli.js verify -- npm test
node dist/cli.js verify -- npm run build
node dist/cli.js status
node dist/cli.js report
node dist/cli.js replay
node dist/cli.js resume
node dist/cli.js doctor
```

Results:

- `npm run build`: passed before the built CLI dogfood run.
- `start` created session `af-20260613-132334-dogfood-agentflight-v0-2-0-verification-evidence`.
- `verify -- npm run typecheck`: passed and recorded stdout/stderr evidence.
- `verify -- npm run lint`: passed and recorded stdout/stderr evidence.
- `verify -- npm test`: passed with `16` test files and `49` tests, and recorded stdout/stderr evidence.
- `verify -- npm run build`: passed and recorded stdout/stderr evidence.
- `status` reported `33` changed files, `medium` risk, `4 passed, 0 failed`, no configured verification gaps, and `Ready for review`.
- `report` generated `.agentflight/reports/af-20260613-132334-dogfood-agentflight-v0-2-0-verification-evidence-proof.md`.
- `replay` generated `.agentflight/reports/af-20260613-132334-dogfood-agentflight-v0-2-0-verification-evidence-replay.html`.
- `resume` generated a continuation prompt with no configured verification gaps and scoped-work guardrails.
- `doctor` reported overall `OK`.
- No version was cut and no npm publish was run for this v0.2.0 preparation pass.

ProjScan and AgentLoopKit follow-up:

```bash
npx projscan@latest start --mode after_edit --intent "Review AgentFlight v0.2.0 verification evidence implementation"
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest status
npx projscan@latest start --mode hardening --intent "Review AgentFlight v0.2.0 verification evidence implementation"
npx agentloopkit@latest verify
```

Results:

- `projscan start --mode after_edit`: failed because ProjScan `4.3.1` does not support `after_edit`; supported modes are `before_edit`, `before_commit`, `before_merge`, `refactor`, `release`, `bug_hunt`, and `hardening`.
- `projscan preflight --mode before_commit --format json`: verdict `proceed`, health `100/100`, required checks passed, and `33` changed files detected.
- `agentloopkit status`: reported dirty worktree with `33` changed files, configured commands present, and next action `agentloop verify`.
- `projscan start --mode hardening`: health `100/100` with `needs_attention` because of the active dirty worktree and hotspot review suggestions.
- `agentloopkit verify`: overall status `pass`; report written to `.agentloop/reports/2026-06-13-15-25-verification-report.md`.

Additional bug-pass fix:

```bash
npm test -- tests/cli-entrypoint.test.ts
node dist/cli.js --version
```

Result:

- The new version assertion first failed because `agentflight --version` still reported `0.1.0` while `package.json` was `0.1.1`.
- The CLI now reads the version from package metadata, and the focused entrypoint test passes.
- The built CLI reports `0.1.1`.

Final local verification commands for this pass:

```bash
npm run verify
npm run format:check
npm pack --dry-run
npm audit --audit-level=moderate
git status --short
```

Results:

- `npm run verify`: passed. It ran typecheck, lint, tests, and build. Vitest reported `16` test files and `50` tests passed.
- `npm run format:check`: passed after formatting the changed files.
- `npm pack --dry-run`: passed. The tarball includes `dist/commands/verify.js`, `dist/core/verification.js`, and the updated renderers.
- `npm audit --audit-level=moderate`: found `0 vulnerabilities`.
- `git status --short`: worktree remains dirty with the expected v0.2 implementation, tests, docs, AgentLoop task files, and no release tag or publish changes.

### v0.2.0 Release Preparation

Release metadata commands:

```bash
git status --short
git diff --stat
git status --short -- .agentflight .agentflight/sessions .agentflight/reports .agentflight/current .agentflight/evidence
npm version 0.2.0 --no-git-tag-version
npm install --package-lock-only
npm run build
node dist/cli.js --version
```

Results:

- Dirty worktree contained expected v0.2.0 source, tests, docs, `.gitignore`, package metadata, and AgentLoop task files.
- No `.agentflight/sessions/`, `.agentflight/reports/`, `.agentflight/current/`, or `.agentflight/evidence/` runtime files were visible in git status.
- `package.json`, `package-lock.json`, and the package-lock root package version were updated to `0.2.0`.
- `npm install --package-lock-only` completed with `0 vulnerabilities`; npm repeated allow-scripts review warnings for optional/native packages.
- `npm run build` passed.
- `node dist/cli.js --version` reported `0.2.0`.

Release verification commands:

```bash
npm run verify
npm run format:check
npm pack --dry-run
npm audit --audit-level=moderate
```

Results:

- `npm run verify`: passed. It ran typecheck, lint, tests, and build. Vitest reported `16` test files and `50` tests passed.
- `npm run format:check`: passed.
- `npm pack --dry-run`: passed for `agentflight@0.2.0`; package contents included `dist/commands/verify.js`.
- `npm audit --audit-level=moderate`: found `0 vulnerabilities`.

Packed-package smoke test:

```bash
npm pack --pack-destination /tmp/agentflight-pack-XcRBjU
cd /tmp/agentflight-smoke-70ZcRU
npm init -y
npm install /tmp/agentflight-pack-XcRBjU/agentflight-0.2.0.tgz
npx agentflight --version
npx agentflight --help
npx agentflight init
npx agentflight start --task "Release smoke test"
npx agentflight verify -- node -e "console.log('release smoke ok')"
npx agentflight status
npx agentflight report
npx agentflight replay
npx agentflight resume
npx agentflight doctor
```

Results:

- `npx agentflight --version`: reported `0.2.0`.
- `init`, `start`, `verify`, `status`, `report`, `replay`, `resume`, and `doctor` all ran from the installed tarball.
- `verify` captured `node -e "console.log('release smoke ok')"` as a passed run.
- `status` reported `1 passed, 0 failed`.
- `doctor` returned warnings only because the smoke project was not a git repository and did not define build/typecheck/lint scripts.

Release tool checks:

```bash
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest verify
npx agentloopkit@latest status
```

Results:

- ProjScan preflight verdict: `proceed`; health `100/100`; required checks passed; `36` changed files detected.
- AgentLoopKit verification: overall status `pass`; report written to `.agentloop/reports/2026-06-13-16-00-verification-report.md`.
- AgentLoopKit status reported dirty worktree with `36` changed files and all configured commands present.

### v0.2.1 Dogfood Friction Patch Preparation

Task discipline:

```bash
npx agentloopkit@latest create-task --title "Prepare AgentFlight v0.2.1 dogfood friction patch" --type bugfix --problem "AgentFlight v0.2.0 dogfooding found small workflow friction in verification output, risk clarity, replay readability, and ProjScan version detection." --outcome "Patch-level fixes are implemented locally without new product scope, and verification passes." --constraint "No new commands, cloud, login, billing, database, GitHub App, Pro gating, snapshot, JSON output, or v0.3.0 scope." --acceptance "agentflight verify prints evidence paths after recording results." --acceptance "AgentLoopKit dogfood files do not falsely raise docs-only sessions to medium risk." --acceptance "Reports, replays, and resume prompts have clearer next actions after proof exists." --verify-command "npm run verify" --verify-command "npm run format:check"
npx agentloopkit@latest task status .agentloop/tasks/2026-06-13-prepare-agentflight-v0-2-1-dogfood-friction-patch.md in-progress
```

ProjScan before-edit check:

```bash
npx projscan@latest preflight --mode before_edit --format json
```

Result:

- ProjScan verdict `proceed`; health `100/100`; no blocking or cautionary signals.

Bug reproduction:

```bash
projscan --version
which projscan
./node_modules/.bin/projscan --version
npx --yes projscan@latest --version
node -e "console.log(require('./node_modules/projscan/package.json').version)"
npm ls projscan
```

Results:

- PATH-global `projscan` was `/opt/homebrew/bin/projscan` and reported `0.9.2`.
- Repo-local `./node_modules/.bin/projscan`, `npx projscan@latest`, installed package metadata, and `npm ls projscan` all reported `4.3.1`.
- The adapter now prefers repo-local binaries before PATH-global commands.

TDD checkpoint:

```bash
npm test -- tests/adapters/projscan.test.ts tests/adapters/agentloopkit.test.ts tests/core/risk.test.ts tests/commands/verify.test.ts tests/commands/evidence-output.test.ts tests/renderers/html-replay.test.ts
```

Results:

- The first targeted run failed with expected red tests for stale PATH binary preference, decorated version output, `.agentloop/` risk classification, missing `Evidence saved:` output, stale report/replay/resume next actions, and missing replay summary.
- After the patch, the same targeted suite passed: `6` test files and `34` tests.

Patch scope:

- `verify` prints stdout/stderr evidence paths and clearer failed-command next actions.
- `.agentloop/` workflow artifacts are categorized as low-risk docs.
- ProjScan and AgentLoopKit adapters prefer repo-local binaries and normalize version output.
- Report, replay, and resume use context-aware post-proof next actions.
- Replay includes a compact summary strip.
- Vitest has an explicit `10s` test timeout because full-suite runs can spawn several real Node verification commands concurrently.
- No new product features, cloud, login, billing, database, GitHub App, Pro gating, snapshot, JSON output, tag, or publish was added.

Release-candidate verification:

```bash
npm version 0.2.1 --no-git-tag-version
npm test -- tests/adapters/projscan.test.ts tests/adapters/agentloopkit.test.ts tests/core/risk.test.ts tests/commands/verify.test.ts tests/commands/evidence-output.test.ts tests/renderers/html-replay.test.ts
npm run verify
npm run format:check
npm pack --dry-run
npm audit --audit-level=moderate
node dist/cli.js --version
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest verify
npm run projscan
npm run agentloopkit:doctor
npx agentloopkit@latest task done .agentloop/tasks/2026-06-13-prepare-agentflight-v0-2-1-dogfood-friction-patch.md
```

Results:

- Package metadata was updated locally to `0.2.1` without creating a tag or publishing.
- Targeted regression suite passed: `6` test files and `34` tests.
- `npm run verify` initially hit transient full-suite Vitest timeouts around tests that spawn real Node verification commands; focused tests passed. The test timeout is now explicit at `10s`.
- Final `npm run verify` passed. It ran typecheck, lint, tests, and build. Vitest reported `16` test files and `58` tests passed.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.2.1`; package contents include `dist/commands/verify.js`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `node dist/cli.js --version` reported `0.2.1`.
- ProjScan preflight verdict `proceed`; health `100/100`; required checks passed with `26` changed files detected.
- AgentLoopKit verification status `pass`; report written to `.agentloop/reports/2026-06-13-17-52-verification-report.md`.
- `npm run projscan` used ProjScan `4.3.1`; it exited successfully with health `100/100` and `needs_attention` because the worktree is intentionally dirty during patch prep.
- `npm run agentloopkit:doctor` exited successfully with `warn` due to the expected dirty worktree and risk-file scan warnings.
- The v0.2.1 AgentLoopKit task was marked `done`.

### v0.3.0 Session Events And Snapshots

Task discipline:

```bash
npx agentloopkit@latest create-task --title "Prepare AgentFlight v0.3.0 session events and snapshots" --type feature --problem "AgentFlight needs timeline events and snapshots so sessions feel like real AI coding flight recordings, not only final-state reports." --outcome "AgentFlight records session events, supports agentflight snapshot, and status/report/replay/resume use the timeline while preserving v0.1/v0.2 compatibility." --constraint "Local-first only; no telemetry, cloud, login, billing, GitHub App, database, paid gating, full diff capture, destructive commands, tag, or publish." --acceptance "agentflight snapshot records current git/risk/verification state as a session event." --acceptance "start, verify, report, replay, resume, and doctor append meaningful events." --acceptance "replay/report/status/resume show timeline or latest snapshot context." --acceptance "npm run verify and npm run format:check pass." --verify-command "npm run verify" --verify-command "npm run format:check"
npx agentloopkit@latest task status .agentloop/tasks/2026-06-13-prepare-agentflight-v0-3-0-session-events-and-snapshots.md in-progress
```

ProjScan before-edit check:

```bash
npx projscan@latest preflight --mode before_edit --format json
```

Result:

- ProjScan verdict `proceed`; health `100/100`; no blocking or cautionary signals.

TDD checkpoint:

```bash
npm test -- tests/core/session.test.ts tests/commands/snapshot.test.ts tests/commands/verify.test.ts tests/commands/evidence-output.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts
```

Results:

- The first targeted run failed as expected because `snapshot`, session `events`, timeline rendering, and verification events did not exist yet.
- After implementation, the targeted suite passed: `7` test files and `17` tests.

Implementation summary:

- Added `SessionEvent` and `SessionEventType` to the session model.
- Added backward-compatible event helpers that treat missing `events` arrays as empty.
- Added synthetic timeline fallback for older sessions where useful.
- Added `agentflight snapshot --note "..."`.
- Added event recording for start, verify, report, replay, resume, and doctor.
- Added timeline sections to report and replay.
- Added latest snapshot and verification state to status/resume surfaces.
- Added docs for snapshots and timelines.
- Updated local package metadata to `0.3.0` without tagging or publishing.

Release-candidate verification:

```bash
npm version 0.3.0 --no-git-tag-version
npm run verify
npm run format:check
node dist/cli.js --version
node dist/cli.js --help
npm pack --dry-run
npm audit --audit-level=moderate
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest verify
```

Results:

- `npm run verify`: passed. It ran typecheck, lint, tests, and build. Vitest reported `17` test files and `61` tests passed.
- `npm run format:check`: passed after formatting.
- `node dist/cli.js --version`: reported `0.3.0`.
- `node dist/cli.js --help`: listed `snapshot [options]`.
- `npm pack --dry-run`: passed for `agentflight@0.3.0`; package contents include `dist/commands/snapshot.js`.
- `npm audit --audit-level=moderate`: found `0 vulnerabilities`.
- ProjScan before-commit preflight verdict `proceed`; health `100/100`; required checks passed with `41` changed files detected.
- AgentLoopKit verification status `pass`; report written to `.agentloop/reports/2026-06-13-18-20-verification-report.md`.
- No release tag, npm publish, cloud, login, billing, database, GitHub App, or paid gating was added.

### v0.3.0 Completion Audit

Task discipline:

```bash
npx agentloopkit@latest create-task --title "Audit AgentFlight v0.3.0 release readiness" --type docs --problem "AgentFlight needs a strict v0.1.0 through v0.3.0 completion audit before any v0.3.0 release." --outcome "A documented completion audit confirms command behavior, compatibility, packaging, privacy, tests, and release readiness, with only real audit bugs fixed." --constraint "Do not tag, push, publish, or add product scope." --acceptance "docs/development/v0.3.0-completion-audit.md records results and fixes." --acceptance "npm run verify, format:check, package dry run, audit, ProjScan, and AgentLoopKit checks pass." --verify-command "npm run verify" --verify-command "npm run format:check"
npx agentloopkit@latest task status .agentloop/tasks/2026-06-13-audit-agentflight-v0-3-0-release-readiness.md in-progress
```

Audit commands:

```bash
node dist/cli.js --help
node dist/cli.js --version
node dist/cli.js init
node dist/cli.js start --task "Audit AgentFlight v0.3.0"
node dist/cli.js verify -- npm run typecheck
node dist/cli.js verify -- npm run lint
node dist/cli.js verify -- npm test
node dist/cli.js verify -- npm run build
node dist/cli.js snapshot --note "Audit checkpoint after verification"
node dist/cli.js status
node dist/cli.js report
node dist/cli.js replay
node dist/cli.js resume
node dist/cli.js doctor
node dist/cli.js upgrade
node dist/cli.js license
node dist/cli.js login
```

Results:

- Built CLI reported `0.3.0` and help listed `snapshot [options]`.
- Command matrix completed without unexpected crashes.
- Placeholder commands printed `AgentFlight Pro/Team is not available yet.`
- Audit session `af-20260613-162443-audit-agentflight-v0-3-0` recorded four passed verification runs, evidence files, a snapshot, report, replay, resume, and doctor event.
- Report, replay, status, and resume all reflected the snapshot and timeline data.
- Simulated v0.1 and v0.2 sessions without `events` completed `status`, `report`, `replay`, and `resume` without crashing.
- Failed verification was tested in a temp session and recorded as `failed` with exit code `7`, stderr evidence, and `verification_failed`.
- Packaging audit confirmed `dist/commands/snapshot.js` and all existing command files are present, and runtime `.agentflight` data is not tracked or packed.

Bug found and fixed:

- Commands requiring an active session printed a raw `ENOENT` path when no current session existed.
- `readCurrentSession` now throws `No active AgentFlight session. Run agentflight start --task "Describe the task" first.`
- Added regression coverage in `tests/commands/workflow.test.ts`.

Audit report:

- Created `docs/development/v0.3.0-completion-audit.md`.

Final audit verification:

```bash
npm run verify
npm run format:check
npm pack --dry-run
npm audit --audit-level=moderate
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest verify
npx agentloopkit@latest task done .agentloop/tasks/2026-06-13-audit-agentflight-v0-3-0-release-readiness.md
```

Results:

- `npm run verify`: passed. Vitest reported `17` test files and `62` tests.
- `npm run format:check`: passed after formatting generated AgentLoop task docs.
- `npm pack --dry-run`: passed for `agentflight@0.3.0`.
- `npm audit --audit-level=moderate`: found `0 vulnerabilities`.
- ProjScan preflight verdict `proceed`; health `100/100`; required checks passed.
- AgentLoopKit verification status `pass`; report written to `.agentloop/reports/2026-06-13-18-32-verification-report.md`.
- Audit task was marked `done`.

### Public Demo Visibility Pass After v0.3.0

Goal:

- Make AgentFlight easier to understand in under 60 seconds after the v0.3.0 release.
- Keep the pass limited to README, demo docs, package metadata, and launch-note drafts.
- Do not add CLI features, cloud, login, billing, GitHub App, paid gating, database, or v0.4.0 scope.

Demo artifact generation:

```bash
node dist/cli.js init
node dist/cli.js start --task "Add password reset flow"
node dist/cli.js verify -- npm test
node dist/cli.js snapshot --note "Password reset implementation verified"
node dist/cli.js status
node dist/cli.js report
node dist/cli.js replay
npx playwright screenshot --viewport-size=1440,1200 "file://<demo-replay-path>" output/playwright/agentflight-replay-timeline.png
```

Results:

- Generated a fictional password-reset demo session in a temporary git repo.
- Captured a real AgentFlight HTML replay screenshot with Playwright.
- Added `docs/assets/agentflight-replay-timeline.png` for README/demo use.
- Rendered a small terminal workflow GIF with VHS from `docs/marketing/agentflight-terminal-demo.tape`.
- Updated README with a 60-second workflow, concise sample outputs, current capabilities, local/privacy notes, and explicit non-goals.
- Added `docs/examples/basic-agentflight-session.md`.
- Added `docs/marketing/launch-notes-v0.3.0.md`.
- Expanded package keywords for npm discovery.
- Added `CHANGELOG.md`, the replay screenshot, and README-linked docs to the npm `files` list so public README links and image assets are present in the packed package without shipping marketing drafts.
- Added `output/` to `.gitignore` so Playwright scratch artifacts are not committed.

### v0.3.1 Documentation Polish Release Prep

Goal:

- Release AgentFlight v0.3.1 as a patch release for README, package metadata, and demo asset polish.
- Do not change CLI behavior or add product scope.

Release prep:

```bash
npm version 0.3.1 --no-git-tag-version
```

Planned release verification:

```bash
npm run verify
npm run format:check
npm pack --dry-run
npm audit --audit-level=moderate
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest verify
```

### README CLI Animation Pass

Goal:

- Make the README demo area more useful by showing an animated CLI workflow and the generated replay artifact.
- Keep the pass limited to docs and package metadata.

Changes:

- Added `docs/assets/agentflight-cli-demo.svg`, an animated terminal-style workflow preview.
- Updated README to show the CLI workflow animation before the 60-second command list.
- Added a `Watch The Flow` section that explains start, verify, snapshot, status, report, replay, and resume as one proof trail.
- Added the animated SVG to the npm `files` list because the README references it.

### Logo And Repository Metadata Pass

Goal:

- Use the new AgentFlight logo in public docs.
- Set GitHub repository About metadata for description, website, and topics.

Changes:

- Added the AgentFlight logo to the README header from `docs/agentflight_logo/icon.svg`.
- Added the product website link near the top of the README.
- Added `docs/agentflight_logo/icon.svg` to the npm `files` list.
- Updated `package.json` homepage to `https://www.baseframelabs.com/apps/agentflight`.
- Updated GitHub About metadata:
  - Description: `Local-first flight recorder for AI coding agents.`
  - Website: `https://www.baseframelabs.com/apps/agentflight`
  - Topics: AI coding agents, Codex, Claude Code, local-first, verification, developer tools.

### v0.3.2 Dogfood And Replay UI Polish

Goal:

- Dogfood published `agentflight@latest` v0.3.2 across local repos before planning v0.4.0.
- Use `$impeccable` direction to improve the developer-facing HTML replay artifact without adding product scope.

Dogfood repos:

- AgentFlight: full workflow completed with typecheck, lint, tests, and build captured through `agentflight verify`.
- ProjScan: workflow completed with lint/build captured; long `npm test` was interrupted after more than four minutes of silent runtime.
- fifa-predictor: real app workflow completed with typecheck, 61 tests, and build captured.
- AgentLoopKit and TokenTrace were available but skipped because they had pre-existing dirty worktrees.

Findings document:

- `docs/development/v0.3.2-dogfood-findings.md`

UI polish:

- Added `PRODUCT.md` with the confirmed product UI direction: precise, calm, trustworthy.
- Reworked `src/renderers/html-replay.ts` toward a developer review artifact: compact evidence header, summary strip, timeline rows, file groups, and collapsed evidence paths.
- Updated `tests/renderers/html-replay.test.ts` to cover verification evidence in the replay artifact.
- Captured Playwright screenshots:
  - `output/playwright/agentflight-replay-ui-polish-desktop.png`
  - `output/playwright/agentflight-replay-ui-polish-mobile.png`

Verification:

```bash
npm test -- tests/renderers/html-replay.test.ts tests/commands/evidence-output.test.ts
npm run verify
npm run format:check
npm pack --dry-run
npm audit --audit-level=moderate
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest verify
```

Results:

- Focused replay/evidence tests passed: 2 files / 7 tests.
- `npm run verify` passed: 17 files / 62 tests.
- `npm run format:check` passed.
- `npm pack --dry-run` passed.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- ProjScan preflight passed with `proceed`, health `100/100`.
- AgentLoopKit verification passed.

### v0.3.3 Patch Candidate Runtime Filtering

Goal:

- Prepare a focused v0.3.3 patch candidate without version bump, tag, push, or publish.
- Keep the completed replay UI polish and dogfood findings documentation.
- Fix the dogfood finding where AgentFlight runtime files polluted changed-file analysis in repos that did not already ignore `.agentflight/`.

Decision:

- Exclude AgentFlight runtime artifacts from changed-file analysis:
  - `.agentflight/sessions/**`
  - `.agentflight/reports/**`
  - `.agentflight/current/**`
  - `.agentflight/evidence/**`
- Keep `.agentflight/config.json` visible because it is user-controlled project configuration and may be intentionally committed.

Implementation:

- Added a central runtime-path filter in `src/core/changed-files.ts`.
- Applied filtering through git utilities and command-level changed-file inputs for status, report, replay, resume, and snapshot.
- Added regression coverage in:
  - `tests/core/git.test.ts`
  - `tests/commands/evidence-output.test.ts`
  - `tests/commands/snapshot.test.ts`

Red/green evidence:

```bash
npm test -- tests/core/git.test.ts tests/commands/evidence-output.test.ts tests/commands/snapshot.test.ts
```

Initial focused run failed because runtime `.agentflight/` paths were still included in changed-file counts, risk, and snapshot metadata. After the central filter was implemented, the same focused suite passed.

Verification:

```bash
npm run verify
npm run format:check
npm pack --dry-run
npm audit --audit-level=moderate
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest verify
```

Results:

- `npm run verify` passed: 17 files / 66 tests.
- `npm run format:check` passed.
- `npm pack --dry-run` passed and included `dist/core/changed-files.js`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- ProjScan preflight passed with `proceed`, health `100/100`.
- AgentLoopKit verification passed.

Packed smoke test:

```bash
npm pack --pack-destination "$PACK_DIR"
npm install "$PACK_DIR/agentflight-0.3.3.tgz"
npx agentflight --version
npx agentflight init
npx agentflight start --task "v0.3.3 release smoke test"
npx agentflight verify -- npm --version
npx agentflight snapshot --note "runtime filtering smoke test"
npx agentflight status
npx agentflight report
npx agentflight replay
npx agentflight resume
npx agentflight doctor
```

Result:

- Packed CLI reported `0.3.3`.
- `status` showed `.agentflight/config.json` and `.projscan-memory/memory.json`.
- `status` did not show `.agentflight/current/`, `.agentflight/evidence/`, `.agentflight/reports/`, or `.agentflight/sessions/`.
- Report, replay, resume, and doctor completed from the packed install.

### v0.3.2 Branding Polish Release Prep

Goal:

- Release AgentFlight v0.3.2 as a branding, README animation, and package presentation patch.
- Do not change CLI behavior or add product scope.

Release prep:

```bash
npm version 0.3.2 --no-git-tag-version
```

Release verification:

```bash
npm run verify
npm run format:check
npm pack --dry-run
npm audit --audit-level=moderate
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest verify
```

### v0.4.0 Review Intelligence Implementation

Timestamp: `2026-06-14T12:47:56Z`

Goal:

- Implement the planned v0.4.0 Review Intelligence scope without version bump, commit, tag, push, or publish.
- Keep AgentFlight local-first and deterministic.
- Do not implement PR comments, JSON/CI, ProjScan-enriched ranking, cloud, login, billing, GitHub App, or Pro/Team gating.

Implemented locally:

- Added `src/core/review-intelligence.ts` for deterministic review focus ranking, proof gap detection, and readiness decisions.
- Added review intelligence types in `src/types/index.ts`.
- Added config-driven changed-file filtering through `changedFileFilters.ignore`.
- Kept AgentFlight runtime filters always on while leaving `.agentflight/config.json` visible.
- Integrated review intelligence into:
  - `agentflight status`
  - `agentflight report`
  - `agentflight replay`
  - `agentflight resume`
  - `agentflight snapshot` metadata summary
- Added `docs/development/changed-file-filters.md`.
- Updated README, CHANGELOG, roadmap, and verification docs.

Red/green evidence:

```bash
npm test -- tests/core/review-intelligence.test.ts tests/core/changed-files.test.ts
```

Initial result:

- Failed because `src/core/review-intelligence.ts` and `filterChangedFiles` did not exist.

Green result after implementation:

- Passed: 2 files / 11 tests.

Additional focused verification:

```bash
npm test -- tests/core/config.test.ts tests/core/review-intelligence.test.ts tests/core/changed-files.test.ts
npm test -- tests/commands/evidence-output.test.ts tests/renderers/markdown-report.test.ts tests/renderers/html-replay.test.ts tests/renderers/resume-prompt.test.ts
npm test
npm run typecheck
```

Results:

- Config/review/filter focused tests passed: 3 files / 14 tests.
- Command and renderer integration tests passed: 4 files / 11 tests.
- Full Vitest suite passed: 19 files / 79 tests.
- TypeScript typecheck passed.

Final v0.4.0 verification:

```bash
npm run verify
npm run format:check
npm pack --dry-run
npm audit --audit-level=moderate
npx projscan@latest preflight --mode before_commit --format json
npx agentloopkit@latest verify
```

Results:

- `npm run verify` passed: typecheck, lint, 19 test files / 79 tests, build.
- `npm run format:check` passed after formatting edited tests/types.
- `npm pack --dry-run` passed and included:
  - `dist/core/review-intelligence.js`
  - `docs/development/changed-file-filters.md`
  - `docs/roadmap/v0.4.0-review-intelligence-plan.md`
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx agentloopkit@latest verify` passed.
- `npx projscan@latest doctor --format json` passed with health `100/100` after removing a false-positive string pattern from `src/core/review-intelligence.ts`.
- `npx projscan@latest preflight --mode before_commit --format json` completed with verdict `caution`, not `proceed`.
  - Health: pass, `100/100`.
  - Supply chain: pass.
  - Review: warning for scale/complexity, maximum changed-file risk score `125.3`.
  - Interpretation: no health, taint, dataflow, plugin, or supply-chain blocker remains, but the v0.4.0 implementation should receive manual audit/release sign-off because it touches command output, renderers, config, and review logic.

### v0.4.0 Completion Audit

Timestamp: `2026-06-14T14:05:00Z`

Goal:

- Audit the unreleased v0.4.0 Review Intelligence implementation before any release work.
- Do not bump version, commit, push, tag, or publish.
- Explicitly handle the ProjScan caution instead of treating it as a normal proceed.

Audit fixes made:

- Added package/config proof-gap regression coverage.
- Added command-path backward compatibility coverage for v0.1/v0.2/v0.3 session shapes.
- Hardened malformed `changedFileFilters.ignore` handling so non-array values do not crash changed-file analysis.
- Corrected the historical v0.4.0 plan to document the implemented empty default `changedFileFilters.ignore` list.
- Replaced `docs/assets/agentflight-replay-timeline.png` with a fresh screenshot generated from the current replay renderer. The screenshot now shows review focus, proof gaps, readiness, and timeline in the calmer developer-review UI.
- Created `docs/development/v0.4.0-completion-audit.md`.

Commands run during audit:

```bash
npm test -- tests/core/review-intelligence.test.ts tests/core/changed-files.test.ts
npm run build
node dist/cli.js --version
node dist/cli.js --help
node dist/cli.js init
node dist/cli.js start --task "Audit AgentFlight v0.4.0 review intelligence"
node dist/cli.js verify -- npm run typecheck
node dist/cli.js verify -- npm run lint
node dist/cli.js verify -- npm test
node dist/cli.js verify -- npm run build
node dist/cli.js snapshot --note "Audit checkpoint after review intelligence verification"
node dist/cli.js status
node dist/cli.js report
node dist/cli.js replay
node dist/cli.js resume
node dist/cli.js doctor
npx projscan@latest preflight --mode before_commit --format json
npx playwright screenshot --viewport-size "1440,1350" --wait-for-selector "text=Timeline" <local-replay-demo-url> docs/assets/agentflight-replay-timeline.png
npm test -- tests/commands/evidence-output.test.ts tests/core/review-intelligence.test.ts tests/core/changed-files.test.ts
```

Observed results:

- Built CLI reported `0.3.3`, expected because no v0.4.0 version bump has been made.
- Command matrix completed successfully.
- AgentFlight captured four passed verification runs: typecheck, lint, test, and build.
- Latest audit snapshot recorded `27` filtered changed files, `medium` risk, and `4 passed, 0 failed`.
- `status`, `report`, `replay`, and `resume` all surfaced review focus, proof gaps, readiness, and next action.
- Targeted tests passed: 3 files / 22 tests.
- ProjScan preflight still returned `caution` due scale/complexity, with health `100/100`, supply chain pass, and no concrete blockers.

Final audit verification:

```bash
npm run verify
npm run format:check
npm pack --dry-run
npm audit --audit-level=moderate
npx agentloopkit@latest verify
npx projscan@latest doctor --format json
npx projscan@latest preflight --mode before_commit --format json
```

Results:

- `npm run verify` passed: typecheck, lint, 19 test files / 82 tests, build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.3.3` and included `dist/core/review-intelligence.js`, `dist/core/changed-files.js`, `docs/development/changed-file-filters.md`, `docs/roadmap/v0.4.0-review-intelligence-plan.md`, and `docs/assets/agentflight-replay-timeline.png`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- `npx agentloopkit@latest verify` passed.
- `npx projscan@latest doctor --format json` passed with health `100/100`.
- `npx projscan@latest preflight --mode before_commit --format json` returned `caution`, not `proceed`.
  - Changed files: `30`.
  - Review signal: maximum changed-file risk score `125.3`.
  - Health: pass.
  - Supply chain: pass.
  - Concrete blockers: none reported.
  - Manual sign-off recommendation: acceptable for v0.4.0 release prep after human review of review-intelligence logic, changed-file filtering, and renderer/command consistency.

### v0.4.1 Patch Candidate: Dogfood Friction Fixes

Timestamp: `2026-06-15T00:05:00+02:00`

Goal:

- Implement only the focused v0.4.1 dogfood fixes after published v0.4.0 testing.
- Do not bump version, commit, push, tag, publish, or start v0.5.0.

Scope implemented:

- Detect `verification_started` events that have no later passed/failed event or persisted verification run.
- Surface incomplete verification as a blocking Review Intelligence proof gap.
- Prevent `Ready for review` when incomplete verification needs rerun.
- Add a minimal `agentflight verify` heartbeat for long-running commands.
- Keep heartbeat output out of captured stdout/stderr evidence.
- Route report proof-gap language through Review Intelligence instead of legacy verification-gap text.
- Classify `.agentflight/config.json` as AgentFlight project config while keeping it visible.
- Suggest `.projscan-memory/**` in `changedFileFilters.ignore` when `.projscan-memory/memory.json` appears, without making it a built-in ignore.

Red/green evidence:

```bash
npm test -- tests/core/review-intelligence.test.ts tests/commands/evidence-output.test.ts tests/commands/verify.test.ts
```

Initial result:

- Failed as expected for incomplete verification detection, ProjScan-memory guidance, AgentFlight config classification, and heartbeat support.

After implementation:

- Targeted tests passed: 3 files / 27 tests.

### v0.4.1 Release Preparation

Timestamp: `2026-06-15T07:10:00+02:00`

Goal:

- Release AgentFlight v0.4.1 as a focused Review Intelligence trust patch.
- Do not add product scope or start v0.5.0.

Commands run:

```bash
npm version 0.4.1 --no-git-tag-version
npm run build
node dist/cli.js --version
npm run verify
npm run format:check
npm pack --dry-run
npm audit --audit-level=moderate
npx agentloopkit@latest verify
npx projscan@latest doctor --format json
npx projscan@latest preflight --mode before_commit --format json
```

Results:

- Package metadata and lockfile are aligned at `0.4.1`.
- Built CLI reported `0.4.1`.
- `npm run verify` passed: typecheck, lint, 19 test files / 89 tests, build.
- `npm run format:check` passed.
- `npm pack --dry-run` passed for `agentflight@0.4.1`.
- `npm audit --audit-level=moderate` found `0 vulnerabilities`.
- AgentLoopKit verification passed.
- ProjScan doctor passed with health `100/100`.
- ProjScan preflight returned `proceed` with no caution.
- Local packed-package smoke test passed through init, start, verify, snapshot, status, report, replay, resume, and doctor.
