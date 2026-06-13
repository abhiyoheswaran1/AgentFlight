import { writeTextFileSafe } from "../core/fs-safe.js";
import { listChangedFiles } from "../core/git.js";
import { resolveAgentFlightPaths } from "../core/paths.js";
import { analyzeRisk } from "../core/risk.js";
import { buildVerificationSummary } from "../core/verification.js";
import { renderHtmlReplay } from "../renderers/html-replay.js";
import { readCurrentSession } from "./status.js";

export interface ReplayCommandOptions {
  repoRoot: string;
  changedFiles?: string[] | undefined;
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
  const html = renderHtmlReplay({
    task: session.task.title,
    sessionId: session.id,
    startedAt: session.startedAt,
    timeline: [
      { label: "Session started", timestamp: session.startedAt },
      ...verification.runs.map((run) => ({
        label: `Verification ${run.status}: ${run.command}`,
        timestamp: run.finishedAt
      }))
    ],
    changedFiles,
    riskBadges: [risk.level, ...risk.categories.map((summary) => summary.category)],
    verificationEvidence: verification.runs,
    recommendation: `${verification.readiness}. ${verification.nextAction}`
  });

  await writeTextFileSafe(replayPath, html, { overwrite: true });

  return {
    output: `Replay generated:
${replayPath}
`,
    replayPath
  };
}
