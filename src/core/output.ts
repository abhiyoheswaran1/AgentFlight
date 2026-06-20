import type { ToolAdapterResult } from "../types/index.js";

export interface CommandOutput {
  output: string;
}

const DEFAULT_COMMAND_DISPLAY_LENGTH = 96;

export function formatToolAvailability(label: string, available: boolean): string {
  return `${label}: ${available ? "available" : "unavailable"}`;
}

export function renderStatus(status: "ok" | "warning" | "error"): string {
  if (status === "ok") return "OK";
  if (status === "warning") return "Warning";
  return "Error";
}

export function formatCommandForDisplay(
  command: string,
  options: { maxLength?: number } = {}
): string {
  const maxLength = options.maxLength ?? DEFAULT_COMMAND_DISPLAY_LENGTH;
  const normalized = command.trim().replace(/\s+/g, " ");
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(1, maxLength - 1)).trimEnd()}…`;
}

export function formatVerifyCommandForDisplay(command: string): string {
  return `agentflight verify -- ${formatCommandForDisplay(command)}`;
}

export function compactCommandInText(text: string, command: string | undefined): string {
  if (!command) return text;
  return text.split(command).join(formatCommandForDisplay(command));
}

export function formatToolForReport(label: string, result: ToolAdapterResult): string {
  const status = result.available ? "available" : "unavailable";
  const version = result.version ? ` ${result.version}` : "";
  const stateDetails = summarizeToolState(label, result);
  const warnings = result.warnings.map((warning) => summarizeToolWarning(label, warning));
  const details = [...stateDetails, ...warnings];
  const detailText = details.length ? ` (${details.join("; ")})` : "";
  return `${status}${version}${detailText}`;
}

function summarizeToolState(label: string, result: ToolAdapterResult): string[] {
  if (label !== "AgentLoopKit" || !result.available || result.taskLinked === undefined) {
    return [];
  }

  return [result.taskLinked ? "active task linked" : "no active task linked"];
}

function summarizeToolWarning(label: string, warning: string): string {
  if (label === "ProjScan") {
    if (warning.startsWith("ProjScan baseline skipped:")) {
      return "ProjScan baseline skipped; run projscan start for details.";
    }
    if (warning.startsWith("ProjScan unavailable:")) {
      return "ProjScan unavailable; run npx projscan@latest doctor for details.";
    }
  }

  if (label === "AgentLoopKit") {
    if (warning.startsWith("AgentLoopKit doctor reported issues:")) {
      return "AgentLoopKit doctor reported issues; run agentloopkit doctor for details.";
    }
    if (warning.startsWith("AgentLoopKit unavailable:")) {
      return "AgentLoopKit unavailable; run npx agentloopkit@latest doctor for details.";
    }
    if (
      warning.startsWith("AgentLoopKit task creation failed:") ||
      warning.startsWith("AgentLoopKit task link check failed:")
    ) {
      return "AgentLoopKit task link check needs attention; run agentloopkit status for details.";
    }
  }

  return formatCommandForDisplay(warning, { maxLength: 180 });
}
