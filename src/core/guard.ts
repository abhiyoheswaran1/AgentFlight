import { formatFileListForDisplay, formatVerifyCommandForDisplay } from "./output.js";
import type {
  AgentFlightGuardArtifactHints,
  AgentFlightGuardSignal,
  AgentFlightGuardSummary,
  AgentFlightResultV1,
  ProofGap,
  ReviewQueueItem,
  ReviewReadinessDecision,
  ReviewRouteItem,
  ReviewRoutes,
  TrustDelta
} from "../types/index.js";

export interface CreateAgentFlightGuardSummaryInput {
  generatedAt: Date;
  task: { title: string };
  changedFiles: string[];
  verification: {
    passed: number;
    failed: number;
    unresolvedFailed: number;
    resolvedFailed: number;
  };
  artifactHints?: AgentFlightGuardArtifactHints | undefined;
  review: {
    readiness: Pick<
      ReviewReadinessDecision,
      "state" | "label" | "reason" | "nextAction" | "suggestedCommand"
    >;
    proofGaps: ProofGap[];
    trustDelta?: TrustDelta | undefined;
    reviewQueue?: ReviewQueueItem[] | undefined;
    reviewRoutes?: ReviewRoutes | { items: ReviewRouteItem[] } | undefined;
  };
  baseframe?: AgentFlightResultV1 | null | undefined;
  nextAction: string;
}

export function createAgentFlightGuardSummary(
  input: CreateAgentFlightGuardSummaryInput
): AgentFlightGuardSummary {
  const signals = [
    ...proofGapSignals(input.review.proofGaps),
    ...baseframeScopeDriftSignals(input.baseframe),
    ...baseframeGateSignals(input.baseframe),
    ...reviewReceiptSignals(input.review.trustDelta)
  ];
  const finalSignals = signals.length > 0 ? dedupeSignals(signals) : [readySignal()];

  return {
    schemaVersion: "1.0",
    kind: "agentflight-guard-summary",
    generatedAt: input.generatedAt.toISOString(),
    taskTitle: input.task.title,
    readiness: {
      state: input.review.readiness.state,
      label: input.review.readiness.label,
      reason: input.review.readiness.reason,
      nextAction: input.review.readiness.nextAction,
      ...(input.review.readiness.suggestedCommand
        ? { suggestedCommand: input.review.readiness.suggestedCommand }
        : {})
    },
    changedFiles: {
      count: input.changedFiles.length,
      paths: input.changedFiles
    },
    verification: {
      passed: input.verification.passed,
      failed: input.verification.failed,
      unresolvedFailed: input.verification.unresolvedFailed,
      resolvedFailed: input.verification.resolvedFailed
    },
    ...(input.artifactHints ? { artifactHints: input.artifactHints } : {}),
    ...(input.baseframe ? { baseframe: baseframeSummary(input.baseframe) } : {}),
    signals: finalSignals,
    reviewQueue: input.review.reviewQueue ?? [],
    reviewRoutes: input.review.reviewRoutes?.items ?? [],
    nextAction: input.nextAction,
    localOnly: true
  };
}

export function renderAgentFlightGuardSummary(summary: AgentFlightGuardSummary): string {
  return `AgentFlight guard

Task:
${summary.taskTitle}

Trust state:
${summary.readiness.label}

Changed files:
${summary.changedFiles.count}

Verification:
${summary.verification.passed} passed, ${summary.verification.failed} failed
${formatArtifactHintSection(summary)}
${formatBaseframeGuardSection(summary)}
Trust signals:
${formatGuardSignals(summary.signals)}

Next action:
${summary.nextAction}

Local only: no upload, no telemetry, no automatic PR comment.
`;
}

function proofGapSignals(gaps: ProofGap[]): AgentFlightGuardSignal[] {
  return gaps.map((gap) => ({
    id: gap.id,
    severity: gap.severity,
    source: "agentflight",
    category: "proof-gap",
    message: gap.message,
    relatedFiles: gap.relatedFiles,
    ...(gap.suggestedCommand ? { suggestedCommand: gap.suggestedCommand } : {})
  }));
}

function baseframeScopeDriftSignals(
  result: AgentFlightResultV1 | null | undefined
): AgentFlightGuardSignal[] {
  return (result?.scopeDrift ?? []).map((finding) => ({
    id: `baseframe-scope-${finding.path}`,
    severity: finding.reason === "inside-excluded-scope" ? "blocking" : "warning",
    source: "baseframe",
    category: "scope-drift",
    message: scopeDriftMessage(finding.path, finding.reason),
    relatedFiles: [finding.path]
  }));
}

function scopeDriftMessage(path: string, reason: string): string {
  if (reason === "inside-excluded-scope") {
    return `${path} changed inside excluded Baseframe scope.`;
  }
  if (reason === "outside-allowed-scope") {
    return `${path} changed outside declared Baseframe scope.`;
  }
  return `${path} changed without declared Baseframe scope classification.`;
}

function baseframeGateSignals(
  result: AgentFlightResultV1 | null | undefined
): AgentFlightGuardSignal[] {
  return (result?.gates ?? [])
    .filter((gate) => gate.status !== "passed")
    .map((gate) => ({
      id: `baseframe-gate-${gate.gateId}`,
      severity: gate.status === "skipped" ? "warning" : "blocking",
      source: "baseframe",
      category: "verification-gate",
      message: `Baseframe gate ${gate.gateId} is ${gate.status}: ${gate.command}`,
      relatedFiles: [],
      suggestedCommand: gate.command
    }));
}

function reviewReceiptSignals(trustDelta: TrustDelta | undefined): AgentFlightGuardSignal[] {
  return (trustDelta?.items ?? [])
    .filter((item) => item.kind === "stale_receipt")
    .map((item) => ({
      id: `review-receipt-${item.kind}`,
      severity: item.severity,
      source: "agentflight",
      category: "review-receipt",
      message: item.message,
      relatedFiles: item.relatedFiles,
      ...(item.suggestedCommand ? { suggestedCommand: item.suggestedCommand } : {})
    }));
}

function readySignal(): AgentFlightGuardSignal {
  return {
    id: "ready-for-review",
    severity: "info",
    source: "agentflight",
    category: "readiness",
    message: "No blocking guard signals detected.",
    relatedFiles: []
  };
}

function dedupeSignals(signals: AgentFlightGuardSignal[]): AgentFlightGuardSignal[] {
  const seen = new Set<string>();
  return signals.filter((signal) => {
    const key = `${signal.source}:${signal.category}:${signal.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function baseframeSummary(
  result: AgentFlightResultV1
): NonNullable<AgentFlightGuardSummary["baseframe"]> {
  return {
    taskId: result.taskId,
    readiness: result.readiness,
    gateCounts: {
      passed: countGates(result, "passed"),
      failed: countGates(result, "failed"),
      incomplete: countGates(result, "incomplete"),
      missing: countGates(result, "missing"),
      skipped: countGates(result, "skipped")
    },
    scopeDriftCount: result.scopeDrift.length
  };
}

function countGates(
  result: AgentFlightResultV1,
  status: AgentFlightResultV1["gates"][number]["status"]
): number {
  return result.gates.filter((gate) => gate.status === status).length;
}

function formatBaseframeGuardSection(summary: AgentFlightGuardSummary): string {
  if (!summary.baseframe) return "";
  const gates = summary.baseframe.gateCounts;
  return `
Baseframe:
task ${summary.baseframe.taskId}
gates ${gates.passed} passed, ${gates.failed} failed, ${gates.incomplete} incomplete, ${gates.missing} missing, ${gates.skipped} skipped
scope drift ${summary.baseframe.scopeDriftCount}
`;
}

function formatArtifactHintSection(summary: AgentFlightGuardSummary): string {
  if (!summary.artifactHints) return "";
  return `
Finish targets:
- Review Passport JSON: ${summary.artifactHints.reviewPassportJson}
- Review Passport Markdown: ${summary.artifactHints.reviewPassportMarkdown}
${summary.artifactHints.baseframeResult ? `- Baseframe result: ${summary.artifactHints.baseframeResult}\n` : ""}`;
}

function formatGuardSignals(signals: AgentFlightGuardSignal[]): string {
  return signals.map(formatGuardSignal).join("\n");
}

function formatGuardSignal(signal: AgentFlightGuardSignal): string {
  return [
    `- ${signal.severity} - ${signal.message}`,
    signal.relatedFiles.length > 0
      ? `  Files: ${formatFileListForDisplay(signal.relatedFiles)}`
      : undefined,
    signal.suggestedCommand
      ? `  Suggested proof: ${formatVerifyCommandForDisplay(signal.suggestedCommand)}`
      : undefined
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}
