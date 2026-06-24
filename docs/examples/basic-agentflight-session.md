# Basic AgentFlight Session

This example shows a fictional local session for adding a password reset flow.

## 1. Start The Flight

```bash
npx agentflight@latest init
npx agentflight@latest start --task "Add password reset flow"
```

AgentFlight records the task, current branch, commit, dirty state, package manager, and available tools. It also writes `.agentflight/current/handoff.md` so the coding agent or human reviewer has a starting point.

## 2. Run The Coding Agent

Run Codex, Claude Code, Cursor, or another coding agent normally.

In this example the agent changes:

```text
src/password-reset.ts
tests/password-reset.test.ts
docs/password-reset.md
```

## 3. Capture Proof

```bash
npx agentflight@latest verify
```

AgentFlight runs the configured proof command and stores local evidence:

```text
Verification recorded

Command:
npm test

Status:
passed

Evidence:
stdout: .agentflight/evidence/.../verification-1.stdout.txt
stderr: .agentflight/evidence/.../verification-1.stderr.txt
```

If the command fails, AgentFlight records it as failed. It does not turn failed proof into success.

## 4. Create A Snapshot

```bash
npx agentflight@latest snapshot --note "Initial implementation verified"
```

The snapshot records:

- branch
- commit
- dirty state
- changed files
- risk level
- verification summary
- note

AgentFlight stores this as a session event. It does not store full code diffs by default.

## 5. Check Status

```bash
npx agentflight@latest status
```

Example:

```text
AgentFlight status

Task:
Add password reset flow

Changed files:
3

Changed areas:
- docs: docs/password-reset.md
- tests: tests/password-reset.test.ts
- source: src/password-reset.ts

Risk: medium
- Application source files changed.

Verification Evidence:
1 passed, 0 failed

Latest snapshot:
- Note: Initial implementation verified
- Risk: medium
- Changed files: 3

Review readiness: Ready for review

Decision:
Ready for review; manual checks remain before trusting the change.

Why:
- Source and test proof are supported.
- Documentation review remains.
- No failed, stale, or missing required proof.

Required proof:
- supported - Source behavior review
   Matched: Matched source changes: src/password-reset.ts
   Proof: current
   Proof detail: Satisfied by current test proof: npm test
   Accepted proof: test, typecheck, build
- supported - Test suite review
   Matched: Matched tests changes: tests/password-reset.test.ts
   Proof: current
   Proof detail: Satisfied by current test proof: npm test
   Accepted proof: test
- needs review - Documentation review
   Matched: Matched docs changes: docs/password-reset.md
   Proof: not required
   Proof detail: No automated proof required.
   Remaining: Review documentation accuracy and scope manually.

Next action:
Run agentflight handoff to generate the local review packet.
```

## 6. Generate The Local Handoff

```bash
npx agentflight@latest handoff
```

The handoff tells you whether the work is ready, which contract rules matched,
what proof satisfied them, and which manual review checks remain. It also
generates the supporting local artifacts:

- Markdown proof report
- HTML replay ledger
- resume prompt

The HTML replay gives a browser-friendly timeline:

```text
session_started
verification_started
verification_passed
snapshot_created
report_generated
replay_generated
```

The report and replay stay local under `.agentflight/reports/`. The current handoff and resume prompt stay local under `.agentflight/current/`.

To reopen the latest local artifacts later:

```bash
npx agentflight@latest history --limit 1
```

History shows the latest action, recorded readiness, and the report/replay/handoff/resume paths for the most recent session.

## 7. Resume Safely

```bash
npx agentflight@latest resume
```

The resume prompt includes:

- original task
- current state
- changed files
- risk
- latest snapshot note
- verification state
- next recommended action
- guardrails for the next agent

Example guardrails:

```text
- Stay scoped to the current task.
- Do not start unrelated work.
- Do not claim completion without proof.
- Run relevant verification before declaring success.
```

## What This Gives You

By the end of the session, you know:

- what changed
- how risky it looks
- what proof exists
- what proof is missing
- whether the work is ready for review
- how to hand it off without losing context
