import { listChangedFiles } from "../core/git.js";
import { readJsonFile } from "../core/fs-safe.js";
import { resolveAgentFlightPaths } from "../core/paths.js";
import { analyzeRisk } from "../core/risk.js";
import type { AgentFlightSession } from "../types/index.js";

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
  const verificationStatus = session.verificationCommands.length
    ? "configured, evidence not recorded"
    : "missing";

  return {
    output: `AgentFlight status

Task:
${session.task.title}

Session duration:
${duration}

Changed files:
${changedFiles.length}

Risk: ${risk.level}
${risk.reasons.map((reason) => `- ${reason}`).join("\n")}

Verification:
${verificationStatus}

Next action:
${nextAction(risk.level, session.verificationCommands)}
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

function nextAction(level: string, commands: string[]): string {
  if (commands.length > 0) return `Run ${commands[0]} and capture proof.`;
  if (level === "high") return "Add verification commands before claiming completion.";
  return "Review changed files and add proof commands if needed.";
}
