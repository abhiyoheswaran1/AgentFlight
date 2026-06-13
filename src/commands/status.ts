import { listChangedFiles } from "../core/git.js";
import { readJsonFile } from "../core/fs-safe.js";
import { resolveAgentFlightPaths } from "../core/paths.js";
import { analyzeRisk } from "../core/risk.js";
import { buildVerificationSummary } from "../core/verification.js";
import type { AgentFlightSession, RiskCategorySummary, VerificationRun } from "../types/index.js";

export interface StatusCommandOptions {
  repoRoot: string;
  now?: Date | undefined;
  changedFiles?: string[] | undefined;
}

export interface StatusCommandResult {
  output: string;
}

export async function runStatusCommand(
  options: StatusCommandOptions
): Promise<StatusCommandResult> {
  const session = await readCurrentSession(options.repoRoot);
  const changedFiles = options.changedFiles ?? (await listChangedFiles(options.repoRoot));
  const risk = analyzeRisk(changedFiles);
  const duration = formatDuration(session.startedAt, options.now ?? new Date());
  const verification = buildVerificationSummary(session, {
    changedFilesCount: changedFiles.length,
    riskLevel: risk.level
  });

  return {
    output: `AgentFlight status

Task:
${session.task.title}

Session duration:
${duration}

Changed files:
${changedFiles.length}

Changed areas:
${formatChangedAreas(risk.categories)}

Risk: ${risk.level}
${risk.reasons.map((reason) => `- ${reason}`).join("\n")}

Verification Evidence:
${verification.passed} passed, ${verification.failed} failed
${formatVerificationRuns(verification.runs)}

Proof missing:
${verification.gaps.map((gap) => `- ${gap}`).join("\n")}

Review readiness: ${verification.readiness}

Next action:
${verification.nextAction}
`
  };
}

export async function readCurrentSession(repoRoot: string): Promise<AgentFlightSession> {
  return readJsonFile<AgentFlightSession>(resolveAgentFlightPaths(repoRoot).currentSession);
}

function formatDuration(startedAt: string, now: Date): string {
  const elapsedMs = Math.max(0, now.getTime() - new Date(startedAt).getTime());
  const minutes = Math.floor(elapsedMs / 60_000);
  if (minutes < 1) return "less than a minute";
  if (minutes === 1) return "1 minute";
  return `${minutes} minutes`;
}

function formatChangedAreas(categories: RiskCategorySummary[]): string {
  if (categories.length === 0) return "- none";
  return categories
    .map((summary) => `- ${summary.category}: ${summary.files.join(", ")}`)
    .join("\n");
}

function formatVerificationRuns(runs: VerificationRun[] | undefined): string {
  if (!runs || runs.length === 0) return "- No verification runs recorded.";
  return runs
    .map(
      (run) =>
        `- ${run.status}: ${run.command} (exit ${run.exitCode ?? "unknown"}, ${run.durationMs}ms)`
    )
    .join("\n");
}
