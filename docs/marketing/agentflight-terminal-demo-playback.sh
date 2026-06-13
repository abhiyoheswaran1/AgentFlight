#!/usr/bin/env bash
set -euo pipefail

prompt() {
  printf '\033[1;36m$ %s\033[0m\n' "$1"
}

section() {
  printf '\033[1;37m%s\033[0m\n' "$1"
}

clear

prompt 'npx agentflight@latest start --task "Add password reset flow"'
sleep 0.7
cat <<'OUT'
AgentFlight started

Task:
Add password reset flow

Session:
af-20260613-add-password-reset-flow

Detected:
Git branch: main
Package manager: npm

Now run your coding agent normally.
OUT

sleep 1.0
printf '\n'
section '# Codex, Claude Code, or Cursor changes the repo'
sleep 0.8

prompt 'npx agentflight@latest verify -- npm test'
sleep 0.7
cat <<'OUT'
Verification recorded

Command:
npm test

Status:
passed

Evidence:
stdout: .agentflight/evidence/.../verification-1.stdout.txt
stderr: .agentflight/evidence/.../verification-1.stderr.txt
OUT

sleep 1.0
printf '\n'
prompt 'npx agentflight@latest snapshot --note "Initial implementation verified"'
sleep 0.7
cat <<'OUT'
Snapshot recorded

Note: Initial implementation verified
Changed files: 3
Risk: medium
Verification: 1 passed, 0 failed
OUT

sleep 1.0
printf '\n'
prompt 'npx agentflight@latest status'
sleep 0.7
cat <<'OUT'
AgentFlight status

Task:
Add password reset flow

Changed files:
3

Risk: medium
Verification Evidence:
1 passed, 0 failed

Review readiness: Ready for review

Next action:
Generate a proof report with agentflight report
OUT

sleep 3.0
