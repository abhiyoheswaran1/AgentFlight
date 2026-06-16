# Release Notes

## Version

- Current published version: `agentflight@0.4.1`
- Release type: patch
- Theme: Review Intelligence trust patch

## Highlights

- Detects incomplete or interrupted verification attempts from orphan `verification_started` events.
- Prevents sessions from being marked ready for review when proof is missing.
- Adds simple heartbeat output for long-running `agentflight verify` commands.
- Keeps heartbeat output separate from captured stdout/stderr evidence.
- Unifies report proof-gap messaging around Review Intelligence.
- Classifies `.agentflight/config.json` as AgentFlight project config.
- Suggests optional `.projscan-memory/**` filtering when ProjScan memory appears as a changed file.

## Changes

- `status`, `report`, `replay`, and `resume` surface incomplete verification consistently through proof gaps and readiness.
- `.agentflight/config.json` remains visible as project config while runtime `.agentflight/` artifacts stay filtered.
- `.projscan-memory/**` is informational guidance only; it is not a built-in ignore pattern.
- Docs were updated for verification behavior, changed-file filters, dogfood findings, README, CHANGELOG, and devlog.

## Verification

- `npm run verify` passed before release.
- `npm run format:check` passed before release.
- `npm pack --dry-run` passed for `agentflight@0.4.1`.
- `npm audit --audit-level=moderate` found 0 vulnerabilities.
- `npx agentloopkit@latest verify` passed.
- `npx projscan@latest doctor --format json` passed with health `100/100`.
- `npx projscan@latest preflight --mode before_commit --format json` returned `proceed`, no caution.
- npm latest was confirmed as `0.4.1`.
- Clean published-package smoke test passed.

## Breaking Changes

- None known.

## Upgrade Notes

- Install with `npx agentflight@latest ...` or `npm install -D agentflight@latest`.
- Existing v0.1, v0.2, v0.3, and v0.4 session files remain compatible.

## Known Limitations

- No PR comments yet.
- No JSON/CI integration yet.
- No ProjScan-enriched ranking yet.
- No cloud, login, billing, database, GitHub App, or Pro/Team features.
- Review Intelligence remains deterministic and local-only.
