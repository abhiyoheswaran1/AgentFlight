# Baseframe Suite Integration v1

AgentFlight consumes local Baseframe evidence from ProjScan and AgentLoopKit, compares the expected task contract with actual execution evidence, and writes the AgentFlight result artifact for AgentLoopKit reconciliation.

The products stay separate. AgentFlight does not import ProjScan or AgentLoopKit internals; it reads and writes versioned JSON files under the target repository.

## Shared Artifacts

```text
.baseframe/
  agent-workflow.json
  evidence/
    <task-id>/
      projscan-assessment.json
      agentloopkit-task.json
      agentflight-result.json
```

AgentFlight consumes `projscan-assessment.json` and `agentloopkit-task.json`. AgentFlight owns `agentflight-result.json` and continues to write its normal `.agentflight/` session, report, replay, resume, and verification evidence.

## Workflow

```bash
projscan assess \
  --intent "Implement password reset" \
  --task-id auth-password-reset-20260626-01 \
  --emit-baseframe

agentloopkit create-task \
  --from-projscan .baseframe/evidence/auth-password-reset-20260626-01/projscan-assessment.json

agentflight start \
  --from-task .baseframe/evidence/auth-password-reset-20260626-01/agentloopkit-task.json

agentflight verify -- npm run typecheck
agentflight verify -- npm test
agentflight verify -- npm run build

agentflight snapshot --note "Implementation complete"
agentflight finalize

agentloopkit check-gates \
  --task auth-password-reset-20260626-01 \
  --from-agentflight .baseframe/evidence/auth-password-reset-20260626-01/agentflight-result.json
```

You can also pass both inputs explicitly:

```bash
agentflight start \
  --task-id auth-password-reset-20260626-01 \
  --from-task .baseframe/evidence/auth-password-reset-20260626-01/agentloopkit-task.json \
  --from-projscan .baseframe/evidence/auth-password-reset-20260626-01/projscan-assessment.json
```

## What AgentFlight Checks

AgentFlight validates schema version, kind, required fields, task ID agreement, practical intent agreement, and repository-local safe paths. Task ID conflicts fail clearly.

Scope drift is deterministic:

- `excludedPaths` matches are blocking.
- changed files outside non-empty `allowedPaths` are warnings.
- when `allowedPaths` is empty, changed files are unclassified warnings instead of blockers.
- AgentFlight and AgentLoopKit runtime evidence filters are respected, while `.agentflight/config.json` remains visible.

Verification gates use only exact command matches or normalized whitespace matches. There is no fuzzy matching. If the same normalized command later passes, that later pass satisfies an earlier failed run, matching AgentFlight’s existing unresolved-failure behavior.

## Result

`agentflight finalize` writes:

```text
.baseframe/evidence/<task-id>/agentflight-result.json
```

It also updates only the `agentflight` section of `.baseframe/agent-workflow.json`:

```json
{
  "agentflight": {
    "status": "completed",
    "resultPath": ".baseframe/evidence/<task-id>/agentflight-result.json",
    "version": "0.13.0"
  }
}
```

The result includes readiness, changed files, scope drift, verification runs, gate reconciliation, proof gaps, merged review focus, and generated local artifacts. Status, report, replay, and resume show separate Repository Assessment, Task Contract, Scope Adherence, Verification Gates, Review Focus, Proof Gaps, Readiness, and Next Action sections for Baseframe sessions.
