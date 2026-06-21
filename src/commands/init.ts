import { inspectAgentLoopKit } from "../adapters/agentloopkit.js";
import { inspectProjScan } from "../adapters/projscan.js";
import { initAgentFlight } from "../core/config.js";
import { formatToolForReport } from "../core/output.js";
import { formatRepoRelativePath } from "../core/paths.js";
import type { ToolAdapterResult } from "../types/index.js";

export interface InitCommandOptions {
  repoRoot: string;
  now?: Date | undefined;
  tools?:
    | {
        projscan: ToolAdapterResult;
        agentloopkit: ToolAdapterResult;
      }
    | undefined;
}

export interface InitCommandResult {
  output: string;
}

export async function runInitCommand(options: InitCommandOptions): Promise<InitCommandResult> {
  const result = await initAgentFlight(options);
  const tools = options.tools ?? (await inspectInitTools(options.repoRoot));

  return {
    output: `AgentFlight initialized

Project:
${result.config.projectName}

Created files:
${formatInitFileList(options.repoRoot, result.created)}

Skipped existing files:
${formatInitFileList(options.repoRoot, result.skipped)}

Detected:
ProjScan: ${formatToolForReport("ProjScan", tools.projscan)}
AgentLoopKit: ${formatToolForReport("AgentLoopKit", tools.agentloopkit)}

Local files:
.agentflight/config.json is project config. Review or commit it when shared AgentFlight defaults are useful.
.agentflight/sessions/, reports/, evidence/, current/ are local runtime evidence and are excluded from AgentFlight changed-file analysis.
.agentflight/.gitignore keeps runtime evidence out of git while leaving config.json visible.
If .projscan-memory/memory.json appears as generated tool state, add ".projscan-memory/**" to changedFileFilters.ignore in .agentflight/config.json.

Primary workflow:
agentflight start --task "Describe the work"
agentflight verify -- npm test
agentflight handoff

Supporting checks:
agentflight status
agentflight doctor
`
  };
}

async function inspectInitTools(
  repoRoot: string
): Promise<{ projscan: ToolAdapterResult; agentloopkit: ToolAdapterResult }> {
  const [projscan, agentloopkit] = await Promise.all([
    inspectProjScan({ cwd: repoRoot }),
    inspectAgentLoopKit({ cwd: repoRoot, includeDoctor: false })
  ]);

  return { projscan, agentloopkit };
}

function formatInitFileList(repoRoot: string, files: string[]): string {
  if (files.length === 0) return "- none";
  return files
    .map((file) => formatRepoRelativePath(repoRoot, file))
    .sort(compareInitFilePaths)
    .map((file) => `- ${file}`)
    .join("\n");
}

function compareInitFilePaths(left: string, right: string): number {
  return initFilePathPriority(left) - initFilePathPriority(right) || left.localeCompare(right);
}

function initFilePathPriority(file: string): number {
  const priorities = new Map([
    [".agentflight/config.json", 0],
    [".agentflight/.gitignore", 1]
  ]);
  return priorities.get(file) ?? 10;
}
