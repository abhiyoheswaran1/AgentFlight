import { copyFile } from "node:fs/promises";
import { dirname } from "node:path";
import { ensureDir, pathExists, writeTextFileSafe } from "../core/fs-safe.js";
import {
  compactCommandInText,
  collectSuggestedCommandsForDisplay,
  escapeMarkdownBlockForDisplay,
  escapeMarkdownTextForDisplay,
  formatFullSuggestedCommandsForDisplay,
  formatMarkdownCodeFenceForDisplay,
  formatReviewReceiptForDisplay,
  formatProofCalibrationDetailsForDisplay,
  formatProofCalibrationStatusForDisplay,
  formatProofCalibrationSummaryForDisplay,
  formatProofFreshnessAttributionForDisplay,
  formatProjectRequirementDetailsForDisplay,
  formatProjectRequirementStatusForDisplay,
  formatProjectReviewDecisionForDisplay,
  formatProjectReviewDecisionReasonsForDisplay,
  formatProofStatusForDisplay,
  formatReviewQueueForDisplay,
  formatReviewRoutesForDisplay,
  formatReviewContractStatusForDisplay,
  formatTrustDeltaForDisplay,
  formatVerificationCountLine,
  formatVerifyCommandForDisplay
} from "../core/output.js";
import { formatRepoRelativePath, resolveAgentFlightPaths } from "../core/paths.js";
import { buildProofSnapshot } from "../core/proof-snapshot.js";
import { appendReviewReceipt } from "../core/session.js";
import { assertSafeSessionId } from "../core/session-id.js";
import { normalizeCommandString } from "../core/verification-runs.js";
import { runReplayCommand } from "./replay.js";
import { runReportCommand } from "./report.js";
import { runResumeCommand } from "./resume.js";
import { readCurrentSession, runStatusCommand } from "./status.js";
import type {
  ProofSnapshot,
  ReviewReceiptDecision,
  ReviewReceiptEvaluation,
  ReviewReadinessState,
  ReviewQueueAction,
  ReviewQueueItem,
  ReviewRoutes,
  TrustDelta,
  TrustDeltaItem,
  TrustDeltaItemKind
} from "../types/index.js";

export interface HandoffCommandOptions {
  repoRoot: string;
  changedFiles?: string[] | undefined;
  now?: Date | undefined;
  accept?: boolean | undefined;
}

export interface HandoffCommandResult {
  output: string;
  exitCode: number;
  handoffPath: string;
  sessionHandoffPath: string;
  reportPath: string;
  replayPath: string;
  resumePath: string;
  sessionResumePath: string;
}

interface HandoffStatus {
  taskTitle: string;
  sessionId: string;
  changedFiles: string[];
  riskLevel: string;
  changedFileCount: number;
  verification: {
    passed: number;
    failed: number;
    unresolvedFailed: number;
    resolvedFailed: number;
    runs: HandoffVerificationRun[];
  };
  review: {
    focus: HandoffFocusItem[];
    projectReviewContract: HandoffProjectReviewContract;
    calibration?: HandoffProofCalibration | undefined;
    proofFreshness?: HandoffProofFreshness | undefined;
    reviewReceipt: HandoffReviewReceipt;
    trustDelta: HandoffTrustDelta;
    reviewQueue: HandoffReviewQueueItem[];
    reviewRoutes: HandoffReviewRoutes;
    contract: HandoffContract;
    proofGaps: HandoffProofGap[];
    readiness: HandoffReadiness;
  };
  reason: string;
  nextAction: string;
}

interface HandoffVerificationRun {
  command: string;
  status: string;
  outputExcerpt?: string;
}

interface HandoffFocusItem {
  rank: number;
  file: string;
  proofStatus: Parameters<typeof formatProofStatusForDisplay>[0];
  reasons: string[];
  suggestedReviewerFocus: string;
  suggestedCommand?: string;
}

interface HandoffProofGap {
  id: string;
  severity: string;
  message: string;
  relatedFiles: string[];
  suggestedCommand?: string;
}

interface HandoffProjectReviewContract {
  enabled: boolean;
  summary: {
    total: number;
    supported: number;
    needsReview: number;
    missing: number;
    failed: number;
    stale: number;
    manualReview: number;
    notRequired: number;
    unknown: number;
  };
  requirements: HandoffProjectRequirement[];
}

interface HandoffProjectRequirement {
  id: string;
  label: string;
  status: Parameters<typeof formatProjectRequirementStatusForDisplay>[0];
  proofStatus: Parameters<typeof formatProofStatusForDisplay>[0];
  requiredProof: string[];
  manualReview: string[];
  relatedFiles: string[];
  matchedCategories?: { category: string; files: string[] }[];
  matchReason?: string;
  proofReason?: string;
  satisfiedProof?: { kind: string; command: string };
  remainingReview?: string[];
  suggestedCommand?: string;
}

interface HandoffProofCalibration {
  source: "local_session_history";
  state: "no_history" | "aligned" | "under_proven";
  summary: string;
  scannedSessions: number;
  similarReadySessions: number;
  suggestions: HandoffProofCalibrationSuggestion[];
}

interface HandoffProofCalibrationSuggestion {
  id: string;
  status: "under_proven";
  category: string;
  message: string;
  currentProof: string[];
  historicalProof: string[];
  suggestedCommand: string;
  similarReadySessions: number;
  matchedSessionIds: string[];
}

interface HandoffProofFreshness {
  state: "current" | "stale" | "legacy" | "unavailable" | "none";
  reason: string;
  staleFiles: string[];
  staleCategories: HandoffProofFreshnessCategory[];
}

interface HandoffProofFreshnessCategory {
  category: string;
  files: string[];
  proofRequired: boolean;
}

type HandoffTrustDelta = TrustDelta;
type HandoffTrustDeltaItem = TrustDeltaItem;
type HandoffReviewQueueItem = ReviewQueueItem;
type HandoffReviewRoutes = ReviewRoutes;
type HandoffReviewReceipt = ReviewReceiptEvaluation;

const trustDeltaKinds = new Set<TrustDeltaItemKind>([
  "failed_proof",
  "stale_proof",
  "stale_receipt",
  "review_receipt",
  "missing_proof",
  "manual_review",
  "repo_calibration",
  "ready",
  "clean"
]);

interface HandoffContract {
  reviewPath?: {
    summary: string;
    nextAction: string;
    inspectClaimIds: string[];
  };
  claims: HandoffContractClaim[];
}

interface HandoffContractClaim {
  text: string;
  status: Parameters<typeof formatReviewContractStatusForDisplay>[0];
  suggestedCommand?: string;
}

interface HandoffReadiness {
  state: ReviewReadinessState;
  label: string;
  reason: string;
  nextAction: string;
  suggestedCommand?: string;
}

interface HandoffArtifactPaths {
  handoffPath: string;
  sessionHandoffPath: string;
  reportPath: string;
  replayPath: string;
  resumePath: string;
  sessionResumePath: string;
}

export async function runHandoffCommand(
  options: HandoffCommandOptions
): Promise<HandoffCommandResult> {
  const paths = resolveAgentFlightPaths(options.repoRoot);
  let status = await readHandoffStatus(options);
  const artifactPaths = buildHandoffArtifactPaths(paths, status.sessionId);
  let acceptNotice = "";
  let acceptedReceiptRecorded = false;
  if (options.accept) {
    if (canRecordAcceptedReceipt(status.review.readiness)) {
      await recordAcceptedReviewReceipt(options, status, artifactPaths);
      acceptedReceiptRecorded = true;
      status = await readHandoffStatus(options);
    } else {
      acceptNotice = formatAcceptReceiptNotRecorded(status.review.readiness);
    }
  }
  const preserveExistingArtifacts = acceptedReceiptRecorded
    ? false
    : await shouldPreserveExistingArtifacts(status, artifactPaths);
  const artifacts = preserveExistingArtifacts
    ? artifactPaths
    : await generateReviewArtifacts(options, artifactPaths);
  const output = renderHandoff({
    status,
    handoffPath: formatRepoRelativePath(options.repoRoot, artifacts.sessionHandoffPath),
    currentHandoffPath: formatRepoRelativePath(options.repoRoot, artifacts.handoffPath),
    reportPath: formatRepoRelativePath(options.repoRoot, artifacts.reportPath),
    replayPath: formatRepoRelativePath(options.repoRoot, artifacts.replayPath),
    resumePath: formatRepoRelativePath(options.repoRoot, artifacts.sessionResumePath),
    currentResumePath: formatRepoRelativePath(options.repoRoot, artifacts.resumePath),
    acceptNotice
  });
  await writeTextFileSafe(artifactPaths.handoffPath, output, { overwrite: true });
  if (!preserveExistingArtifacts) {
    await writeTextFileSafe(artifactPaths.sessionHandoffPath, output, { overwrite: true });
  } else {
    await restoreCurrentResumePrompt(artifactPaths);
  }

  return {
    output,
    exitCode: exitsSuccessfully(status.review.readiness) ? 0 : 1,
    handoffPath: artifactPaths.handoffPath,
    sessionHandoffPath: artifactPaths.sessionHandoffPath,
    reportPath: artifacts.reportPath,
    replayPath: artifacts.replayPath,
    resumePath: artifacts.resumePath,
    sessionResumePath: artifacts.sessionResumePath
  };
}

function buildHandoffArtifactPaths(
  paths: ReturnType<typeof resolveAgentFlightPaths>,
  sessionId: string
): HandoffArtifactPaths {
  assertSafeSessionId(sessionId);
  return {
    handoffPath: paths.currentHandoff,
    sessionHandoffPath: `${paths.reports}/${sessionId}-handoff.md`,
    reportPath: `${paths.reports}/${sessionId}-proof.md`,
    replayPath: `${paths.reports}/${sessionId}-replay.html`,
    resumePath: paths.currentResumePrompt,
    sessionResumePath: `${paths.reports}/${sessionId}-resume.md`
  };
}

async function shouldPreserveExistingArtifacts(
  status: HandoffStatus,
  paths: HandoffArtifactPaths
): Promise<boolean> {
  if (status.review.readiness.state !== "clean_worktree") return false;

  const checks = await Promise.all([
    pathExists(paths.sessionHandoffPath),
    pathExists(paths.reportPath),
    pathExists(paths.replayPath),
    pathExists(paths.sessionResumePath)
  ]);
  return checks.every(Boolean);
}

async function restoreCurrentResumePrompt(paths: HandoffArtifactPaths): Promise<void> {
  if (await pathExists(paths.resumePath)) return;
  await ensureDir(dirname(paths.resumePath));
  await copyFile(paths.sessionResumePath, paths.resumePath);
}

async function generateReviewArtifacts(
  options: HandoffCommandOptions,
  artifactPaths: HandoffArtifactPaths
): Promise<HandoffArtifactPaths> {
  const report = await runReportCommand({
    repoRoot: options.repoRoot,
    changedFiles: options.changedFiles,
    now: options.now
  });
  const replay = await runReplayCommand({
    repoRoot: options.repoRoot,
    changedFiles: options.changedFiles,
    now: options.now
  });
  const resume = await runResumeCommand({
    repoRoot: options.repoRoot,
    changedFiles: options.changedFiles,
    now: options.now
  });

  return {
    handoffPath: artifactPaths.handoffPath,
    sessionHandoffPath: artifactPaths.sessionHandoffPath,
    reportPath: report.reportPath,
    replayPath: replay.replayPath,
    resumePath: resume.resumePath,
    sessionResumePath: resume.sessionResumePath
  };
}

async function readHandoffStatus(options: HandoffCommandOptions): Promise<HandoffStatus> {
  const status = await runStatusCommand({
    repoRoot: options.repoRoot,
    changedFiles: options.changedFiles,
    now: options.now,
    format: "json"
  });
  return parseHandoffStatus(JSON.parse(status.output) as Record<string, unknown>);
}

function renderHandoff(input: {
  status: HandoffStatus;
  handoffPath: string;
  currentHandoffPath: string;
  reportPath: string;
  replayPath: string;
  resumePath: string;
  currentResumePath: string;
  acceptNotice?: string | undefined;
}): string {
  const readiness = input.status.review.readiness;
  const ready = isReadyForSharing(readiness);
  const needsFix = needsFixBeforeSharing(readiness);

  return `AgentFlight handoff

Task:
${escapeMarkdownTextForDisplay(input.status.taskTitle)}

Session:
${escapeMarkdownTextForDisplay(input.status.sessionId)}

Changed files: ${input.status.changedFileCount}
Risk: ${input.status.riskLevel}

Decision:
${md(formatProjectReviewDecisionForDisplay(input.status.review.projectReviewContract, readiness))}

Why:
${formatProjectReviewDecisionReasonsForDisplay(input.status.review.projectReviewContract)
  .map((reason) => `- ${md(reason)}`)
  .join("\n")}

Review first:
${formatReviewFocus(input.status.review.focus, 3)}

Trust delta:
${md(formatTrustDeltaForDisplay(input.status.review.trustDelta))}

Review queue:
${md(formatReviewQueueForDisplay(input.status.review.reviewQueue))}

Review routing:
${md(formatReviewRoutesForDisplay(input.status.review.reviewRoutes))}
${formatFullSuggestedCommandsSection(input.status)}

Review receipt:
${md(formatReviewReceiptForDisplay(input.status.review.reviewReceipt))}
${input.acceptNotice ? `\n${md(input.acceptNotice)}\n` : ""}

Readiness: ${md(readiness.label)}
Reason: ${formatReadinessReason(readiness, input.status.reason)}

Verification:
${formatVerificationCountLine(input.status.verification)}
${formatVerificationDetails(
  input.status.verification.runs,
  hasUnresolvedFailedVerification(input.status.review.proofGaps)
)}

Required proof:
${formatProjectReviewContract(input.status.review.projectReviewContract)}
${formatProofFreshnessSection(input.status.review.proofFreshness)}

Repo calibration:
${formatProofCalibration(input.status.review.calibration)}

Review contract:
${formatReviewContract(input.status.review.contract, 5)}

Proof gaps:
${formatProofGaps(input.status.review.proofGaps)}

${needsFix ? "Fix before sharing" : "Next action"}:
${formatNextAction(readiness, input.status.nextAction)}

Open first: ${md(formatOpenFirstArtifact(ready, input.handoffPath, input.reportPath))}

Artifacts:
- Handoff: ${md(input.handoffPath)}
- Current handoff: ${md(input.currentHandoffPath)}
- Report: ${md(input.reportPath)}
- Replay: ${md(input.replayPath)}
- Resume: ${md(input.resumePath)}
- Current resume: ${md(input.currentResumePath)}

Local only: no upload, no telemetry, no automatic PR comment.
`;
}

function canRecordAcceptedReceipt(readiness: HandoffReadiness): boolean {
  return readiness.state === "ready_for_review" || readiness.state === "clean_worktree";
}

function formatAcceptReceiptNotRecorded(readiness: HandoffReadiness): string {
  return `Review receipt not recorded:
- --accept records only when readiness is Ready for review or Clean worktree.
- current readiness is ${md(readiness.label)}.`;
}

async function recordAcceptedReviewReceipt(
  options: HandoffCommandOptions,
  status: HandoffStatus,
  artifactPaths: HandoffArtifactPaths
): Promise<void> {
  const session = await readCurrentSession(options.repoRoot);
  const now = options.now ?? new Date();
  const proofSnapshot = await buildProofSnapshot({
    repoRoot: options.repoRoot,
    changedFiles: status.changedFiles,
    capturedAt: now.toISOString(),
    gitCommit: session.git.commit ?? null
  });

  await appendReviewReceipt(options.repoRoot, session, {
    decision: "accepted",
    recordedAt: now,
    summary: "Accepted local handoff.",
    snapshot: {
      branch: session.git.branch ?? null,
      gitCommit: session.git.commit ?? null,
      changedFiles: status.changedFiles,
      readinessState: status.review.readiness.state,
      verificationPassed: status.verification.passed,
      verificationFailed: status.verification.failed,
      artifactPath: formatRepoRelativePath(options.repoRoot, artifactPaths.sessionHandoffPath),
      proofSnapshot
    }
  });
}

function isReadyForSharing(readiness: HandoffReadiness): boolean {
  return readiness.state === "ready_for_review" || readiness.state === "clean_worktree";
}

function exitsSuccessfully(readiness: HandoffReadiness): boolean {
  return readiness.state === "ready_for_review" || readiness.state === "clean_worktree";
}

function formatOpenFirstArtifact(ready: boolean, handoffPath: string, reportPath: string): string {
  return ready ? `handoff ${handoffPath}` : `report ${reportPath}`;
}

function needsFixBeforeSharing(readiness: HandoffReadiness): boolean {
  return (
    readiness.state === "blocked_by_failed_verification" ||
    readiness.state === "needs_verification" ||
    readiness.state === "not_ready_for_review"
  );
}

function hasUnresolvedFailedVerification(gaps: HandoffProofGap[]): boolean {
  return gaps.some((gap) => gap.id === "failed-verification");
}

function formatReadinessReason(readiness: HandoffReadiness, fallback: string): string {
  if (readiness.state === "blocked_by_failed_verification") {
    return "A verification command failed and must be fixed or rerun successfully.";
  }
  return md(compactCommandInText(readiness.reason || fallback, readiness.suggestedCommand));
}

function formatNextAction(readiness: HandoffReadiness, fallback: string): string {
  if (readiness.state === "blocked_by_failed_verification") {
    return "Fix the failed command, rerun verification, then regenerate this handoff.";
  }
  if (readiness.state === "ready_for_review") {
    return "Share the local handoff packet for scoped review; use report/replay for details.";
  }
  return md(compactCommandInText(readiness.nextAction || fallback, readiness.suggestedCommand));
}

function formatVerificationDetails(
  runs: HandoffVerificationRun[],
  showFailedExcerpts: boolean
): string {
  if (runs.length === 0) return "- No verification runs recorded.";

  const excerptRuns = showFailedExcerpts ? getUnresolvedFailedHandoffRuns(runs) : runs;
  const failedExcerpts = excerptRuns
    .filter((run) => run.status === "failed" && run.outputExcerpt)
    .map((run) => run.outputExcerpt!.trim())
    .filter(Boolean);

  if (!showFailedExcerpts && failedExcerpts.length > 0) {
    return "- Historical failed verification excerpts remain in report/replay; no unresolved failed verification remains.";
  }

  if (failedExcerpts.length === 0) return "- No failed verification excerpts recorded.";

  return failedExcerpts
    .map(
      (
        excerpt,
        index
      ) => `Failed verification excerpt${failedExcerpts.length > 1 ? ` ${index + 1}` : ""}:
${formatMarkdownCodeFenceForDisplay(excerpt, "text")}`
    )
    .join("\n\n");
}

function getUnresolvedFailedHandoffRuns(runs: HandoffVerificationRun[]): HandoffVerificationRun[] {
  const laterPassedCommands = new Set<string>();
  const unresolvedRuns: HandoffVerificationRun[] = [];

  for (let index = runs.length - 1; index >= 0; index -= 1) {
    const run = runs[index];
    if (!run) continue;

    const command = normalizeHandoffCommand(run);
    if (run.status === "passed") {
      if (command) laterPassedCommands.add(command);
      continue;
    }

    if (run.status === "failed" && (!command || !laterPassedCommands.has(command))) {
      unresolvedRuns.unshift(run);
    }
  }

  return unresolvedRuns;
}

function normalizeHandoffCommand(run: HandoffVerificationRun): string {
  return run.command.trim() ? normalizeCommandString(run.command) : "";
}

function formatReviewFocus(items: HandoffFocusItem[], limit = items.length): string {
  if (items.length === 0) return "- No changed files to review.";
  const visibleItems = items.slice(0, limit);
  const remaining = items.length - visibleItems.length;
  const rows = visibleItems
    .map(
      (item) =>
        `${item.rank}. ${md(item.file)}\n   Proof: ${md(formatProofStatusForDisplay(item.proofStatus))}\n   Why: ${md(item.reasons.join("; "))}\n   Focus: ${md(item.suggestedReviewerFocus)}${item.suggestedCommand ? `\n   Suggested proof: ${md(formatVerifyCommandForDisplay(item.suggestedCommand))}` : ""}`
    )
    .join("\n");
  return remaining > 0
    ? `${rows}\n- ${remaining} more review focus ${remaining === 1 ? "file" : "files"} in report/replay.`
    : rows;
}

function formatFullSuggestedCommandsSection(status: HandoffStatus): string {
  const commands = markdownText(
    formatFullSuggestedCommandsForDisplay(collectSuggestedCommands(status))
  );
  return commands ? `\n${commands}\n` : "";
}

function collectSuggestedCommands(status: HandoffStatus): string[] {
  return collectSuggestedCommandsForDisplay({
    proofGaps: status.review.proofGaps,
    trustDelta: status.review.trustDelta,
    reviewQueue: status.review.reviewQueue,
    reviewRoutes: status.review.reviewRoutes,
    focus: status.review.focus,
    projectReviewContract: status.review.projectReviewContract,
    calibration: status.review.calibration,
    contract: status.review.contract,
    readiness: status.review.readiness
  });
}

function formatProofGaps(gaps: HandoffProofGap[]): string {
  if (gaps.length === 0) return "- none";
  return gaps.map(formatProofGap).join("\n");
}

function formatProjectReviewContract(contract: HandoffProjectReviewContract): string {
  if (!contract.enabled) return "- Project review contract disabled.";
  if (contract.requirements.length === 0) {
    return "- No project review contract requirements matched these changes.";
  }
  return contract.requirements.map(formatProjectRequirement).join("\n");
}

function formatProjectRequirement(requirement: HandoffProjectRequirement): string {
  const details = formatProjectRequirementDetailsForDisplay(requirement)
    .map((line) => `\n   ${md(line)}`)
    .join("");
  return `- ${md(formatProjectRequirementStatusForDisplay(requirement.status))} - ${md(requirement.label)}${details}`;
}

function formatProofCalibration(calibration: HandoffProofCalibration | undefined): string {
  if (!calibration) return "- No repo calibration history loaded.";
  if (calibration.suggestions.length === 0) {
    return `- ${md(formatProofCalibrationSummaryForDisplay(calibration))}`;
  }
  return [
    `- ${md(formatProofCalibrationSummaryForDisplay(calibration))}`,
    ...calibration.suggestions.map(formatProofCalibrationSuggestion)
  ].join("\n");
}

function formatProofCalibrationSuggestion(suggestion: HandoffProofCalibrationSuggestion): string {
  const details = formatProofCalibrationDetailsForDisplay(suggestion)
    .map((line) => `\n   ${md(line)}`)
    .join("");
  return `- ${md(formatProofCalibrationStatusForDisplay(suggestion.status))} - ${md(suggestion.category)}${details}`;
}

function formatProofFreshnessSection(freshness: HandoffProofFreshness | undefined): string {
  const lines = formatProofFreshnessAttributionForDisplay(freshness);
  if (lines.length === 0) return "";
  return `\nProof freshness:\n${lines.map((line) => `- ${md(line)}`).join("\n")}\n`;
}

function formatReviewContract(contract: HandoffContract, limit: number): string {
  if (contract.claims.length === 0) return "- No review contract claims recorded.";
  const visibleClaims = contract.claims.slice(0, limit);
  const rows = visibleClaims.map(
    (claim) =>
      `- ${md(formatReviewContractStatusForDisplay(claim.status))} - ${escapeMarkdownTextForDisplay(claim.text)}`
  );
  const remaining = contract.claims.length - visibleClaims.length;
  if (remaining > 0) {
    rows.push(`- ${remaining} more claim${remaining === 1 ? "" : "s"} in report/replay.`);
  }
  return [md(formatHandoffReviewPath(contract)), ...rows].filter(Boolean).join("\n");
}

function formatHandoffReviewPath(contract: HandoffContract): string {
  return contract.reviewPath ? `Review path: ${contract.reviewPath.summary}` : "";
}

function formatProofGap(gap: HandoffProofGap): string {
  if (gap.id === "failed-verification") {
    return `- ${md(gap.severity)}: A verification command failed and must be fixed or rerun successfully.`;
  }

  const message = compactCommandInText(gap.message, gap.suggestedCommand);
  const files =
    gap.relatedFiles.length > 0
      ? `\n  Files: ${md(formatFileListForHandoff(gap.relatedFiles))}`
      : "";
  return `- ${md(gap.severity)}: ${md(message)}${files}`;
}

function formatFileListForHandoff(files: string[]): string {
  return files.slice(0, 8).join(", ") + (files.length > 8 ? `, and ${files.length - 8} more` : "");
}

function parseHandoffStatus(payload: Record<string, unknown>): HandoffStatus {
  const task = readObject(payload.task);
  const session = readObject(payload.session);
  const risk = readObject(payload.risk);
  const verification = readObject(payload.verification);
  const review = readObject(payload.review);
  const readiness = parseReadiness(readObject(review.readiness));

  return {
    taskTitle: readString(task.title, "Untitled task"),
    sessionId: readString(session.id, "unknown"),
    changedFiles: readArray(payload.changedFiles).map((file) => readString(file, "unknown")),
    riskLevel: readString(risk.level, "unknown"),
    changedFileCount: readNumber(payload.changedFileCount, 0),
    verification: {
      passed: readNumber(verification.passed, 0),
      failed: readNumber(verification.failed, 0),
      unresolvedFailed: readNumber(
        verification.unresolvedFailed,
        readNumber(verification.failed, 0)
      ),
      resolvedFailed: readNumber(verification.resolvedFailed, 0),
      runs: readArray(verification.runs).map(parseVerificationRun)
    },
    review: {
      focus: readArray(review.focus).map(parseFocusItem),
      projectReviewContract: parseProjectReviewContract(readObject(review.projectReviewContract)),
      ...parseProofCalibration(review.calibration),
      ...parseProofFreshness(review.proofFreshness),
      reviewReceipt: parseReviewReceipt(review.reviewReceipt),
      trustDelta: parseTrustDelta(readObject(review.trustDelta)),
      reviewQueue: readArray(review.reviewQueue).map(parseReviewQueueItem),
      reviewRoutes: parseReviewRoutes(readObject(review.reviewRoutes)),
      contract: parseContract(readObject(review.contract)),
      proofGaps: readArray(review.proofGaps).map(parseProofGap),
      readiness
    },
    reason: readString(payload.reason, readiness.reason),
    nextAction: readString(payload.nextAction, readiness.nextAction)
  };
}

function parseProjectReviewContract(value: Record<string, unknown>): HandoffProjectReviewContract {
  const summary = readObject(value.summary);
  return {
    enabled: value.enabled !== false,
    summary: {
      total: readNumber(summary.total, 0),
      supported: readNumber(summary.supported, 0),
      needsReview: readNumber(summary.needsReview, 0),
      missing: readNumber(summary.missing, 0),
      failed: readNumber(summary.failed, 0),
      stale: readNumber(summary.stale, 0),
      manualReview: readNumber(summary.manualReview, 0),
      notRequired: readNumber(summary.notRequired, 0),
      unknown: readNumber(summary.unknown, 0)
    },
    requirements: readArray(value.requirements).map(parseProjectRequirement)
  };
}

function parseProjectRequirement(value: unknown): HandoffProjectRequirement {
  const requirement = readObject(value);
  const suggestedCommand = readString(requirement.suggestedCommand, "");
  return {
    id: readString(requirement.id, "project-requirement"),
    label: readString(requirement.label, "Project review requirement"),
    status: parseProjectRequirementStatus(requirement.status),
    proofStatus: parseProofStatus(requirement.proofStatus),
    requiredProof: readArray(requirement.requiredProof).map((kind) => readString(kind, "unknown")),
    manualReview: readArray(requirement.manualReview).map((check) => readString(check, "")),
    relatedFiles: readArray(requirement.relatedFiles).map((file) => readString(file, "unknown")),
    matchedCategories: readArray(requirement.matchedCategories).map(parseMatchedCategory),
    matchReason: readString(requirement.matchReason, ""),
    proofReason: readString(requirement.proofReason, ""),
    remainingReview: readArray(requirement.remainingReview).map((check) => readString(check, "")),
    ...parseSatisfiedProof(requirement.satisfiedProof),
    ...(suggestedCommand ? { suggestedCommand } : {})
  };
}

function parseProofCalibration(value: unknown): Pick<HandoffStatus["review"], "calibration"> {
  const calibration = readObject(value);
  const source = readString(calibration.source, "");
  const state = parseProofCalibrationState(calibration.state);
  const summary = readString(calibration.summary, "");
  if (source !== "local_session_history" || !state || !summary) return {};

  return {
    calibration: {
      source,
      state,
      summary,
      scannedSessions: readNumber(calibration.scannedSessions, 0),
      similarReadySessions: readNumber(calibration.similarReadySessions, 0),
      suggestions: readArray(calibration.suggestions).map(parseProofCalibrationSuggestion)
    }
  };
}

function parseProofCalibrationSuggestion(value: unknown): HandoffProofCalibrationSuggestion {
  const suggestion = readObject(value);
  return {
    id: readString(suggestion.id, "repo-calibration"),
    status: "under_proven",
    category: readString(suggestion.category, "unknown"),
    message: readString(suggestion.message, "Repo calibration suggestion recorded."),
    currentProof: readArray(suggestion.currentProof).map((proof) => readString(proof, "unknown")),
    historicalProof: readArray(suggestion.historicalProof).map((proof) =>
      readString(proof, "unknown")
    ),
    suggestedCommand: readString(suggestion.suggestedCommand, ""),
    similarReadySessions: readNumber(suggestion.similarReadySessions, 0),
    matchedSessionIds: readArray(suggestion.matchedSessionIds).map((id) => readString(id, ""))
  };
}

function parseProofFreshness(value: unknown): Pick<HandoffStatus["review"], "proofFreshness"> {
  const freshness = readObject(value);
  const state = parseProofFreshnessState(freshness.state);
  const reason = readString(freshness.reason, "");
  if (!state || !reason) return {};

  return {
    proofFreshness: {
      state,
      reason,
      staleFiles: readArray(freshness.staleFiles).map((file) => readString(file, "unknown")),
      staleCategories: readArray(freshness.staleCategories).map(parseProofFreshnessCategory)
    }
  };
}

function parseProofFreshnessCategory(value: unknown): HandoffProofFreshnessCategory {
  const category = readObject(value);
  return {
    category: readString(category.category, "unknown"),
    files: readArray(category.files).map((file) => readString(file, "unknown")),
    proofRequired: category.proofRequired === true
  };
}

function parseReviewReceipt(value: unknown): HandoffReviewReceipt {
  const receipt = readObject(value);
  const state = parseReviewReceiptState(receipt.state);
  return {
    state,
    label: readString(receipt.label, "No review receipt"),
    summary: readString(receipt.summary, "No local review receipt recorded yet."),
    nextAction: readString(
      receipt.nextAction,
      "Run agentflight handoff --accept after local review."
    ),
    staleFiles: readArray(receipt.staleFiles).map((file) => readString(file, "unknown")),
    ...parseReviewReceiptRecord(receipt.receipt)
  };
}

function parseReviewReceiptRecord(value: unknown): Pick<HandoffReviewReceipt, "receipt"> {
  const receipt = readObject(value);
  const id = readString(receipt.id, "");
  const decision = parseReviewReceiptDecision(receipt.decision);
  const recordedAt = readString(receipt.recordedAt, "");
  const summary = readString(receipt.summary, "");
  const snapshot = readObject(receipt.snapshot);
  if (!id || !decision || !recordedAt || !summary) return {};

  return {
    receipt: {
      id,
      decision,
      recordedAt,
      summary,
      snapshot: {
        branch: nullableString(snapshot.branch),
        gitCommit: nullableString(snapshot.gitCommit),
        changedFiles: readArray(snapshot.changedFiles).map((file) => readString(file, "unknown")),
        readinessState: parseReviewReadinessState(snapshot.readinessState),
        verificationPassed: readNumber(snapshot.verificationPassed, 0),
        verificationFailed: readNumber(snapshot.verificationFailed, 0),
        artifactPath: readString(snapshot.artifactPath, ""),
        ...parseReceiptProofSnapshot(snapshot.proofSnapshot)
      }
    }
  };
}

function parseReceiptProofSnapshot(value: unknown): { proofSnapshot?: ProofSnapshot } {
  const snapshot = readObject(value);
  if (snapshot.schemaVersion !== 1 || snapshot.hashAlgorithm !== "sha256") return {};
  return { proofSnapshot: snapshot as unknown as ProofSnapshot };
}

function parseReviewReceiptState(value: unknown): HandoffReviewReceipt["state"] {
  if (
    value === "none" ||
    value === "current" ||
    value === "stale" ||
    value === "needs_changes" ||
    value === "blocked" ||
    value === "superseded"
  ) {
    return value;
  }
  return "none";
}

function parseReviewReceiptDecision(value: unknown): ReviewReceiptDecision | null {
  if (
    value === "accepted" ||
    value === "needs_changes" ||
    value === "blocked" ||
    value === "superseded"
  ) {
    return value;
  }
  return null;
}

function parseTrustDelta(value: Record<string, unknown>): HandoffTrustDelta {
  const summary = readString(value.summary, "No trust delta recorded.");
  return {
    summary,
    items: readArray(value.items).map(parseTrustDeltaItem)
  };
}

function parseTrustDeltaItem(value: unknown): HandoffTrustDeltaItem {
  const item = readObject(value);
  const suggestedCommand = readString(item.suggestedCommand, "");
  return {
    kind: parseTrustDeltaKind(item.kind),
    severity: parseTrustDeltaSeverity(item.severity),
    message: readString(item.message, "No trust delta detail recorded."),
    relatedFiles: readArray(item.relatedFiles).map((file) => readString(file, "unknown")),
    ...(suggestedCommand ? { suggestedCommand } : {}),
    relatedProofGapIds: readArray(item.relatedProofGapIds).map((id) => readString(id, ""))
  };
}

function parseReviewQueueItem(value: unknown): HandoffReviewQueueItem {
  const item = readObject(value);
  const suggestedCommand = readString(item.suggestedCommand, "");
  return {
    rank: readNumber(item.rank, 0),
    action: parseReviewQueueAction(item.action),
    label: readString(item.label, "Inspect review item"),
    detail: readString(item.detail, "Inspect this item before trusting the change."),
    relatedFiles: readArray(item.relatedFiles).map((file) => readString(file, "unknown")),
    ...(suggestedCommand ? { suggestedCommand } : {}),
    relatedProofGapIds: readArray(item.relatedProofGapIds).map((id) => readString(id, ""))
  };
}

function parseReviewRoutes(value: Record<string, unknown>): HandoffReviewRoutes {
  return {
    summary: readString(value.summary, "No reviewer routing needed for the current worktree."),
    items: readArray(value.items)
      .map(parseReviewRouteItem)
      .filter((item): item is HandoffReviewRoutes["items"][number] => Boolean(item))
  };
}

function parseReviewRouteItem(value: unknown): HandoffReviewRoutes["items"][number] | null {
  const item = readObject(value);
  const role = parseReviewRouteRole(item.role);
  const status = parseReviewRouteStatus(item.status);
  if (!role || !status) return null;

  const suggestedCommand = readString(item.suggestedCommand, "");
  return {
    role,
    label: readString(item.label, "Reviewer"),
    status,
    priority: readNumber(item.priority, 0),
    summary: readString(item.summary, "Review this route before trusting the change."),
    reason: readString(item.reason, "No route reason recorded."),
    relatedFiles: readArray(item.relatedFiles).map((file) => readString(file, "unknown")),
    ...(suggestedCommand ? { suggestedCommand } : {}),
    relatedProofGapIds: readArray(item.relatedProofGapIds).map((id) => readString(id, ""))
  };
}

function parseReviewRouteRole(value: unknown): HandoffReviewRoutes["items"][number]["role"] | null {
  if (
    value === "maintainer" ||
    value === "verification" ||
    value === "security" ||
    value === "docs_dx" ||
    value === "release"
  ) {
    return value;
  }
  return null;
}

function parseReviewRouteStatus(
  value: unknown
): HandoffReviewRoutes["items"][number]["status"] | null {
  if (value === "clear" || value === "needs_review" || value === "blocked") return value;
  return null;
}

function parseTrustDeltaKind(value: unknown): TrustDeltaItemKind {
  if (typeof value === "string" && trustDeltaKinds.has(value as TrustDeltaItemKind)) {
    return value as TrustDeltaItemKind;
  }
  return "ready";
}

function parseTrustDeltaSeverity(value: unknown): HandoffTrustDeltaItem["severity"] {
  if (value === "blocking" || value === "warning" || value === "info") return value;
  return "info";
}

function parseReviewQueueAction(value: unknown): ReviewQueueAction {
  if (
    value === "fix_failed_proof" ||
    value === "rerun_stale_proof" ||
    value === "refresh_review_receipt" ||
    value === "run_missing_proof" ||
    value === "inspect_manual_review" ||
    value === "consider_repo_calibration" ||
    value === "inspect_file"
  ) {
    return value;
  }
  return "inspect_file";
}

function parseProofFreshnessState(value: unknown): HandoffProofFreshness["state"] | null {
  if (
    value === "current" ||
    value === "stale" ||
    value === "legacy" ||
    value === "unavailable" ||
    value === "none"
  ) {
    return value;
  }
  return null;
}

function parseProofCalibrationState(value: unknown): HandoffProofCalibration["state"] | null {
  if (value === "no_history" || value === "aligned" || value === "under_proven") {
    return value;
  }
  return null;
}

function parseMatchedCategory(value: unknown): { category: string; files: string[] } {
  const match = readObject(value);
  return {
    category: readString(match.category, "unknown"),
    files: readArray(match.files).map((file) => readString(file, "unknown"))
  };
}

function parseSatisfiedProof(value: unknown): Pick<HandoffProjectRequirement, "satisfiedProof"> {
  const proof = readObject(value);
  const kind = readString(proof.kind, "");
  const command = readString(proof.command, "");
  if (!kind || !command) return {};
  return { satisfiedProof: { kind, command } };
}

function parseContract(value: Record<string, unknown>): HandoffContract {
  return {
    ...parseContractReviewPath(value.reviewPath),
    claims: readArray(value.claims).map(parseContractClaim)
  };
}

function parseContractReviewPath(value: unknown): Pick<HandoffContract, "reviewPath"> {
  const reviewPath = readObject(value);
  const summary = readString(reviewPath.summary, "");
  const nextAction = readString(reviewPath.nextAction, "");
  if (!summary || !nextAction) return {};
  return {
    reviewPath: {
      summary,
      nextAction,
      inspectClaimIds: readArray(reviewPath.inspectClaimIds).map((id) => readString(id, ""))
    }
  };
}

function parseContractClaim(value: unknown): HandoffContractClaim {
  const claim = readObject(value);
  const suggestedCommand = readString(claim.suggestedCommand, "");
  return {
    text: readString(claim.text, "Unknown claim"),
    status: parseContractStatus(claim.status),
    ...(suggestedCommand ? { suggestedCommand } : {})
  };
}

function parseReadiness(value: Record<string, unknown>): HandoffReadiness {
  return {
    state: parseReviewReadinessState(value.state),
    label: readString(value.label, "Unknown"),
    reason: readString(value.reason, "No readiness reason recorded."),
    nextAction: readString(value.nextAction, "Review the generated AgentFlight artifacts."),
    ...(typeof value.suggestedCommand === "string"
      ? { suggestedCommand: value.suggestedCommand }
      : {})
  };
}

function parseReviewReadinessState(value: unknown): ReviewReadinessState {
  if (
    value === "ready_for_review" ||
    value === "not_ready_for_review" ||
    value === "needs_verification" ||
    value === "blocked_by_failed_verification" ||
    value === "clean_worktree" ||
    value === "unknown"
  ) {
    return value;
  }
  return "unknown";
}

function parseVerificationRun(value: unknown): HandoffVerificationRun {
  const run = readObject(value);
  return {
    command: readString(run.command, ""),
    status: readString(run.status, "unknown"),
    ...(typeof run.outputExcerpt === "string" ? { outputExcerpt: run.outputExcerpt } : {})
  };
}

function parseFocusItem(value: unknown): HandoffFocusItem {
  const item = readObject(value);
  return {
    rank: readNumber(item.rank, 0),
    file: readString(item.file, "unknown"),
    proofStatus: parseProofStatus(item.proofStatus),
    reasons: readArray(item.reasons).map((reason) => readString(reason, "unknown")),
    suggestedReviewerFocus: readString(item.suggestedReviewerFocus, "Inspect manually."),
    ...(typeof item.suggestedCommand === "string"
      ? { suggestedCommand: item.suggestedCommand }
      : {})
  };
}

function parseProofGap(value: unknown): HandoffProofGap {
  const gap = readObject(value);
  return {
    id: readString(gap.id, "proof-gap"),
    severity: readString(gap.severity, "info"),
    message: readString(gap.message, "Proof gap recorded."),
    relatedFiles: readArray(gap.relatedFiles).map((file) => readString(file, "unknown")),
    ...(typeof gap.suggestedCommand === "string" ? { suggestedCommand: gap.suggestedCommand } : {})
  };
}

function readObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function md(value: string): string {
  return escapeMarkdownBlockForDisplay(value);
}

function markdownText(value: string): string {
  return escapeMarkdownBlockForDisplay(value);
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function parseProofStatus(value: unknown): Parameters<typeof formatProofStatusForDisplay>[0] {
  if (
    value === "current" ||
    value === "stale" ||
    value === "covered" ||
    value === "missing" ||
    value === "failed" ||
    value === "not_required" ||
    value === "unknown"
  ) {
    return value;
  }
  return "unknown";
}

function parseProjectRequirementStatus(
  value: unknown
): Parameters<typeof formatProjectRequirementStatusForDisplay>[0] {
  if (
    value === "supported" ||
    value === "needs_review" ||
    value === "missing" ||
    value === "failed" ||
    value === "stale" ||
    value === "not_required" ||
    value === "unknown"
  ) {
    return value;
  }
  return "unknown";
}

function parseContractStatus(
  value: unknown
): Parameters<typeof formatReviewContractStatusForDisplay>[0] {
  if (
    value === "supported" ||
    value === "needs_review" ||
    value === "unsupported" ||
    value === "failed" ||
    value === "stale" ||
    value === "not_testable" ||
    value === "unknown"
  ) {
    return value;
  }
  return "unknown";
}
