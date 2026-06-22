import type {
  ProofGap,
  ReviewContract,
  ReviewContractClaim,
  ReviewContractClaimStatus,
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
    relatedProofGapIds: readiness.proofGaps.map((gap) => gap.id),
    ...(readiness.suggestedCommand ? { suggestedCommand: readiness.suggestedCommand } : {}),
    nextAction: readiness.nextAction
  };
}

function buildFileClaim(item: ReviewFocusItem): ReviewContractClaim {
  const status = statusFromProofStatus(item.proofStatus);
  return {
    id: `file-${stableId(item.file)}`,
    text: `Changed file reviewed: ${item.file}`,
    status,
    source: "file",
    reason: item.reasons.join("; "),
    files: [item.file],
    evidence: fileClaimEvidence(item),
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

function stableId(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("\\", "/")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
