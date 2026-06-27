import {
  baseframeResultRelativePath,
  formatAgentLoopKitReconciliationCommand,
  updateBaseframeWorkflowManifest
} from "../core/baseframe.js";
import { formatRepoRelativePath } from "../core/paths.js";
import { appendSessionEvent } from "../core/session.js";
import { refreshBaseframeResultIfPresent } from "./baseframe-result.js";
import { runReplayCommand } from "./replay.js";
import { runReportCommand } from "./report.js";
import { runResumeCommand } from "./resume.js";
import { readCurrentSession } from "./status.js";

export interface FinalizeCommandOptions {
  repoRoot: string;
  taskId?: string | undefined;
  changedFiles?: string[] | undefined;
  now?: Date | undefined;
}

export interface FinalizeCommandResult {
  output: string;
  resultPath: string;
}

export async function runFinalizeCommand(
  options: FinalizeCommandOptions
): Promise<FinalizeCommandResult> {
  const initialSession = await readCurrentSession(options.repoRoot);
  const context = initialSession.baseframeIntegration;
  if (!context) {
    throw new Error(
      "No Baseframe integration context is recorded on the current AgentFlight session."
    );
  }
  if (options.taskId && options.taskId !== context.taskId) {
    throw new Error(
      `Baseframe task ID mismatch: requested "${options.taskId}" does not match current session "${context.taskId}".`
    );
  }

  const now = options.now ?? new Date();
  const report = await runReportCommand({
    repoRoot: options.repoRoot,
    changedFiles: options.changedFiles,
    now
  });
  const replay = await runReplayCommand({
    repoRoot: options.repoRoot,
    changedFiles: options.changedFiles,
    now
  });
  const resume = await runResumeCommand({
    repoRoot: options.repoRoot,
    changedFiles: options.changedFiles,
    now
  });
  const session = await readCurrentSession(options.repoRoot);
  const relativeResultPath = baseframeResultRelativePath(context.taskId);
  const result = await refreshBaseframeResultIfPresent({
    repoRoot: options.repoRoot,
    session,
    changedFiles: options.changedFiles,
    now,
    artifacts: [
      { kind: "report", path: formatRepoRelativePath(options.repoRoot, report.reportPath) },
      { kind: "replay", path: formatRepoRelativePath(options.repoRoot, replay.replayPath) },
      { kind: "resume", path: formatRepoRelativePath(options.repoRoot, resume.sessionResumePath) }
    ]
  });
  if (!result) {
    throw new Error("Unable to create Baseframe result without integration context.");
  }

  await updateBaseframeWorkflowManifest({
    repoRoot: options.repoRoot,
    taskId: context.taskId,
    resultPath: relativeResultPath,
    version: result.producer.version
  });
  await appendSessionEvent(options.repoRoot, session, {
    type: "baseframe_result_generated",
    timestamp: now,
    title: "Baseframe result generated",
    metadata: {
      path: relativeResultPath,
      readiness: result.readiness,
      taskId: context.taskId
    }
  });

  return {
    output: `AgentFlight result written:
${relativeResultPath}

Next:
${formatAgentLoopKitReconciliationCommand(context.taskId, relativeResultPath)}
`,
    resultPath: `${options.repoRoot}/${relativeResultPath}`
  };
}
