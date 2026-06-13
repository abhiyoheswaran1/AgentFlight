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

Next commands:
agentflight start --task "Describe the work"
agentflight status
agentflight doctor
`
  };
}
