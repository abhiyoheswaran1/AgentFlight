import type { CommandRunner } from "../core/process.js";
import { runCommand } from "../core/process.js";
import type { ToolAdapterResult } from "../types/index.js";

export interface InspectAgentLoopKitOptions {
  cwd?: string;
  run?: CommandRunner;
  command?: string;
}

export async function inspectAgentLoopKit(
  options: InspectAgentLoopKitOptions = {}
): Promise<ToolAdapterResult> {
  const run = options.run ?? runCommand;
  const command = options.command ?? "agentloopkit";
  const version = await runWithFallback(
    run,
    command,
    "agentloopkit@latest",
    ["--version"],
    options.cwd
  );

  if (version.exitCode !== 0) {
    return {
      available: false,
      warnings: [`AgentLoopKit unavailable: ${summarizeFailure(version)}`]
    };
  }

  const doctor = await runWithFallback(
    run,
    command,
    "agentloopkit@latest",
    ["doctor"],
    options.cwd,
    20_000
  );
  const result: ToolAdapterResult = {
    available: true,
    version: version.stdout.trim(),
    summary: doctor.stdout.trim() || "AgentLoopKit available for task discipline.",
    warnings: []
  };

  if (doctor.exitCode !== 0) {
    result.warnings.push(`AgentLoopKit doctor reported issues: ${summarizeFailure(doctor)}`);
  }

  return result;
}

export async function createAgentLoopTask(
  cwd: string,
  title: string,
  run: CommandRunner = runCommand
): Promise<ToolAdapterResult> {
  const result = await runWithFallback(
    run,
    "agentloopkit",
    "agentloopkit@latest",
    [
      "create-task",
      "--title",
      title,
      "--type",
      "feature",
      "--problem",
      `AgentFlight session task: ${title}`,
      "--outcome",
      "Task is implemented with local verification evidence.",
      "--constraint",
      "Keep changes scoped and do not claim completion without proof."
    ],
    cwd,
    20_000
  );

  if (result.exitCode !== 0) {
    return {
      available: false,
      taskLinked: false,
      warnings: [`AgentLoopKit task creation failed: ${summarizeFailure(result)}`]
    };
  }

  return {
    available: true,
    taskLinked: true,
    summary: result.stdout.trim(),
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
