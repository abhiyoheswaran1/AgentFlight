# Filter Local AgentFlight History

**Goal:** Let engineers narrow `agentflight history` to the local sessions they need by task text or recorded readiness state without adding an index, session switching, sync, export, or any hosted surface.

**Architecture:** Keep filtering in the `history` command layer. Load the same local session summaries, apply filters before the display limit, and reuse existing artifact/readiness formatting for the filtered set.

**Tech Stack:** TypeScript, Commander, Vitest, AgentFlight local session summaries.

## Constraints

- Keep `history` read-only and local-only.
- Preserve repo-relative paths and malformed-session reporting.
- Do not change report, replay, handoff, resume, or session artifact generation.
- Do not add JSON/CI, cloud, PR comments, session switching, or a search index.

## Plan

1. [x] Add red history tests for `--task`, `--state`, filtered latest-action behavior, empty matches, invalid states, and malformed-session reporting.
2. [x] Add command options in `src/cli.ts` and typed filters in `src/commands/history.ts`.
3. [x] Apply filters before the display limit and derive latest-action/previous-artifact guidance from the filtered session list.
4. [x] Update README, changelog, and devlog with local session-discovery behavior.
5. [x] Run focused tests, full verification, ProjScan, AgentLoopKit, AgentFlight handoff, and a bug-pass review.

## Verification

- `npm test -- tests/commands/history.test.ts`
- `npm run verify`
- `npm run format:check`
- `npm pack --dry-run`
- `npx projscan@latest doctor --format json`
- `npx projscan@latest preflight --mode before_commit --format json`
- `npx agentloopkit@latest verify`

## Rollback

Revert `history` option parsing, command-layer filtering, tests, docs, and this plan.
