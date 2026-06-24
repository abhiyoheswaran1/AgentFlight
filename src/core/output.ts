import type {
  ProofFreshnessAttribution,
  ProofCalibration,
  ProofCalibrationSuggestion,
  ReviewContract,
  ReviewContractClaim,
  ReviewContractClaimStatus,
  ReviewContractProofReference,
  ProjectReviewRequirementState,
  ReviewProofStatus,
  ToolAdapterResult
} from "../types/index.js";
import { formatRepoRelativePath } from "./paths.js";

export interface CommandOutput {
  output: string;
}

export interface VerificationFailureCounts {
  passed: number;
  failed: number;
  unresolvedFailed: number;
  resolvedFailed: number;
}

const DEFAULT_COMMAND_DISPLAY_LENGTH = 96;
export const AGENTFLIGHT_PROJECT_CONFIG_GUIDANCE =
  ".agentflight/config.json is project config. Review or commit it when shared AgentFlight defaults are useful.";
export const AGENTFLIGHT_RUNTIME_EVIDENCE_GUIDANCE =
  ".agentflight/sessions/, reports/, evidence/, current/ are local runtime evidence and are excluded from AgentFlight changed-file analysis.";
export const AGENTFLIGHT_GITIGNORE_GUIDANCE =
  ".agentflight/.gitignore keeps runtime evidence out of git while leaving config.json visible.";
export const PROJSCAN_MEMORY_FILTER_GUIDANCE =
  'If .projscan-memory/memory.json appears as generated tool state, add ".projscan-memory/**" to changedFileFilters.ignore in .agentflight/config.json.';

export function formatToolAvailability(label: string, available: boolean): string {
  return `${label}: ${available ? "available" : "unavailable"}`;
}

export function renderStatus(status: "ok" | "warning" | "error"): string {
  if (status === "ok") return "OK";
  if (status === "warning") return "Warning";
  return "Error";
}

export function formatCommandForDisplay(
  command: string,
  options: { maxLength?: number } = {}
): string {
  const maxLength = options.maxLength ?? DEFAULT_COMMAND_DISPLAY_LENGTH;
  const normalized = command.trim().replace(/\s+/g, " ");
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(1, maxLength - 1)).trimEnd()}…`;
}

export function formatVerifyCommandForDisplay(command: string): string {
  return `agentflight verify -- ${formatCommandForDisplay(command)}`;
}

export function compactCommandInText(text: string, command: string | undefined): string {
  if (!command) return text;
  return text.split(command).join(formatCommandForDisplay(command));
}

export function formatProofStatusForDisplay(status: ReviewProofStatus): string {
  const labels: Record<ReviewProofStatus, string> = {
    current: "current",
    stale: "stale",
    covered: "covered",
    missing: "missing",
    failed: "failed",
    not_required: "not required",
    unknown: "unknown"
  };
  return labels[status];
}

export function formatReviewContractStatusForDisplay(status: ReviewContractClaimStatus): string {
  const labels: Record<ReviewContractClaimStatus, string> = {
    supported: "supported",
    needs_review: "needs review",
    unsupported: "unsupported",
    failed: "failed",
    stale: "stale",
    not_testable: "not testable",
    unknown: "unknown"
  };
  return labels[status];
}

export function formatProjectRequirementStatusForDisplay(
  status: ProjectReviewRequirementState
): string {
  const labels: Record<ProjectReviewRequirementState, string> = {
    supported: "supported",
    needs_review: "needs review",
    missing: "missing",
    failed: "failed",
    stale: "stale",
    not_required: "not required",
    unknown: "unknown"
  };
  return labels[status];
}

interface ProjectContractDecisionInput {
  enabled: boolean;
  summary: {
    total: number;
    supported: number;
    needsReview: number;
    missing: number;
    failed: number;
    stale: number;
    manualReview: number;
  };
  requirements: unknown[];
}

export function formatProjectReviewDecisionForDisplay(
  contract: ProjectContractDecisionInput | undefined,
  readiness: { state?: string; label?: string } | undefined
): string {
  if (!contract?.enabled || contract.requirements.length === 0) {
    return readiness?.label ?? "No project review contract decision recorded.";
  }

  const rule = projectReviewDecisionRules.find((candidate) => candidate.matches(contract.summary));
  if (rule) return rule.text;
  if (readiness?.state === "ready_for_review")
    return "Ready for review with required proof satisfied.";
  return readiness?.label ?? "Project review contract evaluated.";
}

export function formatProjectReviewDecisionReasonsForDisplay(
  contract: ProjectContractDecisionInput | undefined
): string[] {
  if (!contract?.enabled) return ["Project review contract is disabled."];
  if (contract.requirements.length === 0) {
    return ["No project review contract requirements matched these changes."];
  }

  const summary = contract.summary;
  return [
    countReason(summary.supported, "required proof item", "is supported", "are supported"),
    countReason(summary.needsReview, "manual-review requirement", "remains", "remain"),
    countReason(summary.missing, "required proof item", "is missing", "are missing"),
    countReason(summary.failed, "required proof item", "has failed", "have failed"),
    countReason(summary.stale, "required proof item", "is stale", "are stale"),
    noOpenAutomatedProofReason(summary)
  ].filter((reason): reason is string => Boolean(reason));
}

interface ProjectRequirementDisplayInput {
  proofStatus: ReviewProofStatus;
  requiredProof: string[];
  manualReview: string[];
  relatedFiles: string[];
  matchReason?: string;
  proofReason?: string;
  satisfiedProof?: { kind: string; command: string };
  remainingReview?: string[];
  suggestedCommand?: string;
}

export function formatProjectRequirementDetailsForDisplay(
  requirement: ProjectRequirementDisplayInput
): string[] {
  return [
    optionalDisplayLine("Matched", requirement.matchReason),
    `Proof: ${formatProofStatusForDisplay(requirement.proofStatus)}`,
    optionalDisplayLine("Proof detail", requirement.proofReason),
    satisfiedProofLine(requirement.satisfiedProof),
    listDisplayLine("Accepted proof", requirement.requiredProof),
    listDisplayLine("Manual review", requirement.manualReview, "; "),
    listDisplayLine("Files", requirement.relatedFiles),
    ...remainingReviewLines(requirement),
    optionalDisplayLine(
      "Suggested proof",
      requirement.suggestedCommand
        ? formatVerifyCommandForDisplay(requirement.suggestedCommand)
        : undefined
    )
  ].filter((line): line is string => Boolean(line));
}

export function formatProofCalibrationStatusForDisplay(status: string): string {
  return status.replaceAll("_", "-");
}

export function formatProofCalibrationDetailsForDisplay(
  suggestion: Pick<
    ProofCalibrationSuggestion,
    "currentProof" | "historicalProof" | "suggestedCommand" | "similarReadySessions"
  >
): string[] {
  return [
    listDisplayLine("Current proof", suggestion.currentProof),
    listDisplayLine("Historical proof", suggestion.historicalProof),
    `Suggested proof: ${formatVerifyCommandForDisplay(suggestion.suggestedCommand)}`,
    `Based on: ${suggestion.similarReadySessions} similar ready handoff${suggestion.similarReadySessions === 1 ? "" : "s"}`
  ].filter((line): line is string => Boolean(line));
}

export function formatProofCalibrationSummaryForDisplay(
  calibration: Pick<
    ProofCalibration,
    "summary" | "source" | "scannedSessions" | "similarReadySessions"
  >
): string {
  return `${calibration.summary} Source: local session history; scanned ${calibration.scannedSessions}, matched ${calibration.similarReadySessions}.`;
}

export function formatProofFreshnessAttributionForDisplay(
  freshness: ProofFreshnessDisplayInput | undefined
): string[] {
  if (!freshness || freshness.state !== "stale") return [];
  return [
    freshness.reason,
    freshnessCategoryLine(
      "Proof-required stale files",
      freshness.staleCategories.filter((entry) => entry.proofRequired)
    ),
    freshnessCategoryLine(
      "Manual-review stale files",
      freshness.staleCategories.filter((entry) => !entry.proofRequired)
    )
  ].filter((line): line is string => Boolean(line));
}

interface ProofFreshnessDisplayInput {
  state: ProofFreshnessAttribution["state"];
  reason: string;
  staleCategories: Array<{
    category: string;
    files: string[];
    proofRequired: boolean;
  }>;
}

function freshnessCategoryLine(
  label: string,
  categories: ProofFreshnessDisplayInput["staleCategories"]
): string | undefined {
  if (categories.length === 0) return undefined;
  return `${label}: ${categories
    .map((entry) => `${entry.category} (${entry.files.join(", ")})`)
    .join("; ")}`;
}

const projectReviewDecisionRules: Array<{
  matches: (summary: ProjectContractDecisionInput["summary"]) => boolean;
  text: string;
}> = [
  {
    matches: (summary) => summary.failed > 0,
    text: "Not ready to trust yet. Failed required proof remains."
  },
  {
    matches: (summary) => summary.stale > 0,
    text: "Not ready to trust yet. Required proof is stale."
  },
  {
    matches: (summary) => summary.missing > 0,
    text: "Not ready to trust yet. Required proof is missing."
  },
  {
    matches: (summary) => summary.needsReview > 0 || summary.manualReview > 0,
    text: "Ready for review; manual checks remain before trusting the change."
  }
];

function countReason(
  count: number,
  singularNoun: string,
  singularVerb: string,
  pluralVerb: string
): string | undefined {
  if (count <= 0) return undefined;
  const noun = count === 1 ? singularNoun : `${singularNoun}s`;
  const verb = count === 1 ? singularVerb : pluralVerb;
  return `${count} ${noun} ${verb}.`;
}

function noOpenAutomatedProofReason(
  summary: ProjectContractDecisionInput["summary"]
): string | undefined {
  return summary.failed === 0 && summary.stale === 0 && summary.missing === 0
    ? "No failed, stale, or missing required proof."
    : undefined;
}

function optionalDisplayLine(label: string, value: string | undefined): string | undefined {
  return value ? `${label}: ${value}` : undefined;
}

function listDisplayLine(label: string, values: string[], separator = ", "): string | undefined {
  return values.length > 0 ? `${label}: ${values.join(separator)}` : undefined;
}

function satisfiedProofLine(
  proof: ProjectRequirementDisplayInput["satisfiedProof"]
): string | undefined {
  if (!proof) return undefined;
  return `Satisfied by: ${proof.kind} proof (${formatCommandForDisplay(proof.command)})`;
}

function remainingReviewLines(requirement: ProjectRequirementDisplayInput): string[] {
  return (requirement.remainingReview ?? []).map(
    (remaining) => `Remaining: ${compactCommandInText(remaining, requirement.suggestedCommand)}`
  );
}

export function formatReviewContractReviewPathForDisplay(
  contract: ReviewContract | undefined,
  options: { includeNextAction?: boolean } = {}
): string {
  if (!contract?.reviewPath) return "";
  const lines = [`Review path: ${contract.reviewPath.summary}`];
  if (options.includeNextAction ?? true) {
    lines.push(`Next action: ${contract.reviewPath.nextAction}`);
  }
  return lines.join("\n");
}

export function getReviewContractPathClaims(
  contract: ReviewContract | undefined,
  limit = 5
): ReviewContractClaim[] {
  if (!contract) return [];
  const claimsById = new Map(contract.claims.map((claim) => [claim.id, claim]));
  const pathClaims = (contract.reviewPath?.inspectClaimIds ?? [])
    .map((id) => claimsById.get(id))
    .filter((claim): claim is ReviewContractClaim => Boolean(claim));
  if (pathClaims.length > 0) return pathClaims.slice(0, limit);
  return contract.claims.slice(0, limit);
}

export function formatReviewContractProofReferencesForDisplay(
  claim: Pick<ReviewContractClaim, "proofReferences">
): string {
  const references = claim.proofReferences ?? [];
  if (references.length === 0) return "";
  return `Proof refs: ${references.map(formatReviewContractProofReferenceLabelForDisplay).join("; ")}`;
}

export function formatReviewContractProofReferenceLabelForDisplay(
  reference: ReviewContractProofReference
): string {
  const suggestedProofPrefix = "Suggested proof: ";
  if (reference.kind === "suggested_command" && reference.label.startsWith(suggestedProofPrefix)) {
    return `${suggestedProofPrefix}${formatCommandForDisplay(reference.label.slice(suggestedProofPrefix.length))}`;
  }
  return reference.label;
}

export function formatVerificationCountLine(counts: VerificationFailureCounts): string {
  const context =
    counts.failed > 0
      ? ` (${counts.unresolvedFailed} unresolved, ${counts.resolvedFailed} resolved)`
      : "";
  return `${counts.passed} passed, ${counts.failed} failed${context}`;
}

export function formatVerificationFailureContext(counts: VerificationFailureCounts): string {
  if (counts.failed === 0) return "";

  const lines: string[] = [];
  if (counts.unresolvedFailed > 0) {
    lines.push(`Unresolved failed runs: ${counts.unresolvedFailed}.`);
  }
  if (counts.resolvedFailed > 0) {
    lines.push(`Historical failed runs: ${counts.resolvedFailed} resolved by later passing runs.`);
  }
  return lines.join(" ");
}

export function formatAgentFlightGeneratedFileList(repoRoot: string, files: string[]): string {
  if (files.length === 0) return "- none";
  return files
    .map((file) => formatRepoRelativePath(repoRoot, file))
    .sort(compareAgentFlightGeneratedFilePaths)
    .map((file) => `- ${file}`)
    .join("\n");
}

export function formatAgentFlightLocalFilesGuidance(): string {
  return [
    AGENTFLIGHT_PROJECT_CONFIG_GUIDANCE,
    AGENTFLIGHT_RUNTIME_EVIDENCE_GUIDANCE,
    AGENTFLIGHT_GITIGNORE_GUIDANCE,
    PROJSCAN_MEMORY_FILTER_GUIDANCE
  ].join("\n");
}

function compareAgentFlightGeneratedFilePaths(left: string, right: string): number {
  return (
    agentFlightGeneratedFilePathPriority(left) - agentFlightGeneratedFilePathPriority(right) ||
    left.localeCompare(right)
  );
}

function agentFlightGeneratedFilePathPriority(file: string): number {
  const priorities = new Map([
    [".agentflight/config.json", 0],
    [".agentflight/.gitignore", 1]
  ]);
  return priorities.get(file) ?? 10;
}

export function formatToolForReport(label: string, result: ToolAdapterResult): string {
  const status = result.available ? "available" : "unavailable";
  const version = result.version ? ` ${result.version}` : "";
  const stateDetails = summarizeToolState(label, result);
  const warnings = result.warnings.map((warning) => summarizeToolWarning(label, warning));
  const details = [...stateDetails, ...warnings];
  const detailText = details.length ? ` (${details.join("; ")})` : "";
  return `${status}${version}${detailText}`;
}

function summarizeToolState(label: string, result: ToolAdapterResult): string[] {
  if (label !== "AgentLoopKit" || !result.available || result.taskLinked === undefined) {
    return [];
  }

  return [result.taskLinked ? "active task linked" : "no active task linked"];
}

function summarizeToolWarning(label: string, warning: string): string {
  if (label === "ProjScan") {
    if (warning.startsWith("ProjScan baseline skipped:")) {
      return "ProjScan baseline skipped; run projscan start for details.";
    }
    if (warning.startsWith("ProjScan unavailable:")) {
      return "ProjScan unavailable; run npx projscan@latest doctor for details.";
    }
  }

  if (label === "AgentLoopKit") {
    if (warning.startsWith("AgentLoopKit doctor reported issues:")) {
      return "AgentLoopKit doctor reported issues; run agentloopkit doctor for details.";
    }
    if (warning.startsWith("AgentLoopKit unavailable:")) {
      return "AgentLoopKit unavailable; run npx agentloopkit@latest doctor for details.";
    }
    if (
      warning.startsWith("AgentLoopKit task creation failed:") ||
      warning.startsWith("AgentLoopKit task link check failed:")
    ) {
      return "AgentLoopKit task link check needs attention; run agentloopkit status for details.";
    }
  }

  return formatCommandForDisplay(warning, { maxLength: 180 });
}
