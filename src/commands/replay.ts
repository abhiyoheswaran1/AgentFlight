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
import { renderHtmlReplay } from "../renderers/html-replay.js";
import { refreshBaseframeResultIfPresent } from "./baseframe-result.js";
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
  const relativeReplayPath = `.agentflight/reports/${session.id}-replay.html`;
  const replayPath = `${resolveAgentFlightPaths(options.repoRoot).reports}/${session.id}-replay.html`;
  const baseframeResult = await refreshBaseframeResultIfPresent({
    repoRoot: options.repoRoot,
    session,
    changedFiles,
    now,
    artifacts: [{ kind: "replay", path: relativeReplayPath }]
  });
  const event = {
    type: "replay_generated",
    timestamp: now,
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
    baseframeResult: baseframeResult ?? undefined,
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
