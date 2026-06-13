import type { CommandRunner } from "../core/process.js";
import { runCommand } from "../core/process.js";
import type { ToolAdapterResult } from "../types/index.js";

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
  const version = await runWithFallback(
    run,
    command,
    "projscan@latest",
    ["--version"],
    options.cwd
  );

  if (version.exitCode !== 0) {
    return {
      available: false,
      warnings: [`ProjScan unavailable: ${summarizeFailure(version)}`]
    };
  }

  const help = await runWithFallback(run, command, "projscan@latest", ["--help"], options.cwd);
  const result: ToolAdapterResult = {
    available: true,
    version: version.stdout.trim(),
    summary: "ProjScan available for repo intelligence and risk analysis.",
    warnings: []
  };

  if (help.exitCode !== 0) {
    result.warnings.push(`ProjScan help failed: ${summarizeFailure(help)}`);
  }

  return result;
}

export async function runProjScanBaseline(
  cwd: string,
  run: CommandRunner = runCommand
): Promise<ToolAdapterResult> {
  const result = await runWithFallback(
    run,
    "projscan",
    "projscan@latest",
    ["start", "--intent", "Build AgentFlight, a local-first flight recorder for AI coding agents"],
    cwd,
    20_000
  );

  if (result.exitCode !== 0) {
    return {
      available: false,
      warnings: [`ProjScan baseline failed: ${summarizeFailure(result)}`]
    };
  }

  return {
    available: true,
    summary: result.stdout.split("\n").slice(0, 4).join("\n").trim(),
    warnings: []
  };
}

function summarizeFailure(result: { stdout: string; stderr: string }): string {
  return (result.stderr || result.stdout || "no output").trim();
}

async function runWithFallback(
  run: CommandRunner,
  localCommand: string,
  packageName: string,
  args: string[],
  cwd?: string,
  timeoutMs = 10_000
) {
  const local = await run(localCommand, args, { cwd, timeoutMs });
  if (local.exitCode === 0) return local;

  const fallback = await run("npx", ["--yes", packageName, ...args], { cwd, timeoutMs });
  if (fallback.exitCode === 0) return fallback;

  return {
    exitCode: fallback.exitCode,
    stdout: fallback.stdout,
    stderr: `${summarizeFailure(local)}; npx fallback failed: ${summarizeFailure(fallback)}`
  };
}
