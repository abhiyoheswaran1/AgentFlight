import {
  compactCommandInText,
  formatProjectRequirementDetailsForDisplay,
  formatProjectRequirementStatusForDisplay,
  formatProofCalibrationDetailsForDisplay,
  formatProofCalibrationStatusForDisplay,
  formatProofCalibrationSummaryForDisplay,
  formatProofFreshnessAttributionForDisplay,
  formatProofStatusForDisplay,
  formatReviewContractProofReferencesForDisplay,
  formatReviewContractReviewPathForDisplay,
  formatReviewContractStatusForDisplay,
  formatVerifyCommandForDisplay
} from "../core/output.js";
import type {
  ProofGap,
  ProofCalibration,
  ProofCalibrationSuggestion,
  ProofFreshnessAttribution,
  ProjectReviewContractEvaluation,
  ProjectReviewRequirementStatus,
  ReviewContract,
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
  projectReviewContract?: ProjectReviewContractEvaluation | undefined;
  calibration?: ProofCalibration | undefined;
  proofFreshness?: ProofFreshnessAttribution | undefined;
  reviewContract?: ReviewContract | undefined;
  proofGaps?: ProofGap[] | undefined;
  readiness?: ReviewReadinessDecision | undefined;
  openFirstArtifact?: string | undefined;
  latestSnapshotNote?: string | undefined;
  verificationState?: string | undefined;
  verificationContext?: string | undefined;
  nextAction: string;
}

const readyHandoffNextAction = "Run agentflight handoff to generate the local review packet.";

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

## Required Proof
${renderRequiredProof(input.projectReviewContract)}

${renderProofFreshnessSection(input.proofFreshness)}

## Repo Calibration
${renderRepoCalibration(input.calibration)}

## Review Contract
${renderReviewContract(input.reviewContract, Boolean(input.openFirstArtifact))}

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
        `${item.rank}. ${item.file}\n   - Proof: ${formatProofStatusForDisplay(item.proofStatus)}\n   - Why: ${item.reasons.join("; ")}\n   - Focus: ${item.suggestedReviewerFocus}${item.suggestedCommand ? `\n   - Suggested proof: ${formatVerifyCommandForDisplay(item.suggestedCommand)}` : ""}`
    )
    .join("\n");
}

function renderRequiredProof(contract: ProjectReviewContractEvaluation | undefined): string {
  if (!contract) return "No project review contract configured.";
  if (!contract.enabled) return "Project review contract disabled.";
  if (contract.requirements.length === 0) {
    return "No project review contract requirements matched these changes.";
  }
  return contract.requirements.map(renderProjectRequirement).join("\n");
}

function renderProjectRequirement(requirement: ProjectReviewRequirementStatus): string {
  const details = formatProjectRequirementDetailsForDisplay(requirement)
    .map((line) => `\n   - ${line}`)
    .join("");
  return `- ${formatProjectRequirementStatusForDisplay(requirement.status)} - ${requirement.label}${details}`;
}

function renderRepoCalibration(calibration: ProofCalibration | undefined): string {
  if (!calibration) return "No repo calibration history loaded.";
  if (calibration.suggestions.length === 0) {
    return formatProofCalibrationSummaryForDisplay(calibration);
  }
  return [
    formatProofCalibrationSummaryForDisplay(calibration),
    ...calibration.suggestions.map(renderRepoCalibrationSuggestion)
  ].join("\n");
}

function renderRepoCalibrationSuggestion(suggestion: ProofCalibrationSuggestion): string {
  const details = formatProofCalibrationDetailsForDisplay(suggestion)
    .map((line) => `\n   - ${line}`)
    .join("");
  return `- ${formatProofCalibrationStatusForDisplay(suggestion.status)} - ${suggestion.category}${details}`;
}

function renderProofFreshnessSection(freshness: ProofFreshnessAttribution | undefined): string {
  const lines = formatProofFreshnessAttributionForDisplay(freshness);
  if (lines.length === 0) return "";
  return `## Proof Freshness\n${lines.map((line) => `- ${line}`).join("\n")}\n`;
}

function renderReviewContract(
  contract: ReviewContract | undefined,
  suppressReviewPathNextAction = false
): string {
  if (!contract || contract.claims.length === 0) return "No review contract claims recorded.";
  const reviewPath = formatReviewContractReviewPathForDisplay(contract, {
    includeNextAction: !suppressReviewPathNextAction
  });
  const claims = contract.claims
    .map((claim) => {
      const proofReferences = formatReviewContractProofReferencesForDisplay(claim);
      const proofReferenceLine = proofReferences ? `\n   - ${proofReferences}` : "";
      const command = claim.suggestedCommand
        ? `\n   - Suggested proof: ${formatVerifyCommandForDisplay(claim.suggestedCommand)}`
        : "";
      return `- ${formatReviewContractStatusForDisplay(claim.status)} - ${claim.text}${proofReferenceLine}${command}`;
    })
    .join("\n");
  return [reviewPath, claims].filter(Boolean).join("\n\n");
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
  const nextAction = formatResumeNextAction(readiness.nextAction, readiness, openFirstArtifact);
  return `${readiness.label}
- Reason: ${compactCommandInText(readiness.reason, command)}
${openFirst}- Next action: ${compactCommandInText(nextAction, command)}`;
}

function renderNextRecommendedAction(
  nextAction: string,
  openFirstArtifact: string | undefined
): string {
  if (!openFirstArtifact) return nextAction;
  if (nextAction === readyHandoffNextAction) return `Open first: ${openFirstArtifact}`;
  return `Open first: ${openFirstArtifact}
${nextAction}`;
}

function formatResumeNextAction(
  nextAction: string,
  readiness: ReviewReadinessDecision,
  openFirstArtifact: string | undefined
): string {
  if (
    readiness.state === "ready_for_review" &&
    openFirstArtifact &&
    nextAction === readyHandoffNextAction
  ) {
    return "Open the existing local review artifact before continuing.";
  }

  return nextAction;
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
