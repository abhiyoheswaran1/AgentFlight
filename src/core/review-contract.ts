import type {
  ProofGap,
  ReviewContract,
  ReviewContractClaim,
  ReviewContractClaimStatus,
  ReviewContractProofReference,
  ReviewContractSummary,
  ReviewFocusItem,
  ReviewProofStatus,
  ReviewReadinessDecision,
  ReviewReadinessState
} from "../types/index.js";

export interface BuildReviewContractOptions {
  taskTitle: string;
  focus: ReviewFocusItem[];
  proofGaps: ProofGap[];
  readiness: ReviewReadinessDecision;
}

export function buildReviewContract(options: BuildReviewContractOptions): ReviewContract {
  const claims = [
    buildTaskClaim(options.taskTitle, options.readiness),
    ...options.focus.map(buildFileClaim),
    ...options.proofGaps.map(buildProofGapClaim),
    buildReadinessClaim(options.readiness)
  ];

  return {
    summary: summarizeContractClaims(claims),
    reviewPath: buildReviewPath(claims, options.readiness),
    claims
  };
}

export function summarizeContractClaims(claims: ReviewContractClaim[]): ReviewContractSummary {
  const summary: ReviewContractSummary = {
    total: claims.length,
    supported: 0,
    needsReview: 0,
    unsupported: 0,
    failed: 0,
    stale: 0,
    notTestable: 0,
    unknown: 0
  };

  for (const claim of claims) {
    incrementSummary(summary, claim.status);
  }

  return summary;
}

function buildTaskClaim(
  taskTitle: string,
  readiness: ReviewReadinessDecision
): ReviewContractClaim {
  const status = statusFromReadiness(readiness.state);
  return {
    id: "task-session-task",
    text: `Session task: ${taskTitle}`,
    status,
    source: "task",
    reason: readiness.reason,
    files: [],
    evidence: [`Readiness: ${readiness.label}`],
    proofReferences: [
      {
        kind: "readiness_reason",
        label: `Readiness: ${readiness.label}`,
        target: "review-readiness"
      },
      ...proofGapReferences(readiness.proofGaps.map((gap) => gap.id)),
      ...suggestedCommandReference(readiness.suggestedCommand)
    ],
    relatedProofGapIds: readiness.proofGaps.map((gap) => gap.id),
    ...(readiness.suggestedCommand ? { suggestedCommand: readiness.suggestedCommand } : {}),
    nextAction: readiness.nextAction
  };
}

function buildFileClaim(item: ReviewFocusItem): ReviewContractClaim {
  const status = statusFromProofStatus(item.proofStatus);
  const focusTarget = `review-focus-file-${stableId(item.file)}`;
  return {
    id: `file-${stableId(item.file)}`,
    text: `Changed file reviewed: ${item.file}`,
    status,
    source: "file",
    reason: item.reasons.join("; "),
    files: [item.file],
    evidence: fileClaimEvidence(item),
    proofReferences: [
      {
        kind: "changed_file",
        label: `Changed file: ${item.file}`,
        target: focusTarget
      },
      {
        kind: "proof_snapshot",
        label: `Proof status: ${formatProofStatusForContract(item.proofStatus)}`,
        target: focusTarget
      },
      ...proofGapReferences(item.relatedProofGapIds),
      ...suggestedCommandReference(item.suggestedCommand)
    ],
    relatedProofGapIds: item.relatedProofGapIds,
    ...(item.suggestedCommand ? { suggestedCommand: item.suggestedCommand } : {}),
    ...(status === "needs_review"
      ? { nextAction: "Review manually; no automated proof is required for this file." }
      : {})
  };
}

function buildProofGapClaim(gap: ProofGap): ReviewContractClaim {
  return {
    id: `proof-gap-${stableId(gap.id)}`,
    text: gap.message,
    status: statusFromProofGap(gap),
    source: "proof_gap",
    reason: gap.message,
    files: gap.relatedFiles,
    evidence: [`Proof gap: ${gap.id}`],
    proofReferences: [
      {
        kind: "proof_gap",
        label: `Proof gap: ${gap.id}`,
        target: `proof-gap-${stableId(gap.id)}`
      },
      ...gap.relatedFiles.map((file) => ({
        kind: "changed_file" as const,
        label: `Changed file: ${file}`,
        target: `review-focus-file-${stableId(file)}`
      })),
      ...suggestedCommandReference(gap.suggestedCommand)
    ],
    relatedProofGapIds: [gap.id],
    ...(gap.suggestedCommand ? { suggestedCommand: gap.suggestedCommand } : {})
  };
}

function buildReadinessClaim(readiness: ReviewReadinessDecision): ReviewContractClaim {
  return {
    id: "readiness-review-readiness",
    text: `Review readiness: ${readiness.label}`,
    status: statusFromReadiness(readiness.state),
    source: "readiness",
    reason: readiness.reason,
    files: [],
    evidence: [`Readiness: ${readiness.label}`],
    proofReferences: [
      {
        kind: "readiness_reason",
        label: `Readiness: ${readiness.label}`,
        target: "review-readiness"
      },
      ...proofGapReferences(readiness.proofGaps.map((gap) => gap.id)),
      ...suggestedCommandReference(readiness.suggestedCommand)
    ],
    relatedProofGapIds: readiness.proofGaps.map((gap) => gap.id),
    ...(readiness.suggestedCommand ? { suggestedCommand: readiness.suggestedCommand } : {}),
    nextAction: readiness.nextAction
  };
}

function fileClaimEvidence(item: ReviewFocusItem): string[] {
  const evidence = [`Proof: ${item.proofStatus}`];
  evidence.push(...item.relatedProofGapIds.map((id) => `Gap: ${id}`));
  return evidence;
}

function statusFromProofStatus(status: ReviewProofStatus): ReviewContractClaimStatus {
  const statuses: Record<ReviewProofStatus, ReviewContractClaimStatus> = {
    current: "supported",
    covered: "supported",
    failed: "failed",
    missing: "unsupported",
    not_required: "needs_review",
    stale: "stale",
    unknown: "unknown"
  };
  return statuses[status];
}

function statusFromProofGap(gap: ProofGap): ReviewContractClaimStatus {
  if (gap.id === "failed-verification") return "failed";
  if (gap.id === "stale-verification-proof") return "stale";
  if (gap.severity === "info") return "needs_review";
  return "unsupported";
}

function statusFromReadiness(state: ReviewReadinessState): ReviewContractClaimStatus {
  const statuses: Record<ReviewReadinessState, ReviewContractClaimStatus> = {
    ready_for_review: "supported",
    blocked_by_failed_verification: "failed",
    needs_verification: "unsupported",
    not_ready_for_review: "unsupported",
    clean_worktree: "not_testable",
    unknown: "unknown"
  };
  return statuses[state];
}

function incrementSummary(summary: ReviewContractSummary, status: ReviewContractClaimStatus): void {
  if (status === "needs_review") {
    summary.needsReview += 1;
    return;
  }
  if (status === "not_testable") {
    summary.notTestable += 1;
    return;
  }
  summary[status] += 1;
}

function buildReviewPath(
  claims: ReviewContractClaim[],
  readiness: ReviewReadinessDecision
): NonNullable<ReviewContract["reviewPath"]> {
  const inspectClaimIds = [...claims]
    .sort(compareClaimsForReviewPath)
    .slice(0, 5)
    .map((claim) => claim.id);

  return {
    summary: buildReviewPathSummary(summarizeContractClaims(claims)),
    nextAction: readiness.nextAction,
    inspectClaimIds
  };
}

function buildReviewPathSummary(summary: ReviewContractSummary): string {
  if (summary.failed === 0 && summary.stale === 0 && summary.unsupported === 0) {
    if (summary.needsReview > 0) {
      return `Ready for review with ${formatClaimCount(summary.supported, "supported")} and ${formatClaimCount(summary.needsReview, "manual-review")}.`;
    }
    return `All ${summary.supported} supported claims are ready for review.`;
  }

  const parts = [
    formatClaimCount(summary.failed, "failed"),
    formatClaimCount(summary.stale, "stale"),
    formatClaimCount(summary.unsupported, "unsupported"),
    formatClaimCount(summary.needsReview, "manual-review")
  ].filter((part) => !part.startsWith("0 "));

  return `Review ${formatSeries(parts)} before sharing.`;
}

function formatClaimCount(count: number, label: string): string {
  return `${count} ${label} claim${count === 1 ? "" : "s"}`;
}

function formatSeries(parts: string[]): string {
  if (parts.length === 0) return "0 claims";
  if (parts.length === 1) return parts[0]!;
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

function compareClaimsForReviewPath(left: ReviewContractClaim, right: ReviewContractClaim): number {
  return (
    claimPriority(left) - claimPriority(right) ||
    sourcePriority(left.source) - sourcePriority(right.source) ||
    left.id.localeCompare(right.id)
  );
}

function claimPriority(claim: ReviewContractClaim): number {
  const priorities: Record<ReviewContractClaimStatus, number> = {
    failed: 0,
    stale: 1,
    unsupported: 2,
    needs_review: 3,
    unknown: 4,
    not_testable: 5,
    supported: 6
  };
  return priorities[claim.status];
}

function sourcePriority(source: ReviewContractClaim["source"]): number {
  const priorities: Record<ReviewContractClaim["source"], number> = {
    file: 0,
    proof_gap: 1,
    readiness: 2,
    task: 3
  };
  return priorities[source];
}

function proofGapReferences(ids: string[]): ReviewContractProofReference[] {
  return ids.map((id) => ({
    kind: "proof_gap",
    label: `Proof gap: ${id}`,
    target: `proof-gap-${stableId(id)}`
  }));
}

function suggestedCommandReference(command: string | undefined): ReviewContractProofReference[] {
  if (!command) return [];
  return [
    {
      kind: "suggested_command",
      label: `Suggested proof: ${command}`
    }
  ];
}

function formatProofStatusForContract(status: ReviewProofStatus): string {
  return status === "not_required" ? "not required" : status;
}

function stableId(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("\\", "/")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
