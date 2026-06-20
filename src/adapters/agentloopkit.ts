import { join } from "node:path";
import type { CommandRunner } from "../core/process.js";
import { runCommand } from "../core/process.js";
import type { ToolAdapterResult } from "../types/index.js";

export interface InspectAgentLoopKitOptions {
  cwd?: string;
  run?: CommandRunner;
  command?: string;
  includeDoctor?: boolean;
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

  if (options.includeDoctor === false) {
    return {
      available: true,
      version: normalizeVersion(version.stdout),
      summary: "AgentLoopKit available for task discipline.",
      warnings: []
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
    version: normalizeVersion(version.stdout),
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
  const activeTask = await findActiveAgentLoopTask(cwd, run);
  if (activeTask) return activeTask;

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

async function findActiveAgentLoopTask(
  cwd: string,
  run: CommandRunner
): Promise<ToolAdapterResult | null> {
  const status = await runWithFallback(
    run,
    "agentloopkit",
    "agentloopkit@latest",
    ["status", "--redact-paths"],
    cwd,
    5_000
  );

  if (status.exitCode !== 0) return null;
  const activeLine = status.stdout
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.includes("Active task:"));

  if (!activeLine || activeLine.includes("none active")) return null;

  return {
    available: true,
    taskLinked: true,
    summary: `Using active AgentLoopKit task. ${activeLine.replace(/^- /, "")}`,
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
  const localFailures: Array<{ stdout: string; stderr: string }> = [];
  for (const candidate of repoLocalCommandCandidates(localCommand, cwd)) {
    const local = await run(candidate, args, { cwd, timeoutMs });
    if (local.exitCode === 0) return local;
    localFailures.push(local);
  }

  const fallback = await run("npx", ["--yes", packageName, ...args], { cwd, timeoutMs });
  if (fallback.exitCode === 0) return fallback;

  const pathCommand = await run(localCommand, args, { cwd, timeoutMs });
  if (pathCommand.exitCode === 0) return pathCommand;

  return {
    exitCode: pathCommand.exitCode,
    stdout: pathCommand.stdout,
    stderr: `${localFailures.map(summarizeFailure).join("; ")}; npx fallback failed: ${summarizeFailure(fallback)}; PATH command failed: ${summarizeFailure(pathCommand)}`
  };
}

function repoLocalCommandCandidates(command: string, cwd?: string): string[] {
  if (!cwd || command.includes("/") || command.includes("\\")) return [];
  const executable = process.platform === "win32" ? `${command}.cmd` : command;
  return [join(cwd, "node_modules", ".bin", executable)];
}

function normalizeVersion(output: string): string {
  const trimmed = output.trim();
  const match = trimmed.match(/\bv?(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)\b/);
  return match?.[1] ?? trimmed;
}
