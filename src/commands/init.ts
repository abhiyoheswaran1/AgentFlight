import { inspectAgentLoopKit } from "../adapters/agentloopkit.js";
import { inspectProjScan } from "../adapters/projscan.js";
import { initAgentFlight } from "../core/config.js";
import {
  formatAgentFlightGeneratedFileList,
  formatAgentFlightLocalFilesGuidance,
  formatToolForReport
} from "../core/output.js";
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
  const verificationCommands = Array.isArray(result.config.verification?.commands)
    ? result.config.verification.commands
    : [];
  const verificationStep =
    verificationCommands.length > 0
      ? "agentflight verify"
      : `agentflight verify -- ${result.detectedVerificationCommands[0] ?? "<proof command>"}`;

  return {
    output: `AgentFlight initialized

Project:
${result.config.projectName}

Created files:
${formatAgentFlightGeneratedFileList(options.repoRoot, result.created)}

Skipped existing files:
${formatAgentFlightGeneratedFileList(options.repoRoot, result.skipped)}

Detected:
ProjScan: ${formatToolForReport("ProjScan", tools.projscan)}
AgentLoopKit: ${formatToolForReport("AgentLoopKit", tools.agentloopkit)}

Local files:
${formatAgentFlightLocalFilesGuidance()}

Primary workflow:
agentflight start --task "Describe the work"
${verificationStep}
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
    inspectProjScan({ cwd: repoRoot, includeHelp: false }),
    inspectAgentLoopKit({ cwd: repoRoot, includeDoctor: false })
  ]);

  return { projscan, agentloopkit };
}
