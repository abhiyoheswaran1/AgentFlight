#!/usr/bin/env bash
# Scripted, deterministic playback for the AgentFlight terminal demo GIF.
# Output mirrors the real CLI wording; it is curated so the recording stays clean.
set -euo pipefail

CYAN=$'\033[38;5;38m'
DIM=$'\033[38;5;245m'
GREEN=$'\033[38;5;71m'
AMBER=$'\033[38;5;179m'
BOLD=$'\033[1m'
RESET=$'\033[0m'

prompt() { printf '%s%s$%s %s\n' "$BOLD" "$CYAN" "$RESET" "$1"; }
note()   { printf '%s%s%s\n' "$DIM" "$1" "$RESET"; }
plain()  { printf '%s\n' "$1"; }
label()  { printf '%s%s%s\n' "$DIM" "$1" "$RESET"; }

clear
sleep 0.4

prompt 'npx agentflight init'
sleep 0.6
plain  'AgentFlight initialized'
plain  ''
label  'Created:'
plain  '- .agentflight/config.json'
plain  '- .agentflight/.gitignore'
plain  ''
label  'Next:'
plain  'agentflight start --task "Describe the task"'
sleep 0.9

printf '\n'
prompt 'npx agentflight start --task "Add password reset flow"'
sleep 0.7
plain  'AgentFlight started'
plain  ''
label  'Task:'
plain  'Add password reset flow'
plain  ''
label  'Detected:'
plain  'Git branch: main'
plain  'Package manager: npm'
printf 'ProjScan: %savailable%s\n' "$GREEN" "$RESET"
printf 'AgentLoopKit: %savailable%s\n' "$GREEN" "$RESET"
plain  ''
label  'Suggested proof:'
plain  'npm test'
plain  ''
plain  'Now run your coding agent normally.'
sleep 1.1

printf '\n'
note '# Your coding agent edits the repo'
sleep 0.9

prompt 'npx agentflight verify -- npm test'
sleep 0.7
plain  'AgentFlight verification'
plain  ''
printf '%spassed%s: npm test\n' "$GREEN" "$RESET"
label  'Evidence saved:'
plain  '- stdout: .agentflight/evidence/af-7d3f/verification-1.stdout.txt'
plain  '- stderr: .agentflight/evidence/af-7d3f/verification-1.stderr.txt'
sleep 1.1

printf '\n'
prompt 'npx agentflight status'
sleep 0.7
plain  'AgentFlight status'
plain  ''
label  'Changed files:'
plain  '3'
plain  ''
printf 'Risk: %smedium%s\n' "$AMBER" "$RESET"
plain  '- Authentication-sensitive files changed.'
plain  ''
label  'Verification Evidence:'
plain  '1 passed, 0 failed'
plain  ''
label  'Review first:'
plain  '1. src/auth/reset.ts'
plain  '   Why: identity/session path'
plain  '   Focus: Check session, permission, and identity boundaries first.'
plain  ''
printf 'Review readiness: %sReady for review%s\n' "$GREEN" "$RESET"
plain  ''
label  'Next action:'
plain  'Run agentflight handoff to generate the local review packet.'
sleep 1.3

printf '\n'
prompt 'npx agentflight handoff'
sleep 0.7
label  'AgentFlight handoff'
plain  'Readiness: Ready for review'
plain  'Open first: handoff .agentflight/reports/af-7d3f-handoff.md'
plain  'Artifacts: handoff, report, replay, resume'
plain  ''
note '# Share the local handoff packet for scoped review'
sleep 1.0

printf '\n'
prompt 'npx agentflight history --limit 1'
sleep 0.7
plain  'AgentFlight history'
plain  ''
label  'Latest action:'
plain  'Open first: handoff .agentflight/reports/af-7d3f-handoff.md'
plain  'Recorded readiness: Ready for review'
plain  ''
label  'Recent sessions:'
plain  '1. Add password reset flow'
plain  '   Proof: 1 passed, 0 failed'
plain  '   Handoff: .agentflight/reports/af-7d3f-handoff.md'
sleep 2.2
