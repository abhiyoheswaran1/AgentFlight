import { readOpenFirstArtifact } from "../core/artifacts.js";
import { listChangedFiles } from "../core/git.js";
import { filterChangedFiles } from "../core/changed-files.js";
import { loadConfig } from "../core/config.js";
import { pathExists, readJsonFile } from "../core/fs-safe.js";
import {
  compactCommandInText,
  formatCommandForDisplay,
  formatProjectRequirementDetailsForDisplay,
  formatProjectReviewDecisionForDisplay,
  formatProjectReviewDecisionReasonsForDisplay,
  formatProofCalibrationDetailsForDisplay,
  formatProofCalibrationStatusForDisplay,
  formatProofCalibrationSummaryForDisplay,
  formatProofFreshnessAttributionForDisplay,
  formatProjectRequirementStatusForDisplay,
  formatProofStatusForDisplay,
  formatReviewContractReviewPathForDisplay,
  formatReviewContractStatusForDisplay,
  formatVerificationCountLine,
  formatVerificationFailureContext,
  formatVerifyCommandForDisplay
} from "../core/output.js";
import { resolveAgentFlightPaths } from "../core/paths.js";
import { buildProofSnapshot } from "../core/proof-snapshot.js";
import { loadProofCalibrationHistory } from "../core/proof-calibration.js";
import { resolveProjectReviewContractConfig } from "../core/project-review-contract.js";
import { analyzeRisk } from "../core/risk.js";
import { buildReviewIntelligence } from "../core/review-intelligence.js";
import { getLatestRecordedReviewSummary, getLatestSessionEvent } from "../core/session.js";
import { buildVerificationSummary } from "../core/verification.js";
import type {
  AgentFlightSession,
  ProofGap,
  ProjectReviewContractEvaluation,
  ProjectReviewRequirementStatus,
  ReviewContract,
  ReviewFocusItem,
  ProofCalibration,
  ProofCalibrationSuggestion,
  ReviewReadinessState,
  RiskCategorySummary,
  SessionEvent,
  VerificationRun
} from "../types/index.js";

const STATUS_VERIFICATION_RUN_LIMIT = 8;
const readyHandoffNextAction = "Run agentflight handoff to generate the local review packet.";

export interface StatusCommandOptions {
  repoRoot: string;
  now?: Date | undefined;
  changedFiles?: string[] | undefined;
  format?: string | undefined;
}

export interface StatusCommandResult {
  output: string;
}

export async function runStatusCommand(
  options: StatusCommandOptions
): Promise<StatusCommandResult> {
  const format = normalizeStatusFormat(options.format);
  const session = await readCurrentSession(options.repoRoot);
  const now = options.now ?? new Date();
  const config = await loadConfig(options.repoRoot);
  const changedFiles = filterChangedFiles(
    options.changedFiles ?? (await listChangedFiles(options.repoRoot)),
    { ignore: config?.changedFileFilters?.ignore }
  );
  const risk = analyzeRisk(changedFiles);
  const duration = formatDuration(session.startedAt, now);
  const verification = buildVerificationSummary(session, {
    changedFilesCount: changedFiles.length,
    riskLevel: risk.level
  });
  const currentProofSnapshot = await buildProofSnapshot({
    repoRoot: options.repoRoot,
    changedFiles,
    capturedAt: now.toISOString(),
    gitCommit: session.git.commit ?? null
  });
  const calibrationHistory = await loadProofCalibrationHistory(options.repoRoot, {
    currentSessionId: session.id
  });
  const review = buildReviewIntelligence({
    changedFiles,
    risk,
    session,
    currentProofSnapshot,
    historicalSessions: calibrationHistory.sessions,
    projectReviewContract: resolveProjectReviewContractConfig(config?.projectReviewContract)
  });
  const latestSnapshot = getLatestSessionEvent(session, "snapshot_created");
  const readinessReason = compactCommandInText(
    review.readiness.reason,
    review.readiness.suggestedCommand
  );
  const nextAction = compactCommandInText(
    review.readiness.nextAction,
    review.readiness.suggestedCommand
  );
  const statusTextNextAction = await buildStatusTextNextAction({
    repoRoot: options.repoRoot,
    session,
    readinessState: review.readiness.state,
    nextAction
  });
  const verificationFailureContext = formatVerificationFailureContext(verification);

  if (format === "json") {
    return {
      output: `${JSON.stringify(
        buildStatusJson({
          session,
          duration,
          changedFiles,
          risk,
          verification,
          review,
          latestSnapshot,
          readinessReason,
          nextAction
        }),
        null,
        2
      )}\n`
    };
  }

  return {
    output: `AgentFlight status

Task:
${session.task.title}

Session duration:
${duration}

Changed files:
${changedFiles.length}

Changed areas:
${formatChangedAreas(risk.categories)}

Risk: ${risk.level}
${risk.reasons.map((reason) => `- ${reason}`).join("\n")}

Verification Evidence:
${formatVerificationCountLine(verification)}
${verificationFailureContext ? `${verificationFailureContext}\n` : ""}${formatVerificationRuns(
      verification.runs,
      {
        tuckDetails: changedFiles.length === 0 && verification.unresolvedFailed === 0
      }
    )}

Review first:
${formatReviewFocus(review.focus.slice(0, 5))}

Decision:
${formatProjectReviewDecisionForDisplay(review.projectReviewContract, review.readiness)}

Why:
${formatProjectReviewDecisionReasonsForDisplay(review.projectReviewContract)
  .map((reason) => `- ${reason}`)
  .join("\n")}

Required proof:
${formatProjectReviewContract(review.projectReviewContract)}
${formatProofFreshnessSection(review.proofFreshness)}
Repo calibration:
${formatProofCalibration(review.calibration)}

Review Contract:
${formatReviewContract(review.contract, 5)}

Proof gaps:
${formatProofGaps(review.proofGaps)}

Latest snapshot:
${formatLatestSnapshot(latestSnapshot)}

Readiness: ${review.readiness.label}
Reason: ${readinessReason}

Next action:
${statusTextNextAction}
`
  };
}

type StatusFormat = "text" | "json";

function normalizeStatusFormat(format: string | undefined): StatusFormat {
  if (!format || format === "text") return "text";
  if (format === "json") return "json";
  throw new Error(`Unsupported status format "${format}". Use "text" or "json".`);
}

function buildStatusJson(input: {
  session: AgentFlightSession;
  duration: string;
  changedFiles: string[];
  risk: ReturnType<typeof analyzeRisk>;
  verification: ReturnType<typeof buildVerificationSummary>;
  review: ReturnType<typeof buildReviewIntelligence>;
  latestSnapshot: SessionEvent | null;
  readinessReason: string;
  nextAction: string;
}): Record<string, unknown> {
  return {
    task: input.session.task,
    session: {
      id: input.session.id,
      startedAt: input.session.startedAt,
      duration: input.duration
    },
    changedFiles: input.changedFiles,
    changedFileCount: input.changedFiles.length,
    changedAreas: input.risk.categories,
    risk: input.risk,
    verification: {
      passed: input.verification.passed,
      failed: input.verification.failed,
      unresolvedFailed: input.verification.unresolvedFailed,
      resolvedFailed: input.verification.resolvedFailed,
      runs: input.verification.runs
    },
    review: {
      focus: input.review.focus,
      projectReviewContract: input.review.projectReviewContract,
      proofGaps: input.review.proofGaps,
      readiness: input.review.readiness,
      contract: input.review.contract,
      calibration: input.review.calibration,
      proofFreshness: input.review.proofFreshness
    },
    latestSnapshot: formatLatestSnapshotJson(input.latestSnapshot),
    reason: input.readinessReason,
    nextAction: input.nextAction
  };
}

function formatLatestSnapshotJson(event: SessionEvent | null): Record<string, unknown> | null {
  if (!event) return null;
  const risk = readMetadataObject(event, "risk");
  return {
    timestamp: event.timestamp,
    note: event.message ?? null,
    riskLevel: typeof risk.level === "string" ? risk.level : "unknown",
    changedFiles: typeof risk.changedFiles === "number" ? risk.changedFiles : null
  };
}

function formatLatestSnapshot(event: SessionEvent | null): string {
  if (!event) return "- No snapshots recorded.";

  const risk = readMetadataObject(event, "risk");
  const changedFiles = typeof risk.changedFiles === "number" ? risk.changedFiles : "unknown";
  const riskLevel = typeof risk.level === "string" ? risk.level : "unknown";
  const note = event.message ? `\n- Note: ${event.message}` : "";

  return `- ${event.timestamp}${note}
- Risk: ${riskLevel}
- Changed files: ${changedFiles}`;
}

function formatCleanStatusNextAction(openFirst: string | null): string {
  const openLine = openFirst
    ? `Open first: ${openFirst}`
    : "Run agentflight history --limit 1 to reopen the latest local artifacts.";
  return `${openLine}
Start a new AgentFlight session when you begin the next task.`;
}

async function buildStatusTextNextAction(input: {
  repoRoot: string;
  session: AgentFlightSession;
  readinessState: ReviewReadinessState;
  nextAction: string;
}): Promise<string> {
  const openFirstReadiness = statusOpenFirstReadiness(input.readinessState, input.session);
  if (openFirstReadiness === undefined) return input.nextAction;

  const openFirst = await readOpenFirstArtifact(
    input.repoRoot,
    input.session.id,
    openFirstReadiness
  );
  if (input.readinessState === "clean_worktree") return formatCleanStatusNextAction(openFirst);
  return formatReadyStatusNextAction(input.nextAction, openFirst);
}

function statusOpenFirstReadiness(
  readinessState: ReviewReadinessState,
  session: AgentFlightSession
): ReviewReadinessState | undefined {
  if (readinessState === "clean_worktree") return getLatestRecordedReviewSummary(session)?.state;
  if (readinessState === "ready_for_review") return readinessState;
  return undefined;
}

function formatReadyStatusNextAction(nextAction: string, openFirst: string | null): string {
  if (openFirst && nextAction === readyHandoffNextAction) return `Open first: ${openFirst}`;
  return nextAction;
}

function readMetadataObject(event: SessionEvent, key: string): Record<string, unknown> {
  const value = event.metadata?.[key];
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function readCurrentSession(repoRoot: string): Promise<AgentFlightSession> {
  const currentSessionPath = resolveAgentFlightPaths(repoRoot).currentSession;

  if (!(await pathExists(currentSessionPath))) {
    throw new Error(
      'No active AgentFlight session. Run agentflight start --task "Describe the task" first.'
    );
  }

  return readJsonFile<AgentFlightSession>(currentSessionPath);
}

function formatDuration(startedAt: string, now: Date): string {
  const elapsedMs = Math.max(0, now.getTime() - new Date(startedAt).getTime());
  const minutes = Math.floor(elapsedMs / 60_000);
  if (minutes < 1) return "less than a minute";
  if (minutes === 1) return "1 minute";
  return `${minutes} minutes`;
}

function formatChangedAreas(categories: RiskCategorySummary[]): string {
  if (categories.length === 0) return "- none";
  return categories
    .map((summary) => `- ${summary.category}: ${summary.files.join(", ")}`)
    .join("\n");
}

function formatVerificationRuns(
  runs: VerificationRun[] | undefined,
  options: { tuckDetails?: boolean } = {}
): string {
  if (!runs || runs.length === 0) return "- No verification runs recorded.";
  if (options.tuckDetails) return formatTuckedVerificationRuns();

  return formatVisibleVerificationRuns(runs);
}

function formatTuckedVerificationRuns(): string {
  return "- Verification run details are tucked because the worktree is clean; open handoff/report/replay or JSON output for the full ledger.";
}

function formatVisibleVerificationRuns(runs: VerificationRun[]): string {
  const displayRuns =
    runs.length > STATUS_VERIFICATION_RUN_LIMIT ? runs.slice(-STATUS_VERIFICATION_RUN_LIMIT) : runs;
  const runLines = displayRuns.map(formatVerificationRunLine).join("\n");

  if (displayRuns.length === runs.length) return runLines;

  return `${formatOmittedVerificationRunNote(runs.length, displayRuns.length)}
${runLines}`;
}

function formatVerificationRunLine(run: VerificationRun): string {
  return `- ${run.status}: ${formatCommandForDisplay(run.command)} (exit ${run.exitCode ?? "unknown"}, ${run.durationMs}ms)`;
}

function formatOmittedVerificationRunNote(totalRuns: number, shownRuns: number): string {
  const omitted = totalRuns - shownRuns;
  return `- Showing latest ${shownRuns} of ${totalRuns} verification runs.
- ${formatOmittedVerificationRunCount(omitted)} remain in report/replay and JSON output.`;
}

function formatOmittedVerificationRunCount(omitted: number): string {
  const runNoun = omitted === 1 ? "run" : "runs";
  return `${omitted} earlier verification ${runNoun}`;
}

function formatReviewFocus(items: ReviewFocusItem[]): string {
  if (items.length === 0) return "- No changed files to review.";
  return items
    .map(
      (item) =>
        `${item.rank}. ${item.file}\n   Proof: ${formatProofStatusForDisplay(item.proofStatus)}\n   Why: ${item.reasons.join("; ")}\n   Focus: ${item.suggestedReviewerFocus}${item.suggestedCommand ? `\n   Suggested proof: ${formatVerifyCommandForDisplay(item.suggestedCommand)}` : ""}`
    )
    .join("\n");
}

function formatProjectReviewContract(
  contract: ProjectReviewContractEvaluation | undefined
): string {
  if (!contract) return "- No project review contract configured.";
  if (!contract.enabled) return "- Project review contract disabled.";
  if (contract.requirements.length === 0) {
    return "- No project review contract requirements matched these changes.";
  }
  return contract.requirements.map(formatProjectRequirement).join("\n");
}

function formatProjectRequirement(requirement: ProjectReviewRequirementStatus): string {
  const details = formatProjectRequirementDetailsForDisplay(requirement)
    .map((line) => `\n   ${line}`)
    .join("");
  return `- ${formatProjectRequirementStatusForDisplay(requirement.status)} - ${requirement.label}${details}`;
}

function formatProofCalibration(calibration: ProofCalibration | undefined): string {
  if (!calibration) return "- No repo calibration history loaded.";
  if (calibration.suggestions.length === 0) {
    return `- ${formatProofCalibrationSummaryForDisplay(calibration)}`;
  }
  return [
    `- ${formatProofCalibrationSummaryForDisplay(calibration)}`,
    ...calibration.suggestions.map(formatProofCalibrationSuggestion)
  ].join("\n");
}

function formatProofCalibrationSuggestion(suggestion: ProofCalibrationSuggestion): string {
  const details = formatProofCalibrationDetailsForDisplay(suggestion)
    .map((line) => `\n   ${line}`)
    .join("");
  return `- ${formatProofCalibrationStatusForDisplay(suggestion.status)} - ${suggestion.category}${details}`;
}

function formatProofFreshnessSection(
  freshness: ReturnType<typeof buildReviewIntelligence>["proofFreshness"]
): string {
  const lines = formatProofFreshnessAttributionForDisplay(freshness);
  if (lines.length === 0) return "";
  return `\nProof freshness:\n${lines.map((line) => `- ${line}`).join("\n")}\n`;
}

function formatReviewContract(contract: ReviewContract | undefined, limit: number): string {
  if (!contract || contract.claims.length === 0) return "- No review contract claims recorded.";
  const visibleClaims = contract.claims.slice(0, limit);
  const rows = visibleClaims.map(
    (claim) => `- ${formatReviewContractStatusForDisplay(claim.status)} - ${claim.text}`
  );
  const remaining = contract.claims.length - visibleClaims.length;
  if (remaining > 0) {
    rows.push(`- ${remaining} more claim${remaining === 1 ? "" : "s"} in report/replay.`);
  }
  return [formatReviewContractReviewPathForDisplay(contract, { includeNextAction: false }), ...rows]
    .filter(Boolean)
    .join("\n");
}

function formatProofGaps(gaps: ProofGap[]): string {
  if (gaps.length === 0) return "- none";
  return gaps
    .map(
      (gap) =>
        `- ${gap.severity}: ${compactCommandInText(gap.message, gap.suggestedCommand)}${gap.suggestedCommand ? `\n  Suggested proof: ${formatVerifyCommandForDisplay(gap.suggestedCommand)}` : ""}`
    )
    .join("\n");
}
