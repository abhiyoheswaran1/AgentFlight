import type { ReviewProofStatus, ToolAdapterResult } from "../types/index.js";
import { formatRepoRelativePath } from "./paths.js";

export interface CommandOutput {
  output: string;
}

export interface VerificationFailureCounts {
  passed: number;
  failed: number;
  unresolvedFailed: number;
  resolvedFailed: number;
}

const DEFAULT_COMMAND_DISPLAY_LENGTH = 96;
export const AGENTFLIGHT_PROJECT_CONFIG_GUIDANCE =
  ".agentflight/config.json is project config. Review or commit it when shared AgentFlight defaults are useful.";
export const AGENTFLIGHT_RUNTIME_EVIDENCE_GUIDANCE =
  ".agentflight/sessions/, reports/, evidence/, current/ are local runtime evidence and are excluded from AgentFlight changed-file analysis.";
export const AGENTFLIGHT_GITIGNORE_GUIDANCE =
  ".agentflight/.gitignore keeps runtime evidence out of git while leaving config.json visible.";
export const PROJSCAN_MEMORY_FILTER_GUIDANCE =
  'If .projscan-memory/memory.json appears as generated tool state, add ".projscan-memory/**" to changedFileFilters.ignore in .agentflight/config.json.';

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

export function formatProofStatusForDisplay(status: ReviewProofStatus): string {
  const labels: Record<ReviewProofStatus, string> = {
    current: "current",
    stale: "stale",
    covered: "covered",
    missing: "missing",
    failed: "failed",
    not_required: "not required",
    unknown: "unknown"
  };
  return labels[status];
}

export function formatVerificationCountLine(counts: VerificationFailureCounts): string {
  const context =
    counts.failed > 0
      ? ` (${counts.unresolvedFailed} unresolved, ${counts.resolvedFailed} resolved)`
      : "";
  return `${counts.passed} passed, ${counts.failed} failed${context}`;
}

export function formatVerificationFailureContext(counts: VerificationFailureCounts): string {
  if (counts.failed === 0) return "";

  const lines: string[] = [];
  if (counts.unresolvedFailed > 0) {
    lines.push(`Unresolved failed runs: ${counts.unresolvedFailed}.`);
  }
  if (counts.resolvedFailed > 0) {
    lines.push(`Historical failed runs: ${counts.resolvedFailed} resolved by later passing runs.`);
  }
  return lines.join(" ");
}

export function formatAgentFlightGeneratedFileList(repoRoot: string, files: string[]): string {
  if (files.length === 0) return "- none";
  return files
    .map((file) => formatRepoRelativePath(repoRoot, file))
    .sort(compareAgentFlightGeneratedFilePaths)
    .map((file) => `- ${file}`)
    .join("\n");
}

export function formatAgentFlightLocalFilesGuidance(): string {
  return [
    AGENTFLIGHT_PROJECT_CONFIG_GUIDANCE,
    AGENTFLIGHT_RUNTIME_EVIDENCE_GUIDANCE,
    AGENTFLIGHT_GITIGNORE_GUIDANCE,
    PROJSCAN_MEMORY_FILTER_GUIDANCE
  ].join("\n");
}

function compareAgentFlightGeneratedFilePaths(left: string, right: string): number {
  return (
    agentFlightGeneratedFilePathPriority(left) - agentFlightGeneratedFilePathPriority(right) ||
    left.localeCompare(right)
  );
}

function agentFlightGeneratedFilePathPriority(file: string): number {
  const priorities = new Map([
    [".agentflight/config.json", 0],
    [".agentflight/.gitignore", 1]
  ]);
  return priorities.get(file) ?? 10;
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
