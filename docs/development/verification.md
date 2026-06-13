# Verification

AgentFlight uses local verification only. Do not claim completion unless the command actually ran and passed.

## Primary Commands

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run verify
```

`npm run verify` runs:

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

## Tooling Checks

ProjScan and AgentLoopKit are part of the development workflow:

```bash
npm run projscan
npm run agentloopkit:doctor
```

These commands should provide guidance and evidence, but the core `verify` script avoids brittle coupling to changing tool output formats.

## Report Honesty

AgentFlight reports must not say tests passed unless they have evidence from an actual command run. Missing proof should remain visible as a gap.
