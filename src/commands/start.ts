import { createAgentLoopTask, inspectAgentLoopKit } from "../adapters/agentloopkit.js";
import { inspectProjScan } from "../adapters/projscan.js";
import { initAgentFlight } from "../core/config.js";
import { pathExists } from "../core/fs-safe.js";
import { getGitInfo } from "../core/git.js";
import { formatToolForReport } from "../core/output.js";
import { detectPackageManager, readPackageJson } from "../core/project.js";
import { resolveAgentFlightPaths } from "../core/paths.js";
import { startSession } from "../core/session.js";
import { detectVerificationCommands } from "../core/verification.js";
import type { GitInfo, ToolAdapterResult } from "../types/index.js";

interface StartToolInspectors {
  inspectProjScan: typeof inspectProjScan;
  inspectAgentLoopKit: typeof inspectAgentLoopKit;
  createAgentLoopTask: typeof createAgentLoopTask;
}

export interface StartCommandOptions {
  repoRoot: string;
  task: string;
  yes?: boolean | undefined;
  now?: Date | undefined;
  git?: GitInfo | undefined;
  packageManager?: string | null | undefined;
  tools?:
    | {
        projscan: ToolAdapterResult;
        agentloopkit: ToolAdapterResult;
      }
    | undefined;
}

export interface StartCommandResult {
  output: string;
  sessionId: string;
  handoffPath: string;
}

export async function runStartCommand(options: StartCommandOptions): Promise<StartCommandResult> {
  const paths = resolveAgentFlightPaths(options.repoRoot);
  if (!(await pathExists(paths.config))) {
    if (options.yes === true) {
      await initAgentFlight({ repoRoot: options.repoRoot, now: options.now });
    } else {
      throw new Error("AgentFlight is not initialized. Run agentflight init first, or pass --yes.");
    }
  }

  const packageJson = await readPackageJson(options.repoRoot);
  const verificationCommands = detectVerificationCommands(packageJson);
  const git = options.git ?? (await getGitInfo(options.repoRoot));
  const packageManager = options.packageManager ?? (await detectPackageManager(options.repoRoot));
  const tools = options.tools ?? (await inspectStartTools(options.repoRoot, options.task));

  const result = await startSession({
    repoRoot: options.repoRoot,
    task: options.task,
    now: options.now,
    git,
    packageManager,
    verificationCommands,
    tools
  });

  return {
    output: `AgentFlight started

Task:
${options.task}

Session:
${result.session.id}

Detected:
Git branch: ${git.branch ?? "unknown"}
Package manager: ${packageManager ?? "unknown"}
ProjScan: ${formatToolForReport("ProjScan", tools.projscan)}
AgentLoopKit: ${formatToolForReport("AgentLoopKit", tools.agentloopkit)}

Suggested proof:
${verificationCommands.length ? verificationCommands.join("\n") : "No proof commands detected yet."}

Handoff saved:
${result.handoffPath}

Now run your coding agent normally.
`,
    sessionId: result.session.id,
    handoffPath: result.handoffPath
  };
}

export async function inspectStartTools(
  repoRoot: string,
  task: string,
  inspectors: StartToolInspectors = {
    inspectProjScan,
    inspectAgentLoopKit,
    createAgentLoopTask
  }
): Promise<{ projscan: ToolAdapterResult; agentloopkit: ToolAdapterResult }> {
  const [projscanInspection, agentLoopInspection] = await Promise.all([
    inspectors.inspectProjScan({ cwd: repoRoot }),
    inspectors.inspectAgentLoopKit({ cwd: repoRoot, includeDoctor: false })
  ]);

  const agentLoopTask = agentLoopInspection.available
    ? await inspectors.createAgentLoopTask(repoRoot, task)
    : agentLoopInspection;

  return {
    projscan: projscanInspection,
    agentloopkit: mergeToolResults(agentLoopInspection, agentLoopTask)
  };
}

function mergeToolResults(base: ToolAdapterResult, extra: ToolAdapterResult): ToolAdapterResult {
  return {
    available: base.available && extra.available,
    ...(base.version ? { version: base.version } : {}),
    ...((extra.summary ?? base.summary) ? { summary: extra.summary ?? base.summary } : {}),
    ...(extra.taskLinked !== undefined ? { taskLinked: extra.taskLinked } : {}),
    warnings: [...base.warnings, ...extra.warnings]
  };
}
