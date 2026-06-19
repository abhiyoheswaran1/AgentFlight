import { initAgentFlight } from "../core/config.js";
import { formatToolAvailability } from "../core/output.js";

export interface InitCommandOptions {
  repoRoot: string;
  now?: Date | undefined;
}

export interface InitCommandResult {
  output: string;
}

export async function runInitCommand(options: InitCommandOptions): Promise<InitCommandResult> {
  const result = await initAgentFlight(options);

  return {
    output: `AgentFlight initialized

Project:
${result.config.projectName}

Created:
${result.created.length}

Skipped existing files:
${result.skipped.length}

Detected:
${formatToolAvailability("AgentLoopKit", result.detections.agentloopkit)}
${formatToolAvailability("ProjScan", result.detections.projscan)}

Local files:
.agentflight/config.json is project config. Review or commit it when shared AgentFlight defaults are useful.
.agentflight/sessions/, reports/, evidence/, current/ are local runtime evidence and are excluded from AgentFlight changed-file analysis.
If .projscan-memory/memory.json appears as generated tool state, add ".projscan-memory/**" to changedFileFilters.ignore in .agentflight/config.json.

Next commands:
agentflight start --task "Describe the work"
agentflight status
agentflight doctor
`
  };
}
