import { readOpenFirstArtifact } from "../core/artifacts.js";
import { writeTextFileSafe } from "../core/fs-safe.js";
import { filterChangedFiles } from "../core/changed-files.js";
import { loadConfig } from "../core/config.js";
import { listChangedFiles } from "../core/git.js";
import { resolveAgentFlightPaths } from "../core/paths.js";
import { buildProofSnapshot } from "../core/proof-snapshot.js";
import { loadProofCalibrationHistory } from "../core/proof-calibration.js";
import { resolveProjectReviewContractConfig } from "../core/project-review-contract.js";
import { analyzeRisk } from "../core/risk.js";
import { buildReviewIntelligence } from "../core/review-intelligence.js";
import {
  appendSessionEvent,
  getLatestRecordedReviewSummary,
  getLatestSessionEvent,
  reviewSummaryMatchesCurrentWork
} from "../core/session.js";
import { buildVerificationSummary } from "../core/verification.js";
import { formatVerificationCountLine, formatVerificationFailureContext } from "../core/output.js";
import { renderResumePrompt } from "../renderers/resume-prompt.js";
import { refreshBaseframeResultIfPresent } from "./baseframe-result.js";
import { readCurrentSession } from "./status.js";

export interface ResumeCommandOptions {
  repoRoot: string;
  changedFiles?: string[] | undefined;
  now?: Date | undefined;
}

export interface ResumeCommandResult {
  output: string;
  resumePath: string;
  sessionResumePath: string;
}

export async function runResumeCommand(
  options: ResumeCommandOptions
): Promise<ResumeCommandResult> {
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
  const latestSnapshot = getLatestSessionEvent(session, "snapshot_created");
  const latestReviewSummary = getLatestRecordedReviewSummary(session);
  const openFirstReadiness =
    review.readiness.state === "clean_worktree"
      ? latestReviewSummary?.state
      : review.readiness.state === "ready_for_review" &&
          reviewSummaryMatchesCurrentWork(latestReviewSummary, {
            state: review.readiness.state,
            changedFiles: changedFiles.length
          })
        ? review.readiness.state
        : undefined;
  const openFirstArtifact =
    openFirstReadiness !== undefined
      ? await readOpenFirstArtifact(options.repoRoot, session.id, openFirstReadiness)
      : null;
  const baseframeResult = await refreshBaseframeResultIfPresent({
    repoRoot: options.repoRoot,
    session,
    changedFiles,
    now,
    artifacts: [{ kind: "resume", path: `.agentflight/reports/${session.id}-resume.md` }]
  });
  const event = {
    type: "resume_generated",
    timestamp: now,
    title: "Resume prompt generated",
    metadata: {
      path: ".agentflight/current/resume-prompt.md"
    }
  } as const;
  const prompt = renderResumePrompt({
    task: session.task.title,
    sessionId: session.id,
    branch: session.git.branch,
    changedFiles,
    riskLevel: risk.level,
    riskReasons: risk.reasons,
    verificationGaps: verification.gaps,
    reviewFocus: review.focus.slice(0, 5),
    reviewFocusTotal: review.focus.length,
    projectReviewContract: review.projectReviewContract,
    calibration: review.calibration,
    reviewReceipt: review.reviewReceipt,
    trustDelta: review.trustDelta,
    reviewQueue: review.reviewQueue,
    reviewRoutes: review.reviewRoutes,
    proofFreshness: review.proofFreshness,
    reviewContract: review.contract,
    proofGaps: review.proofGaps,
    readiness: review.readiness,
    baseframeResult: baseframeResult ?? undefined,
    openFirstArtifact: openFirstArtifact ?? undefined,
    latestSnapshotNote: latestSnapshot?.message,
    verificationState: formatVerificationCountLine(verification),
    verificationContext: formatVerificationFailureContext(verification),
    nextAction: review.readiness.nextAction
  });
  const paths = resolveAgentFlightPaths(options.repoRoot);
  const resumePath = paths.currentResumePrompt;
  const sessionResumePath = `${paths.reports}/${session.id}-resume.md`;

  await writeTextFileSafe(resumePath, prompt, { overwrite: true });
  await writeTextFileSafe(sessionResumePath, prompt, { overwrite: true });
  await appendSessionEvent(options.repoRoot, session, event);

  return {
    output: prompt,
    resumePath,
    sessionResumePath
  };
}
