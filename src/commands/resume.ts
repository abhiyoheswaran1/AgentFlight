import { writeTextFileSafe } from "../core/fs-safe.js";
import { listChangedFiles } from "../core/git.js";
import { resolveAgentFlightPaths } from "../core/paths.js";
import { analyzeRisk } from "../core/risk.js";
import { renderResumePrompt } from "../renderers/resume-prompt.js";
import { readCurrentSession } from "./status.js";

export interface ResumeCommandOptions {
  repoRoot: string;
  changedFiles?: string[] | undefined;
}

export interface ResumeCommandResult {
  output: string;
  resumePath: string;
}

export async function runResumeCommand(
  options: ResumeCommandOptions
): Promise<ResumeCommandResult> {
  const session = await readCurrentSession(options.repoRoot);
  const changedFiles = options.changedFiles ?? (await listChangedFiles(options.repoRoot));
  const risk = analyzeRisk(changedFiles);
  const verificationGaps =
    session.verificationCommands.length > 0
      ? [
          `No verification evidence recorded. Suggested first command: ${session.verificationCommands[0]}`
        ]
      : ["No verification commands detected."];
  const prompt = renderResumePrompt({
    task: session.task.title,
    sessionId: session.id,
    branch: session.git.branch,
    changedFiles,
    riskLevel: risk.level,
    riskReasons: risk.reasons,
    verificationGaps,
    nextAction:
      session.verificationCommands[0] ??
      "Add or run an appropriate verification command before claiming completion."
  });
  const resumePath = resolveAgentFlightPaths(options.repoRoot).currentResumePrompt;

  await writeTextFileSafe(resumePath, prompt, { overwrite: true });

  return {
    output: prompt,
    resumePath
  };
}
