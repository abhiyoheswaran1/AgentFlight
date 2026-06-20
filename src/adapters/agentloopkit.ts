import type { CommandRunner } from "../core/process.js";
import { runCommand } from "../core/process.js";
import type { ToolAdapterResult } from "../types/index.js";
import { normalizeCliVersion, runToolWithFallback, summarizeToolFailure } from "./tool-runner.js";

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
  const version = await runToolWithFallback({
    run,
    localCommand: command,
    packageName: "agentloopkit@latest",
    args: ["--version"],
    cwd: options.cwd
  });

  if (version.exitCode !== 0) {
    return {
      available: false,
      warnings: [`AgentLoopKit unavailable: ${summarizeToolFailure(version)}`]
    };
  }

  if (options.includeDoctor === false) {
    return {
      available: true,
      version: normalizeCliVersion(version.stdout),
      summary: "AgentLoopKit available for task discipline.",
      warnings: []
    };
  }

  const doctor = await runToolWithFallback({
    run,
    localCommand: command,
    packageName: "agentloopkit@latest",
    args: ["doctor"],
    cwd: options.cwd,
    timeoutMs: 20_000
  });
  const result: ToolAdapterResult = {
    available: true,
    version: normalizeCliVersion(version.stdout),
    summary: doctor.stdout.trim() || "AgentLoopKit available for task discipline.",
    warnings: []
  };

  if (doctor.exitCode !== 0) {
    result.warnings.push(`AgentLoopKit doctor reported issues: ${summarizeToolFailure(doctor)}`);
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

  const result = await runToolWithFallback({
    run,
    localCommand: "agentloopkit",
    packageName: "agentloopkit@latest",
    args: [
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
    timeoutMs: 20_000
  });

  if (result.exitCode !== 0) {
    return {
      available: false,
      taskLinked: false,
      warnings: [`AgentLoopKit task creation failed: ${summarizeToolFailure(result)}`]
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
  const status = await runToolWithFallback({
    run,
    localCommand: "agentloopkit",
    packageName: "agentloopkit@latest",
    args: ["status", "--redact-paths"],
    cwd,
    timeoutMs: 5_000
  });

  if (status.exitCode !== 0) return null;
  const activeLine = status.stdout
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.includes("Active task:"));

  if (!activeLine || isNoActiveAgentLoopTaskLine(activeLine)) return null;

  return {
    available: true,
    taskLinked: true,
    summary: `Using active AgentLoopKit task. ${activeLine.replace(/^- /, "")}`,
    warnings: []
  };
}

function isNoActiveAgentLoopTaskLine(activeLine: string): boolean {
  const normalized = activeLine.toLowerCase();
  return (
    normalized.includes("none active") ||
    normalized.includes("none pinned") ||
    normalized.includes("no active task")
  );
}
