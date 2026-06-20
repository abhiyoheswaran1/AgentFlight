# Post-v0.6.0 User Research Findings

Date: 2026-06-20

Status: evidence-backed research synthesis. This is not a live interview log.
Inputs were v0.5.0/v0.5.1 dogfood findings, the v0.6.0 release, local handoff
smoke tests, and the AgentFlight team personas.

## Research Question

What is the next thing AgentFlight must do to become useful to real engineers?

## Answer

AgentFlight needs one obvious local review handoff loop.

The product already records sessions, captures verification evidence, shows
failure excerpts, ranks review focus, and creates report/replay/resume
artifacts. The remaining usefulness gap is that a real engineer has to know
which artifact to open or share. The next product move is not PR comments, CI,
or hosted review. It is a local handoff command that tells the user:

- whether the session is ready for review
- what failed
- what proof exists
- what needs review first
- which local artifact to open or share

## User Persona Feedback

### First-Time Developer

Opinion: "I need AgentFlight to tell me what to do after verification."

Needed refinement:

- make the end-of-session path explicit
- keep local file creation understandable
- avoid sending users through five commands when one review packet will do

### AI-Heavy Solo Developer

Opinion: "The failure excerpt is useful, but I want a final trust readout."

Needed refinement:

- put readiness, failure excerpt, and next action in one place
- preserve raw stdout/stderr evidence without making the summary noisy
- exit non-zero when failed verification blocks review

### Maintainer Or Reviewer

Opinion: "Do not make me choose between report, replay, and resume. Tell me
which one to open first."

Needed refinement:

- point to replay first when proof is complete
- point to report/fix path first when verification failed
- show the top review files without requiring status output

### Team Lead

Opinion: "Before PR comments or CI, prove the local handoff artifact is the
thing we would ask contributors to attach."

Needed refinement:

- keep the workflow local-only
- make the handoff artifact stable and boring
- do not add distribution surfaces before the local artifact is excellent

### Skeptical Engineer

Opinion: "I will try this if it is transparent and does not upload or post
anything."

Needed refinement:

- state no upload, no telemetry, and no automatic PR comment in the handoff
- keep command behavior deterministic
- avoid hiding failed evidence

## Team Persona Feedback

### Product Maintainer

Priority: make the handoff loop the product's golden path.

Rationale: "local-first review layer" becomes concrete when the user can run one
final command and share a review packet.

### CLI Engineer

Priority: compose existing commands rather than duplicate report/replay logic.

Rationale: the implementation should remain maintainable and should not create a
second Review Intelligence renderer.

### Verification Engineer

Priority: cover ready and blocked handoff paths.

Rationale: the command is only useful if failed verification exits non-zero and
still preserves raw evidence.

### Docs And DX Writer

Priority: update the 60-second workflow.

Rationale: new users should see `handoff` as the final local command, with
report/replay/resume still available individually.

### Security Reviewer

Priority: preserve local-only behavior.

Rationale: no hidden network calls, no telemetry, no cloud upload, and no
automatic PR posting.

### Release Engineer

Priority: do not cut a release until the handoff command is dogfooded.

Rationale: this is a new public CLI command and should get a short real-repo
pass before versioning.

### Repo Steward

Priority: keep generated AgentLoop evidence out of the product commit.

Rationale: local evidence helps review, but it should not dominate the product
diff.

## Resulting Product Decision

Implement and dogfood `agentflight handoff` as the local end-of-session command.

Expected behavior:

- generate a local handoff summary
- generate/point to report, replay, and resume artifacts
- show readiness, risk, changed-file count, top review focus, proof gaps, and
  failed verification excerpts
- use stored stderr-preferred failure excerpts
- preserve raw stdout/stderr evidence
- exit non-zero only when failed verification blocks review
- never post, upload, or call hosted services

## Next Research Pass

Dogfood `agentflight handoff` in:

- AgentFlight
- one clean real app repo
- one failing-verification session with stdout noise and stderr signal
- one ready-for-review session with passing verification

Measure:

- can the user decide what to open first in under 30 seconds?
- does the failed handoff show the useful failure line?
- does the non-zero exit code help or surprise users?
- does the handoff summary contain enough context without replacing report or
  replay?
- do users still ask for PR comments after seeing the local handoff?

## Deferred

- PR comments
- CI adoption
- hosted review
- cloud sync
- account/login/billing
- broader export modes
- team dashboards
