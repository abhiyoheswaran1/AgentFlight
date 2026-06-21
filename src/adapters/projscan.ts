import type { CommandRunner } from "../core/process.js";
import { runCommand } from "../core/process.js";
import type { ToolAdapterResult } from "../types/index.js";
import { normalizeCliVersion, runToolWithFallback, summarizeToolFailure } from "./tool-runner.js";

const PROJSCAN_BASELINE_TIMEOUT_MS = 1_500;

export interface InspectProjScanOptions {
  cwd?: string;
  run?: CommandRunner;
  command?: string;
}

export async function inspectProjScan(
  options: InspectProjScanOptions = {}
): Promise<ToolAdapterResult> {
  const run = options.run ?? runCommand;
  const command = options.command ?? "projscan";
  const version = await runToolWithFallback({
    run,
    localCommand: command,
    packageName: "projscan@latest",
    args: ["--version"],
    cwd: options.cwd
  });

  if (version.exitCode !== 0) {
    return {
      available: false,
      warnings: [`ProjScan unavailable: ${summarizeToolFailure(version)}`]
    };
  }

  const help = await runToolWithFallback({
    run,
    localCommand: command,
    packageName: "projscan@latest",
    args: ["--help"],
    cwd: options.cwd
  });
  const result: ToolAdapterResult = {
    available: true,
    version: normalizeCliVersion(version.stdout),
    summary: "ProjScan available for repo intelligence and risk analysis.",
    warnings: []
  };

  if (help.exitCode !== 0) {
    result.warnings.push(`ProjScan help failed: ${summarizeToolFailure(help)}`);
  }

  return result;
}

export async function runProjScanBaseline(
  cwd: string,
  run: CommandRunner = runCommand
): Promise<ToolAdapterResult> {
  const result = await runToolWithFallback({
    run,
    localCommand: "projscan",
    packageName: "projscan@latest",
    args: [
      "start",
      "--intent",
      "Build AgentFlight, a local-first review layer for coding agent sessions"
    ],
    cwd,
    timeoutMs: PROJSCAN_BASELINE_TIMEOUT_MS
  });

  if (result.exitCode !== 0) {
    return {
      available: true,
      warnings: [`ProjScan baseline skipped: ${summarizeToolFailure(result)}`]
    };
  }

  return {
    available: true,
    summary: result.stdout.split("\n").slice(0, 4).join("\n").trim(),
    warnings: []
  };
}
