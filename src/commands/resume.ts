import { writeTextFileSafe } from "../core/fs-safe.js";
import { filterChangedFiles } from "../core/changed-files.js";
import { loadConfig } from "../core/config.js";
import { listChangedFiles } from "../core/git.js";
import { resolveAgentFlightPaths } from "../core/paths.js";
import { analyzeRisk } from "../core/risk.js";
import { buildReviewIntelligence } from "../core/review-intelligence.js";
import { addSessionEvent, getLatestSessionEvent, saveSession } from "../core/session.js";
import { buildVerificationSummary } from "../core/verification.js";
import { renderResumePrompt } from "../renderers/resume-prompt.js";
import { readCurrentSession } from "./status.js";

export interface ResumeCommandOptions {
  repoRoot: string;
  changedFiles?: string[] | undefined;
  now?: Date | undefined;
}

export interface ResumeCommandResult {
  output: string;
  resumePath: string;
}

export async function runResumeCommand(
  options: ResumeCommandOptions
): Promise<ResumeCommandResult> {
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
  const latestSnapshot = getLatestSessionEvent(session, "snapshot_created");
  const updatedSession = addSessionEvent(session, {
    type: "resume_generated",
    timestamp: options.now ?? new Date(),
    title: "Resume prompt generated",
    metadata: {
      path: ".agentflight/current/resume-prompt.md"
    }
  });
  const prompt = renderResumePrompt({
    task: session.task.title,
    sessionId: session.id,
    branch: session.git.branch,
    changedFiles,
    riskLevel: risk.level,
    riskReasons: risk.reasons,
    verificationGaps: verification.gaps,
    reviewFocus: review.focus.slice(0, 5),
    proofGaps: review.proofGaps,
    readiness: review.readiness,
    latestSnapshotNote: latestSnapshot?.message,
    verificationState: `${verification.passed} passed, ${verification.failed} failed`,
    nextAction: buildResumeNextAction(review.readiness.label, review.readiness.nextAction)
  });
  const resumePath = resolveAgentFlightPaths(options.repoRoot).currentResumePrompt;

  await writeTextFileSafe(resumePath, prompt, { overwrite: true });
  await saveSession(options.repoRoot, updatedSession);

  return {
    output: prompt,
    resumePath
  };
}

function buildResumeNextAction(readiness: string, fallback: string): string {
  if (readiness === "Ready for review") {
    return "Use the generated report or replay if available, then hand off for review or continue only scoped follow-up work.";
  }
  return fallback;
}
