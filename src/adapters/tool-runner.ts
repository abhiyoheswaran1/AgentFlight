import { join } from "node:path";
import type { CommandResult, CommandRunner } from "../core/process.js";

export interface RunToolWithFallbackOptions {
  run: CommandRunner;
  localCommand: string;
  packageName: string;
  args: string[];
  cwd?: string | undefined;
  timeoutMs?: number | undefined;
}

export async function runToolWithFallback(
  options: RunToolWithFallbackOptions
): Promise<CommandResult> {
  const timeoutMs = options.timeoutMs ?? 10_000;
  const localFailures: CommandResult[] = [];
  for (const candidate of repoLocalCommandCandidates(options.localCommand, options.cwd)) {
    const local = await options.run(candidate, options.args, { cwd: options.cwd, timeoutMs });
    if (local.exitCode === 0) return local;
    localFailures.push(local);
  }

  const fallback = await options.run("npx", ["--yes", options.packageName, ...options.args], {
    cwd: options.cwd,
    timeoutMs
  });
  if (fallback.exitCode === 0) return fallback;

  const pathCommand = await options.run(options.localCommand, options.args, {
    cwd: options.cwd,
    timeoutMs
  });
  if (pathCommand.exitCode === 0) return pathCommand;

  return {
    exitCode: pathCommand.exitCode,
    stdout: pathCommand.stdout,
    stderr: `${localFailures.map(summarizeToolFailure).join("; ")}; npx fallback failed: ${summarizeToolFailure(fallback)}; PATH command failed: ${summarizeToolFailure(pathCommand)}`
  };
}

export function summarizeToolFailure(result: { stdout: string; stderr: string }): string {
  return (result.stderr || result.stdout || "no output").trim();
}

export function normalizeCliVersion(output: string): string {
  const trimmed = output.trim();
  const match = trimmed.match(/\bv?(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)\b/);
  return match?.[1] ?? trimmed;
}

function repoLocalCommandCandidates(command: string, cwd?: string): string[] {
  if (!cwd || command.includes("/") || command.includes("\\")) return [];
  const executable = process.platform === "win32" ? `${command}.cmd` : command;
  return [join(cwd, "node_modules", ".bin", executable)];
}
