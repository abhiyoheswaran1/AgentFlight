import { inspectAgentLoopKit } from "../adapters/agentloopkit.js";
import { inspectProjScan } from "../adapters/projscan.js";
import { initAgentFlight } from "../core/config.js";
import { formatToolForReport } from "../core/output.js";
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

Created:
${result.created.length}

Skipped existing files:
${result.skipped.length}

Detected:
ProjScan: ${formatToolForReport("ProjScan", tools.projscan)}
AgentLoopKit: ${formatToolForReport("AgentLoopKit", tools.agentloopkit)}

Local files:
.agentflight/config.json is project config. Review or commit it when shared AgentFlight defaults are useful.
.agentflight/sessions/, reports/, evidence/, current/ are local runtime evidence and are excluded from AgentFlight changed-file analysis.
.agentflight/.gitignore keeps runtime evidence out of git while leaving config.json visible.
If .projscan-memory/memory.json appears as generated tool state, add ".projscan-memory/**" to changedFileFilters.ignore in .agentflight/config.json.

Next commands:
agentflight start --task "Describe the work"
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
