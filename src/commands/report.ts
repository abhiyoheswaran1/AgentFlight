import { writeTextFileSafe } from "../core/fs-safe.js";
import { listChangedFiles } from "../core/git.js";
import { resolveAgentFlightPaths } from "../core/paths.js";
import { analyzeRisk } from "../core/risk.js";
import { renderMarkdownReport } from "../renderers/markdown-report.js";
import { readCurrentSession } from "./status.js";

export interface ReportCommandOptions {
  repoRoot: string;
  changedFiles?: string[] | undefined;
}

export interface ReportCommandResult {
  output: string;
  reportPath: string;
}

export async function runReportCommand(
  options: ReportCommandOptions
): Promise<ReportCommandResult> {
  const session = await readCurrentSession(options.repoRoot);
  const changedFiles = options.changedFiles ?? (await listChangedFiles(options.repoRoot));
  const risk = analyzeRisk(changedFiles);
  const report = renderMarkdownReport({
    task: session.task.title,
    sessionId: session.id,
    startedAt: session.startedAt,
    changedFiles,
    risk,
    verificationCommands: session.verificationCommands,
    verificationEvidence: [],
    tooling: session.tools
  });
  const reportPath = `${resolveAgentFlightPaths(options.repoRoot).reports}/${session.id}-proof.md`;

  await writeTextFileSafe(reportPath, report, { overwrite: true });

  return {
    output: `Report generated:
${reportPath}
`,
    reportPath
  };
}
