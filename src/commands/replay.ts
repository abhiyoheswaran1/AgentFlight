import { writeTextFileSafe } from "../core/fs-safe.js";
import { filterChangedFiles } from "../core/changed-files.js";
import { loadConfig } from "../core/config.js";
import { listChangedFiles } from "../core/git.js";
import { formatRepoRelativePath, resolveAgentFlightPaths } from "../core/paths.js";
import { analyzeRisk } from "../core/risk.js";
import { buildReviewIntelligence } from "../core/review-intelligence.js";
import {
  addSessionEvent,
  appendSessionEvent,
  buildArtifactReviewMetadata,
  getSessionTimelineEvents
} from "../core/session.js";
import { buildVerificationSummary } from "../core/verification.js";
import { renderHtmlReplay } from "../renderers/html-replay.js";
import { readCurrentSession } from "./status.js";

export interface ReplayCommandOptions {
  repoRoot: string;
  changedFiles?: string[] | undefined;
  now?: Date | undefined;
}

export interface ReplayCommandResult {
  output: string;
  replayPath: string;
}

export async function runReplayCommand(
  options: ReplayCommandOptions
): Promise<ReplayCommandResult> {
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
  const relativeReplayPath = `.agentflight/reports/${session.id}-replay.html`;
  const replayPath = `${resolveAgentFlightPaths(options.repoRoot).reports}/${session.id}-replay.html`;
  const event = {
    type: "replay_generated",
    timestamp: options.now ?? new Date(),
    title: "Replay generated",
    metadata: buildArtifactReviewMetadata({
      path: relativeReplayPath,
      readiness: review.readiness,
      riskLevel: risk.level,
      changedFiles: changedFiles.length,
      verificationPassed: verification.passed,
      verificationFailed: verification.failed
    })
  } as const;
  const updatedSession = addSessionEvent(session, event);
  const html = renderHtmlReplay({
    task: session.task.title,
    sessionId: session.id,
    startedAt: session.startedAt,
    timeline: getSessionTimelineEvents(updatedSession),
    changedFiles,
    changedFileGroups: risk.categories,
    riskBadges: [risk.level, ...risk.categories.map((summary) => summary.category)],
    verificationEvidence: verification.runs,
    verificationSummary: {
      passed: verification.passed,
      failed: verification.failed,
      unresolvedFailed: verification.unresolvedFailed,
      resolvedFailed: verification.resolvedFailed
    },
    reviewReadiness: review.readiness.label,
    review,
    recommendation: `${review.readiness.label}. ${review.readiness.nextAction}`
  });

  await writeTextFileSafe(replayPath, html, { overwrite: true });
  await appendSessionEvent(options.repoRoot, session, event);

  return {
    output: `Replay generated:
${formatRepoRelativePath(options.repoRoot, replayPath)}
`,
    replayPath
  };
}
