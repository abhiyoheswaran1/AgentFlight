import { writeTextFileSafe } from "../core/fs-safe.js";
import { filterChangedFiles } from "../core/changed-files.js";
import { loadConfig } from "../core/config.js";
import { listChangedFiles } from "../core/git.js";
import { resolveAgentFlightPaths } from "../core/paths.js";
import { analyzeRisk } from "../core/risk.js";
import { buildReviewIntelligence } from "../core/review-intelligence.js";
import { addSessionEvent, getSessionTimelineEvents, saveSession } from "../core/session.js";
import { buildVerificationSummary } from "../core/verification.js";
import { renderMarkdownReport } from "../renderers/markdown-report.js";
import { readCurrentSession } from "./status.js";

export interface ReportCommandOptions {
  repoRoot: string;
  changedFiles?: string[] | undefined;
  now?: Date | undefined;
}

export interface ReportCommandResult {
  output: string;
  reportPath: string;
}

export async function runReportCommand(
  options: ReportCommandOptions
): Promise<ReportCommandResult> {
  const session = await readCurrentSession(options.repoRoot);
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
  const review = buildReviewIntelligence({ changedFiles, risk, session });
  const reportPath = `${resolveAgentFlightPaths(options.repoRoot).reports}/${session.id}-proof.md`;
  const updatedSession = addSessionEvent(session, {
    type: "report_generated",
    timestamp: options.now ?? new Date(),
    title: "Report generated",
    metadata: {
      path: `.agentflight/reports/${session.id}-proof.md`
    }
  });
  const report = renderMarkdownReport({
    task: session.task.title,
    sessionId: session.id,
    startedAt: session.startedAt,
    changedFiles,
    timelineEvents: getSessionTimelineEvents(updatedSession),
    risk,
    verificationCommands: session.verificationCommands,
    verificationEvidence: verification.runs,
    verificationGaps: verification.gaps,
    recommendation: review.readiness.label,
    nextAction: buildReportNextAction(review.readiness.label, review.readiness.nextAction),
    review,
    tooling: session.tools
  });

  await writeTextFileSafe(reportPath, report, { overwrite: true });
  await saveSession(options.repoRoot, updatedSession);

  return {
    output: `Report generated:
${reportPath}
`,
    reportPath
  };
}

function buildReportNextAction(readiness: string, fallback: string): string {
  if (readiness === "Ready for review") {
    return "Share this report with the reviewer and keep follow-up scoped to the risk areas above.";
  }
  return fallback;
}
