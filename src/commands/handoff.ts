import { pathExists, writeTextFileSafe } from "../core/fs-safe.js";
import { compactCommandInText, formatVerificationCountLine } from "../core/output.js";
import { formatRepoRelativePath, resolveAgentFlightPaths } from "../core/paths.js";
import { runReplayCommand } from "./replay.js";
import { runReportCommand } from "./report.js";
import { runResumeCommand } from "./resume.js";
import { runStatusCommand } from "./status.js";

export interface HandoffCommandOptions {
  repoRoot: string;
  changedFiles?: string[] | undefined;
  now?: Date | undefined;
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
    proofGaps: HandoffProofGap[];
    readiness: HandoffReadiness;
  };
  reason: string;
  nextAction: string;
}

interface HandoffVerificationRun {
  status: string;
  outputExcerpt?: string;
}

interface HandoffFocusItem {
  rank: number;
  file: string;
  reasons: string[];
  suggestedReviewerFocus: string;
}

interface HandoffProofGap {
  id: string;
  severity: string;
  message: string;
  suggestedCommand?: string;
}

interface HandoffReadiness {
  state: string;
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
  const status = await readHandoffStatus(options);
  const paths = resolveAgentFlightPaths(options.repoRoot);
  const artifactPaths = buildHandoffArtifactPaths(paths, status.sessionId);
  const preserveExistingArtifacts = await shouldPreserveExistingArtifacts(status, artifactPaths);
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
    currentResumePath: formatRepoRelativePath(options.repoRoot, artifacts.resumePath)
  });
  await writeTextFileSafe(artifactPaths.handoffPath, output, { overwrite: true });
  if (!preserveExistingArtifacts) {
    await writeTextFileSafe(artifactPaths.sessionHandoffPath, output, { overwrite: true });
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
    pathExists(paths.resumePath),
    pathExists(paths.sessionResumePath)
  ]);
  return checks.every(Boolean);
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
}): string {
  const readiness = input.status.review.readiness;
  const ready = isReadyForSharing(readiness);
  const needsFix = needsFixBeforeSharing(readiness);

  return `AgentFlight handoff

Task:
${input.status.taskTitle}

Session:
${input.status.sessionId}

Changed files: ${input.status.changedFileCount}
Risk: ${input.status.riskLevel}

Readiness: ${readiness.label}
Reason: ${formatReadinessReason(readiness, input.status.reason)}

Verification:
${formatVerificationCountLine(input.status.verification)}
${formatVerificationDetails(
  input.status.verification.runs,
  hasUnresolvedFailedVerification(input.status.review.proofGaps)
)}

Review first:
${formatReviewFocus(input.status.review.focus.slice(0, 3))}

Proof gaps:
${formatProofGaps(input.status.review.proofGaps)}

${needsFix ? "Fix before sharing" : "Next action"}:
${formatNextAction(readiness, input.status.nextAction)}

Open first: ${formatOpenFirstArtifact(ready, input.handoffPath, input.reportPath)}

Artifacts:
- Handoff: ${input.handoffPath}
- Current handoff: ${input.currentHandoffPath}
- Report: ${input.reportPath}
- Replay: ${input.replayPath}
- Resume: ${input.resumePath}
- Current resume: ${input.currentResumePath}

Local only: no upload, no telemetry, no automatic PR comment.
`;
}

function isReadyForSharing(readiness: HandoffReadiness): boolean {
  return readiness.state === "ready_for_review";
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
  return compactCommandInText(readiness.reason || fallback, readiness.suggestedCommand);
}

function formatNextAction(readiness: HandoffReadiness, fallback: string): string {
  if (readiness.state === "blocked_by_failed_verification") {
    return "Fix the failed command, rerun verification, then regenerate this handoff.";
  }
  if (readiness.state === "ready_for_review") {
    return "Share this handoff with the report/replay and request scoped human review.";
  }
  return compactCommandInText(readiness.nextAction || fallback, readiness.suggestedCommand);
}

function formatVerificationDetails(
  runs: HandoffVerificationRun[],
  showFailedExcerpts: boolean
): string {
  if (runs.length === 0) return "- No verification runs recorded.";

  const failedExcerpts = runs
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
${excerpt}`
    )
    .join("\n\n");
}

function formatReviewFocus(items: HandoffFocusItem[]): string {
  if (items.length === 0) return "- No changed files to review.";
  return items
    .map(
      (item) =>
        `${item.rank}. ${item.file}\n   Why: ${item.reasons.join("; ")}\n   Focus: ${item.suggestedReviewerFocus}`
    )
    .join("\n");
}

function formatProofGaps(gaps: HandoffProofGap[]): string {
  if (gaps.length === 0) return "- none";
  return gaps.map(formatProofGap).join("\n");
}

function formatProofGap(gap: HandoffProofGap): string {
  if (gap.id === "failed-verification") {
    return `- ${gap.severity}: A verification command failed and must be fixed or rerun successfully.`;
  }

  const message = compactCommandInText(gap.message, gap.suggestedCommand);
  return `- ${gap.severity}: ${message}`;
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
      proofGaps: readArray(review.proofGaps).map(parseProofGap),
      readiness
    },
    reason: readString(payload.reason, readiness.reason),
    nextAction: readString(payload.nextAction, readiness.nextAction)
  };
}

function parseReadiness(value: Record<string, unknown>): HandoffReadiness {
  return {
    state: readString(value.state, "unknown"),
    label: readString(value.label, "Unknown"),
    reason: readString(value.reason, "No readiness reason recorded."),
    nextAction: readString(value.nextAction, "Review the generated AgentFlight artifacts."),
    ...(typeof value.suggestedCommand === "string"
      ? { suggestedCommand: value.suggestedCommand }
      : {})
  };
}

function parseVerificationRun(value: unknown): HandoffVerificationRun {
  const run = readObject(value);
  return {
    status: readString(run.status, "unknown"),
    ...(typeof run.outputExcerpt === "string" ? { outputExcerpt: run.outputExcerpt } : {})
  };
}

function parseFocusItem(value: unknown): HandoffFocusItem {
  const item = readObject(value);
  return {
    rank: readNumber(item.rank, 0),
    file: readString(item.file, "unknown"),
    reasons: readArray(item.reasons).map((reason) => readString(reason, "unknown")),
    suggestedReviewerFocus: readString(item.suggestedReviewerFocus, "Inspect manually.")
  };
}

function parseProofGap(value: unknown): HandoffProofGap {
  const gap = readObject(value);
  return {
    id: readString(gap.id, "proof-gap"),
    severity: readString(gap.severity, "info"),
    message: readString(gap.message, "Proof gap recorded."),
    ...(typeof gap.suggestedCommand === "string" ? { suggestedCommand: gap.suggestedCommand } : {})
  };
}

function readObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
