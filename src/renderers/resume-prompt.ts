import {
  compactCommandInText,
  collectSuggestedCommandsForDisplay,
  escapeMarkdownBlockForDisplay,
  escapeMarkdownTextForDisplay,
  escapeHtmlForDisplay,
  formatCommandForDisplay,
  formatProjectRequirementDetailsForDisplay,
  formatProjectRequirementStatusForDisplay,
  formatProofCalibrationDetailsForDisplay,
  formatProofCalibrationStatusForDisplay,
  formatProofCalibrationSummaryForDisplay,
  formatProofFreshnessAttributionForDisplay,
  formatProofStatusForDisplay,
  formatReviewReceiptForDisplay,
  formatReviewQueueForDisplay,
  formatReviewRoutesForDisplay,
  formatReviewContractProofReferencesForDisplay,
  formatReviewContractReviewPathForDisplay,
  formatReviewContractStatusForDisplay,
  formatTrustDeltaForDisplay,
  formatVerifyCommandForDisplay
} from "../core/output.js";
import { formatBaseframeResultForMarkdown } from "../core/baseframe.js";
import type {
  AgentFlightResultV1,
  ProofGap,
  ProofCalibration,
  ProofCalibrationSuggestion,
  ProofFreshnessAttribution,
  ProjectReviewContractEvaluation,
  ProjectReviewRequirementStatus,
  ReviewContract,
  ReviewFocusItem,
  ReviewReceiptEvaluation,
  ReviewQueueItem,
  ReviewRoutes,
  ReviewReadinessDecision,
  RiskLevel,
  TrustDelta
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
  reviewFocusTotal?: number | undefined;
  projectReviewContract?: ProjectReviewContractEvaluation | undefined;
  calibration?: ProofCalibration | undefined;
  reviewReceipt?: ReviewReceiptEvaluation | undefined;
  trustDelta?: TrustDelta | undefined;
  reviewQueue?: ReviewQueueItem[] | undefined;
  reviewRoutes?: ReviewRoutes | undefined;
  proofFreshness?: ProofFreshnessAttribution | undefined;
  reviewContract?: ReviewContract | undefined;
  proofGaps?: ProofGap[] | undefined;
  readiness?: ReviewReadinessDecision | undefined;
  baseframeResult?: AgentFlightResultV1 | undefined;
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
${escapeMarkdownTextForDisplay(input.task)}

## Current State
- Session: ${escapeMarkdownTextForDisplay(input.sessionId)}
- Git branch: ${escapeMarkdownTextForDisplay(input.branch ?? "unknown")}
- Risk level: ${input.riskLevel}

## Changed Files
${renderChangedFileList(input.changedFiles)}

## Risks
${renderList(input.riskReasons, "No specific risks detected yet.")}

${renderBaseframeIntegration(input)}

## Latest Snapshot
${escapeMarkdownTextForDisplay(input.latestSnapshotNote ?? "No snapshot recorded.")}

## Verification State
${renderVerificationState(input)}

## Review Focus
${renderReviewFocus(input.reviewFocus ?? [], input.reviewFocusTotal)}

## Trust Delta
${renderTrustDelta(input.trustDelta)}

## Review Queue
${renderReviewQueue(input.reviewQueue)}

## Review Routing
${renderReviewRouting(input.reviewRoutes)}

${renderFullSuggestedCommands(input)}

## Review Receipt
${renderReviewReceipt(input.reviewReceipt)}

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
  return items.length
    ? items.map((item) => `- ${escapeMarkdownTextForDisplay(item)}`).join("\n")
    : empty;
}

function renderBaseframeIntegration(input: ResumePromptInput): string {
  return input.baseframeResult
    ? `${formatBaseframeResultForMarkdown(input.baseframeResult)}\n`
    : "";
}

function renderChangedFileList(files: string[]): string {
  if (files.length === 0) return "No changed files detected.";
  const visibleFiles = files.slice(0, 80);
  const rows = visibleFiles.map((file) => `- ${escapeMarkdownTextForDisplay(file)}`);
  const remaining = files.length - visibleFiles.length;
  if (remaining > 0) rows.push(`- ${remaining} more changed files in replay/status JSON.`);
  return rows.join("\n");
}

function renderReviewFocus(items: ReviewFocusItem[], total = items.length): string {
  if (items.length === 0) return "No review focus recorded.";
  const rows = items
    .map(
      (item) =>
        `${item.rank}. ${escapeMarkdownTextForDisplay(item.file)}\n   - Proof: ${md(formatProofStatusForDisplay(item.proofStatus))}\n   - Why: ${escapeMarkdownTextForDisplay(item.reasons.join("; "))}\n   - Focus: ${escapeMarkdownTextForDisplay(item.suggestedReviewerFocus)}${item.suggestedCommand ? `\n   - Suggested proof: ${md(formatVerifyCommandForDisplay(item.suggestedCommand))}` : ""}`
    )
    .join("\n");
  const remaining = Math.max(0, total - items.length);
  return remaining > 0
    ? `${rows}\n- ${remaining} more review focus ${remaining === 1 ? "file" : "files"} in report/replay.`
    : rows;
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
    .map((line) => `\n   - ${md(line)}`)
    .join("");
  return `- ${md(formatProjectRequirementStatusForDisplay(requirement.status))} - ${md(requirement.label)}${details}`;
}

function renderRepoCalibration(calibration: ProofCalibration | undefined): string {
  if (!calibration) return "No repo calibration history loaded.";
  if (calibration.suggestions.length === 0) {
    return md(formatProofCalibrationSummaryForDisplay(calibration));
  }
  return [
    md(formatProofCalibrationSummaryForDisplay(calibration)),
    ...calibration.suggestions.map(renderRepoCalibrationSuggestion)
  ].join("\n");
}

function renderRepoCalibrationSuggestion(suggestion: ProofCalibrationSuggestion): string {
  const details = formatProofCalibrationDetailsForDisplay(suggestion)
    .map((line) => `\n   - ${md(line)}`)
    .join("");
  return `- ${md(formatProofCalibrationStatusForDisplay(suggestion.status))} - ${md(suggestion.category)}${details}`;
}

function renderProofFreshnessSection(freshness: ProofFreshnessAttribution | undefined): string {
  const lines = formatProofFreshnessAttributionForDisplay(freshness);
  if (lines.length === 0) return "";
  return `## Proof Freshness\n${lines.map((line) => `- ${md(line)}`).join("\n")}\n`;
}

function renderTrustDelta(delta: TrustDelta | undefined): string {
  return md(formatTrustDeltaForDisplay(delta));
}

function renderReviewQueue(queue: ReviewQueueItem[] | undefined): string {
  return md(formatReviewQueueForDisplay(queue));
}

function renderReviewRouting(routes: ReviewRoutes | undefined): string {
  return md(formatReviewRoutesForDisplay(routes));
}

function renderFullSuggestedCommands(input: ResumePromptInput): string {
  const commands = collectCompactSuggestedCommands(input);
  if (commands.length === 0) return "";
  return `## Full Suggested Commands\n${commands.map(renderFullSuggestedCommand).join("\n")}\n`;
}

function collectCompactSuggestedCommands(input: ResumePromptInput): string[] {
  return [
    ...new Set(
      collectSuggestedCommandsForDisplay({
        proofGaps: input.proofGaps,
        trustDelta: input.trustDelta,
        reviewQueue: input.reviewQueue,
        reviewRoutes: input.reviewRoutes,
        focus: input.reviewFocus,
        projectReviewContract: input.projectReviewContract,
        calibration: input.calibration,
        contract: input.reviewContract,
        readiness: input.readiness
      })
    )
  ].filter(isCompactCommand);
}

function isCompactCommand(command: string): boolean {
  return formatCommandForDisplay(command) !== command.trim().replace(/\s+/g, " ");
}

function renderFullSuggestedCommand(command: string): string {
  return `<details>
<summary>${escapeHtmlForDisplay(formatVerifyCommandForDisplay(command))}</summary>

${renderCommandFence(`agentflight verify -- ${command}`)}
</details>`;
}

function renderCommandFence(command: string): string {
  const longestBacktickRun = Math.max(
    2,
    ...Array.from(command.matchAll(/`+/g), (match) => match[0].length)
  );
  const fence = "`".repeat(longestBacktickRun + 1);
  return `${fence}bash\n${command}\n${fence}`;
}

function renderReviewReceipt(receipt: ReviewReceiptEvaluation | undefined): string {
  return md(formatReviewReceiptForDisplay(receipt));
}

function renderReviewContract(
  contract: ReviewContract | undefined,
  suppressReviewPathNextAction = false
): string {
  if (!contract || contract.claims.length === 0) return "No review contract claims recorded.";
  const reviewPath = md(
    formatReviewContractReviewPathForDisplay(contract, {
      includeNextAction: !suppressReviewPathNextAction
    })
  );
  const claims = contract.claims
    .map((claim) => {
      const proofReferences = md(formatReviewContractProofReferencesForDisplay(claim));
      const proofReferenceLine = proofReferences ? `\n   - ${proofReferences}` : "";
      const command = claim.suggestedCommand
        ? `\n   - Suggested proof: ${md(formatVerifyCommandForDisplay(claim.suggestedCommand))}`
        : "";
      return `- ${md(formatReviewContractStatusForDisplay(claim.status))} - ${escapeMarkdownTextForDisplay(claim.text)}${proofReferenceLine}${command}`;
    })
    .join("\n");
  return [reviewPath, claims].filter(Boolean).join("\n\n");
}

function renderVerificationState(input: ResumePromptInput): string {
  const state = md(input.verificationState ?? "No verification state recorded.");
  return input.verificationContext ? `${state}\n${md(input.verificationContext)}` : state;
}

function renderProofGaps(input: ResumePromptInput): string {
  if (input.proofGaps) {
    return input.proofGaps.length
      ? input.proofGaps
          .map(
            (gap) =>
              `- ${md(gap.severity)}: ${md(compactCommandInText(gap.message, gap.suggestedCommand))}${gap.suggestedCommand ? `\n  Suggested proof: ${md(formatVerifyCommandForDisplay(gap.suggestedCommand))}` : ""}`
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
  const openFirst = openFirstArtifact ? `- Open first: ${md(openFirstArtifact)}\n` : "";
  const nextAction = formatResumeNextAction(readiness.nextAction, readiness, openFirstArtifact);
  return `${md(readiness.label)}
- Reason: ${md(compactCommandInText(readiness.reason, command))}
${openFirst}- Next action: ${md(compactCommandInText(nextAction, command))}`;
}

function renderNextRecommendedAction(
  nextAction: string,
  openFirstArtifact: string | undefined
): string {
  if (!openFirstArtifact) return md(nextAction);
  if (nextAction === readyHandoffNextAction) return `Open first: ${md(openFirstArtifact)}`;
  return `Open first: ${md(openFirstArtifact)}
${md(nextAction)}`;
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

function md(value: string): string {
  return escapeMarkdownBlockForDisplay(value);
}
