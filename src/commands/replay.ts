import { writeTextFileSafe } from "../core/fs-safe.js";
import { listChangedFiles } from "../core/git.js";
import { resolveAgentFlightPaths } from "../core/paths.js";
import { analyzeRisk } from "../core/risk.js";
import { addSessionEvent, getSessionTimelineEvents, saveSession } from "../core/session.js";
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
  const changedFiles = options.changedFiles ?? (await listChangedFiles(options.repoRoot));
  const risk = analyzeRisk(changedFiles);
  const verification = buildVerificationSummary(session, {
    changedFilesCount: changedFiles.length,
    riskLevel: risk.level
  });
  const replayPath = `${resolveAgentFlightPaths(options.repoRoot).reports}/${session.id}-replay.html`;
  const updatedSession = addSessionEvent(session, {
    type: "replay_generated",
    timestamp: options.now ?? new Date(),
    title: "Replay generated",
    metadata: {
      path: `.agentflight/reports/${session.id}-replay.html`
    }
  });
  const html = renderHtmlReplay({
    task: session.task.title,
    sessionId: session.id,
    startedAt: session.startedAt,
    timeline: getSessionTimelineEvents(updatedSession),
    changedFiles,
    changedFileGroups: risk.categories,
    riskBadges: [risk.level, ...risk.categories.map((summary) => summary.category)],
    verificationEvidence: verification.runs,
    reviewReadiness: verification.readiness,
    recommendation: `${verification.readiness}. ${buildReplayNextAction(verification.readiness, verification.nextAction)}`
  });

  await writeTextFileSafe(replayPath, html, { overwrite: true });
  await saveSession(options.repoRoot, updatedSession);

  return {
    output: `Replay generated:
${replayPath}
`,
    replayPath
  };
}

function buildReplayNextAction(readiness: string, fallback: string): string {
  if (readiness === "Ready for review") {
    return "Use this replay for review and handoff; continue only scoped follow-up work.";
  }
  return fallback;
}
