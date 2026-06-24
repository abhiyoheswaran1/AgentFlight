import { inspectAgentLoopKit, linkAgentLoopTask } from "../adapters/agentloopkit.js";
import { inspectProjScan } from "../adapters/projscan.js";
import { initAgentFlight, loadConfig } from "../core/config.js";
import { pathExists } from "../core/fs-safe.js";
import { getGitInfo } from "../core/git.js";
import {
  AGENTFLIGHT_PROJECT_CONFIG_GUIDANCE,
  AGENTFLIGHT_RUNTIME_EVIDENCE_GUIDANCE,
  formatAgentFlightGeneratedFileList,
  formatToolForReport
} from "../core/output.js";
import { detectPackageManager, readPackageJson } from "../core/project.js";
import { formatRepoRelativePath, resolveAgentFlightPaths } from "../core/paths.js";
import { startSession } from "../core/session.js";
import { detectVerificationCommands } from "../core/verification.js";
import type { GitInfo, ToolAdapterResult } from "../types/index.js";

interface StartToolInspectors {
  inspectProjScan: typeof inspectProjScan;
  inspectAgentLoopKit: typeof inspectAgentLoopKit;
  linkAgentLoopTask: typeof linkAgentLoopTask;
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
  const autoInitNotice = await ensureAgentFlightInitialized(options);
  const config = await loadConfig(options.repoRoot);
  const packageJson = await readPackageJson(options.repoRoot);
  const verificationCommands = detectVerificationCommands(packageJson);
  const configuredVerificationCommands = config?.verification.commands ?? [];
  const sessionVerificationCommands =
    configuredVerificationCommands.length > 0
      ? configuredVerificationCommands
      : verificationCommands;
  const git = options.git ?? (await getGitInfo(options.repoRoot));
  const packageManager = options.packageManager ?? (await detectPackageManager(options.repoRoot));
  const tools = options.tools ?? (await inspectStartTools(options.repoRoot, options.task));

  const result = await startSession({
    repoRoot: options.repoRoot,
    task: options.task,
    now: options.now,
    git,
    packageManager,
    verificationCommands: sessionVerificationCommands,
    tools
  });
  const initializedSection = autoInitNotice ? `\n${autoInitNotice}\n` : "\n";

  return {
    output: `AgentFlight started

Task:
${options.task}

Session:
${result.session.id}
${initializedSection}Detected:
Git branch: ${git.branch ?? "unknown"}
Package manager: ${packageManager ?? "unknown"}
ProjScan: ${formatToolForReport("ProjScan", tools.projscan)}
AgentLoopKit: ${formatToolForReport("AgentLoopKit", tools.agentloopkit)}

Suggested proof:
${formatSuggestedProof(configuredVerificationCommands, verificationCommands)}

Handoff saved:
${formatRepoRelativePath(options.repoRoot, result.handoffPath)}

Now run your coding agent normally.
`,
    sessionId: result.session.id,
    handoffPath: result.handoffPath
  };
}

function formatSuggestedProof(configuredCommands: string[], detectedCommands: string[]): string {
  if (configuredCommands.length > 0) {
    return `agentflight verify
Configured commands:
${configuredCommands.map((command) => `- ${command}`).join("\n")}`;
  }

  return detectedCommands.length ? detectedCommands.join("\n") : "No proof commands detected yet.";
}

async function ensureAgentFlightInitialized(options: StartCommandOptions): Promise<string> {
  const paths = resolveAgentFlightPaths(options.repoRoot);
  if (await pathExists(paths.config)) return "";
  if (options.yes !== true) {
    throw new Error("AgentFlight is not initialized. Run agentflight init first, or pass --yes.");
  }

  const initResult = await initAgentFlight({ repoRoot: options.repoRoot, now: options.now });
  return formatAutoInitNotice(options.repoRoot, initResult.created);
}

function formatAutoInitNotice(repoRoot: string, created: string[]): string {
  if (created.length === 0) return "";

  return `Initialized:
${formatAgentFlightGeneratedFileList(repoRoot, created)}
${AGENTFLIGHT_PROJECT_CONFIG_GUIDANCE}
${AGENTFLIGHT_RUNTIME_EVIDENCE_GUIDANCE}
`;
}

export async function inspectStartTools(
  repoRoot: string,
  _task: string,
  inspectors: StartToolInspectors = {
    inspectProjScan,
    inspectAgentLoopKit,
    linkAgentLoopTask
  }
): Promise<{ projscan: ToolAdapterResult; agentloopkit: ToolAdapterResult }> {
  const [projscanInspection, agentLoopInspection] = await Promise.all([
    inspectors.inspectProjScan({ cwd: repoRoot, includeHelp: false }),
    inspectors.inspectAgentLoopKit({ cwd: repoRoot, includeDoctor: false })
  ]);

  const agentLoopTask = agentLoopInspection.available
    ? await inspectors.linkAgentLoopTask(repoRoot)
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
