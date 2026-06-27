import { writeTextFileSafe } from "../core/fs-safe.js";
import { filterChangedFiles } from "../core/changed-files.js";
import { loadConfig } from "../core/config.js";
import { listChangedFiles } from "../core/git.js";
import { formatRepoRelativePath, resolveAgentFlightPaths } from "../core/paths.js";
import { buildProofSnapshot } from "../core/proof-snapshot.js";
import { loadProofCalibrationHistory } from "../core/proof-calibration.js";
import { resolveProjectReviewContractConfig } from "../core/project-review-contract.js";
import { analyzeRisk } from "../core/risk.js";
import { buildReviewIntelligence } from "../core/review-intelligence.js";
import {
  addSessionEvent,
  appendSessionEvent,
  buildArtifactReviewMetadata,
  getSessionTimelineEvents
} from "../core/session.js";
import { buildVerificationSummary } from "../core/verification.js";
import { renderMarkdownReport, type MarkdownReportMode } from "../renderers/markdown-report.js";
import { refreshBaseframeResultIfPresent } from "./baseframe-result.js";
import { readCurrentSession } from "./status.js";

export interface ReportCommandOptions {
  repoRoot: string;
  changedFiles?: string[] | undefined;
  mode?: string | undefined;
  now?: Date | undefined;
}

export interface ReportCommandResult {
  output: string;
  reportPath: string;
}

export async function runReportCommand(
  options: ReportCommandOptions
): Promise<ReportCommandResult> {
  const mode = normalizeReportMode(options.mode);
  const session = await readCurrentSession(options.repoRoot);
  const now = options.now ?? new Date();
  const config = await loadConfig(options.repoRoot);
  const changedFiles = filterChangedFiles(
    options.changedFiles ?? (await listChangedFiles(options.repoRoot)),
    { ignore: config?.changedFileFilters?.ignore }
  );
  const risk = analyzeRisk(changedFiles);
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
  const suffix = reportPathSuffix(mode);
  const relativeReportPath = `.agentflight/reports/${session.id}${suffix}`;
  const reportPath = `${resolveAgentFlightPaths(options.repoRoot).reports}/${session.id}${suffix}`;
  const baseframeResult = await refreshBaseframeResultIfPresent({
    repoRoot: options.repoRoot,
    session,
    changedFiles,
    now,
    artifacts: [{ kind: "report", path: relativeReportPath }]
  });
  const event = {
    type: "report_generated",
    timestamp: now,
    title: "Report generated",
    metadata: buildArtifactReviewMetadata({
      path: relativeReportPath,
      readiness: review.readiness,
      riskLevel: risk.level,
      changedFiles: changedFiles.length,
      verificationPassed: verification.passed,
      verificationFailed: verification.failed
    })
  } as const;
  const updatedSession = addSessionEvent(session, event);
  const report = renderMarkdownReport(
    {
      task: session.task.title,
      sessionId: session.id,
      startedAt: session.startedAt,
      changedFiles,
      timelineEvents: getSessionTimelineEvents(updatedSession),
      risk,
      verificationCommands: session.verificationCommands,
      verificationEvidence: verification.runs,
      verificationSummary: {
        passed: verification.passed,
        failed: verification.failed,
        unresolvedFailed: verification.unresolvedFailed,
        resolvedFailed: verification.resolvedFailed
      },
      verificationGaps: verification.gaps,
      recommendation: review.readiness.label,
      nextAction: review.readiness.nextAction,
      review,
      baseframeResult: baseframeResult ?? undefined,
      tooling: session.tools
    },
    {
      mode
    }
  );

  await writeTextFileSafe(reportPath, report, { overwrite: true });
  await appendSessionEvent(options.repoRoot, session, event);

  return {
    output: `Report generated:
${formatRepoRelativePath(options.repoRoot, reportPath)}
`,
    reportPath
  };
}

function normalizeReportMode(mode: string | undefined): MarkdownReportMode {
  if (!mode || mode === "full") return "full";
  if (mode === "compact") return "compact";
  if (mode === "pr-comment") return "pr-comment";
  throw new Error(`Unsupported report mode "${mode}". Use "full", "compact", or "pr-comment".`);
}

function reportPathSuffix(mode: MarkdownReportMode): string {
  if (mode === "pr-comment") return "-pr-comment.md";
  return mode === "compact" ? "-proof-compact.md" : "-proof.md";
}
