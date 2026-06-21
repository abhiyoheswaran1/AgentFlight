import { compactCommandInText, formatVerifyCommandForDisplay } from "../core/output.js";
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
  openFirstArtifact?: string | undefined;
  latestSnapshotNote?: string | undefined;
  verificationState?: string | undefined;
  verificationContext?: string | undefined;
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
${renderVerificationState(input)}

## Review Focus
${renderReviewFocus(input.reviewFocus ?? [])}

## Proof Gaps
${renderProofGaps(input)}

## Review Readiness
${renderReadiness(input.readiness, input.openFirstArtifact)}

## Next Recommended Action
${renderNextRecommendedAction(input.nextAction, input.openFirstArtifact)}

## Constraints
${renderConstraints(input.readiness)}
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
        `${item.rank}. ${item.file}\n   - Why: ${item.reasons.join("; ")}\n   - Focus: ${item.suggestedReviewerFocus}${item.suggestedCommand ? `\n   - Suggested proof: ${formatVerifyCommandForDisplay(item.suggestedCommand)}` : ""}`
    )
    .join("\n");
}

function renderVerificationState(input: ResumePromptInput): string {
  const state = input.verificationState ?? "No verification state recorded.";
  return input.verificationContext ? `${state}\n${input.verificationContext}` : state;
}

function renderProofGaps(input: ResumePromptInput): string {
  if (input.proofGaps) {
    return input.proofGaps.length
      ? input.proofGaps
          .map(
            (gap) =>
              `- ${gap.severity}: ${compactCommandInText(gap.message, gap.suggestedCommand)}${gap.suggestedCommand ? `\n  Suggested proof: ${formatVerifyCommandForDisplay(gap.suggestedCommand)}` : ""}`
          )
          .join("\n")
      : "No proof gaps recorded.";
  }

  return renderList(input.verificationGaps, "No verification gaps recorded.");
}

function renderReadiness(
  readiness: ReviewReadinessDecision | undefined,
  openFirstArtifact: string | undefined
): string {
  if (!readiness) return "No review readiness recorded.";
  const command = readiness.suggestedCommand;
  const openFirst = openFirstArtifact ? `- Open first: ${openFirstArtifact}\n` : "";
  return `${readiness.label}
- Reason: ${compactCommandInText(readiness.reason, command)}
${openFirst}- Next action: ${compactCommandInText(readiness.nextAction, command)}`;
}

function renderNextRecommendedAction(
  nextAction: string,
  openFirstArtifact: string | undefined
): string {
  if (!openFirstArtifact) return nextAction;
  return `Open first: ${openFirstArtifact}
${nextAction}`;
}

function renderConstraints(readiness: ReviewReadinessDecision | undefined): string {
  if (readiness?.state === "clean_worktree") {
    return [
      "- Open the listed local artifact if you need review context.",
      "- Start a new AgentFlight session before unrelated work.",
      "- Do not claim completion without proof.",
      "- Run relevant verification before declaring success.",
      "- Keep changes scoped."
    ].join("\n");
  }

  return [
    "- Stay scoped to the current task.",
    "- Do not start unrelated work.",
    "- Do not claim completion without proof.",
    "- Run relevant verification before declaring success.",
    "- Keep changes scoped."
  ].join("\n");
}
