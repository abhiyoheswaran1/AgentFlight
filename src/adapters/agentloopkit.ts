import { readFile } from "node:fs/promises";
import { join } from "node:path";
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

export async function linkAgentLoopTask(cwd: string): Promise<ToolAdapterResult> {
  const activeTask = await readActiveAgentLoopTask(cwd);
  if (activeTask) return activeTask;

  return {
    available: true,
    taskLinked: false,
    summary: "No active AgentLoopKit task linked.",
    warnings: []
  };
}

async function readActiveAgentLoopTask(cwd: string): Promise<ToolAdapterResult | null> {
  const activeTaskPath = await readActiveTaskPath(cwd);
  if (!activeTaskPath) return null;

  return {
    available: true,
    taskLinked: true,
    summary: `Using active AgentLoopKit task. Active task: ${activeTaskPath}`,
    warnings: []
  };
}

async function readActiveTaskPath(cwd: string): Promise<string | null> {
  try {
    const raw = await readFile(join(cwd, ".agentloop", "state.json"), "utf8");
    const parsed = JSON.parse(raw) as { activeTaskPath?: unknown };
    return typeof parsed.activeTaskPath === "string" && parsed.activeTaskPath.trim()
      ? parsed.activeTaskPath
      : null;
  } catch {
    return null;
  }
}
