import type {
  ProofGap,
  ReviewFocusItem,
  ReviewReadinessDecision,
  RiskLevel
} from "../types/index.js";

export interface ResumePromptInput {
  task: string;
  sessionId: string;
  branch: string | null;
  changedFiles: string[];
  riskLevel: RiskLevel;
  riskReasons: string[];
  verificationGaps: string[];
  reviewFocus?: ReviewFocusItem[] | undefined;
  proofGaps?: ProofGap[] | undefined;
  readiness?: ReviewReadinessDecision | undefined;
  latestSnapshotNote?: string | undefined;
  verificationState?: string | undefined;
  nextAction: string;
}

export function renderResumePrompt(input: ResumePromptInput): string {
  return `Continue this AgentFlight-recorded coding session safely.

## Task
${input.task}

## Current State
- Session: ${input.sessionId}
- Git branch: ${input.branch ?? "unknown"}
- Risk level: ${input.riskLevel}

## Changed Files
${renderList(input.changedFiles, "No changed files detected.")}

## Risks
${renderList(input.riskReasons, "No specific risks detected yet.")}

## Latest Snapshot
${input.latestSnapshotNote ?? "No snapshot recorded."}

## Verification State
${input.verificationState ?? "No verification state recorded."}

## Review Focus
${renderReviewFocus(input.reviewFocus ?? [])}

## Proof Gaps
${renderProofGaps(input)}

## Review Readiness
${renderReadiness(input.readiness)}

## Next Recommended Action
${input.nextAction}

## Constraints
- Stay scoped to the current task.
- Do not start unrelated work.
- Do not claim completion without proof.
- Run relevant verification before declaring success.
- Keep changes scoped.
`;
}

function renderList(items: string[], empty: string): string {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : empty;
}

function renderReviewFocus(items: ReviewFocusItem[]): string {
  if (items.length === 0) return "No review focus recorded.";
  return items
    .map(
      (item) =>
        `${item.rank}. ${item.file}\n   - Why: ${item.reasons.join("; ")}\n   - Focus: ${item.suggestedReviewerFocus}${item.suggestedCommand ? `\n   - Suggested proof: ${item.suggestedCommand}` : ""}`
    )
    .join("\n");
}

function renderProofGaps(input: ResumePromptInput): string {
  if (input.proofGaps) {
    return input.proofGaps.length
      ? input.proofGaps
          .map(
            (gap) =>
              `- ${gap.severity}: ${gap.message}${gap.suggestedCommand ? `\n  Suggested proof: agentflight verify -- ${gap.suggestedCommand}` : ""}`
          )
          .join("\n")
      : "No proof gaps recorded.";
  }

  return renderList(input.verificationGaps, "No verification gaps recorded.");
}

function renderReadiness(readiness: ReviewReadinessDecision | undefined): string {
  if (!readiness) return "No review readiness recorded.";
  return `${readiness.label}
- Reason: ${readiness.reason}
- Next action: ${readiness.nextAction}`;
}
