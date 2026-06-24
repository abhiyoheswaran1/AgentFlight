import { categorizeFile } from "./risk.js";
import { compareProofSnapshotToCurrent } from "./proof-snapshot.js";
import { classifyVerificationProofKind } from "./proof-kind.js";
import {
  evaluateProjectReviewContract,
  projectRequirementProofGaps
} from "./project-review-contract.js";
import { buildProofCalibration } from "./proof-calibration.js";
import { buildReviewContract } from "./review-contract.js";
import { getLatestReviewReceipt, getVerificationRuns } from "./session.js";
import { getUnresolvedFailedRuns } from "./verification.js";
import type {
  AgentFlightSession,
  ProofFreshnessAttribution,
  ProofSnapshot,
  ProjectReviewContractConfig,
  ProjectReviewContractEvaluation,
  ProofGap,
  ReviewFocusItem,
  ReviewIntelligence,
  ReviewProofStatus,
  ReviewQueueItem,
  ReviewRouteItem,
  ReviewRouteStatus,
  ReviewRoutes,
  ReviewReadinessDecision,
  ReviewReadinessState,
  ProjScanReviewHint,
  ProofCalibration,
  ProofCalibrationSuggestion,
  RiskAnalysis,
  RiskCategory,
  RiskLevel,
  ReviewReceipt,
  ReviewReceiptEvaluation,
  TrustDelta,
  TrustDeltaItem,
  VerificationProofKind,
  VerificationRun
} from "../types/index.js";

export interface BuildReviewIntelligenceOptions {
  changedFiles: string[];
  risk: RiskAnalysis;
  session: AgentFlightSession;
  currentProofSnapshot?: ProofSnapshot | undefined;
  projscanHints?: ProjScanReviewHint[] | undefined;
  projectReviewContract?: ProjectReviewContractConfig | undefined;
  historicalSessions?: AgentFlightSession[] | undefined;
}

const baseScores: Record<RiskCategory, number> = {
  auth: 100,
  "billing/payments": 95,
  "security/secrets": 95,
  "database/migrations": 90,
  config: 75,
  "backend/api": 70,
  dependencies: 65,
  source: 60,
  unknown: 50,
  "agentflight/config": 35,
  frontend: 35,
  tests: 20,
  docs: 10
};

const reviewerFocusByCategory = new Map<RiskCategory, string>([
  ["auth", "Check session, permission, and identity boundaries first."],
  ["billing/payments", "Check payment state, idempotency, and webhook handling first."],
  ["security/secrets", "Check credential handling and accidental exposure first."],
  ["database/migrations", "Check data model, migration safety, and rollback assumptions first."],
  [
    "agentflight/config",
    "Check AgentFlight session defaults, verification commands, and changed-file filters."
  ],
  ["config", "Check build, CI, and runtime configuration impact first."],
  ["backend/api", "Check request handling, validation, and error paths first."],
  ["dependencies", "Check install/build impact and dependency risk first."],
  ["source", "Check core behavior, command flow, and edge cases first."],
  ["frontend", "Check user-facing behavior and build evidence first."],
  ["tests", "Check whether tests cover the changed behavior."],
  ["docs", "Check accuracy and scope of documentation changes."],
  ["unknown", "Inspect manually because AgentFlight could not classify this file."]
]);

const categoryLabels = new Map<RiskCategory, string>([
  ["auth", "identity/session path"],
  ["billing/payments", "payment-sensitive path"],
  ["security/secrets", "credential-handling path"],
  ["database/migrations", "database schema or migration path"],
  ["backend/api", "backend/API file"],
  ["dependencies", "dependency metadata changed"],
  ["source", "source code"],
  ["agentflight/config", "AgentFlight project config"],
  ["config", "configuration or CI path"]
]);

interface GeneratedGuidanceFile {
  reason: string;
  suggestedReviewerFocus: string;
}

const generatedGuidanceFiles = new Map<string, GeneratedGuidanceFile>([
  [
    ".agentflight/.gitignore",
    {
      reason: "generated AgentFlight helper",
      suggestedReviewerFocus:
        "Check that AgentFlight runtime evidence stays ignored while config.json remains visible."
    }
  ],
  [
    ".projscan-memory/memory.json",
    {
      reason: "generated tool state",
      suggestedReviewerFocus:
        "Review only if generated ProjScan memory is meant to be tracked; otherwise add .projscan-memory/** to changedFileFilters.ignore."
    }
  ]
]);

const readinessLabels: Record<ReviewReadinessState, string> = {
  ready_for_review: "Ready for review",
  not_ready_for_review: "Not ready for review",
  needs_verification: "Needs verification",
  blocked_by_failed_verification: "Blocked by failed verification",
  clean_worktree: "Clean worktree",
  unknown: "Unknown"
};

interface CategoryProofGapRule {
  categories: RiskCategory[];
  id: string;
  severity: ProofGap["severity"];
  proofKinds: VerificationProofKind[];
  message: string;
}

const categoryProofGapRules: CategoryProofGapRule[] = [
  {
    categories: ["auth", "billing/payments", "security/secrets"],
    id: "missing-auth-test-proof",
    severity: "blocking",
    proofKinds: ["test"],
    message: "Sensitive auth, payment, or security files changed without passing test evidence."
  },
  {
    categories: ["database/migrations"],
    id: "missing-database-test-proof",
    severity: "blocking",
    proofKinds: ["test", "build"],
    message: "Database schema or migration files changed without passing test or build evidence."
  },
  {
    categories: ["backend/api"],
    id: "missing-backend-proof",
    severity: "warning",
    proofKinds: ["test", "build"],
    message: "Backend/API files changed without passing test or build evidence."
  },
  {
    categories: ["dependencies"],
    id: "missing-dependency-proof",
    severity: "warning",
    proofKinds: ["install", "build", "typecheck", "test"],
    message: "Dependency files changed without install, build, typecheck, or test evidence."
  },
  {
    categories: ["config"],
    id: "missing-config-proof",
    severity: "warning",
    proofKinds: ["lint", "typecheck", "build"],
    message: "Config or CI files changed without lint, typecheck, or build evidence."
  },
  {
    categories: ["frontend"],
    id: "missing-frontend-build-proof",
    severity: "warning",
    proofKinds: ["build", "test"],
    message: "Frontend files changed without passing build or test evidence."
  },
  {
    categories: ["source"],
    id: "missing-source-proof",
    severity: "warning",
    proofKinds: ["test", "typecheck", "build"],
    message: "Source files changed without passing typecheck, test, or build evidence."
  },
  {
    categories: ["tests"],
    id: "missing-test-suite-proof",
    severity: "warning",
    proofKinds: ["test"],
    message: "Test files changed without passing test evidence."
  }
];

export function buildReviewIntelligence(
  options: BuildReviewIntelligenceOptions
): ReviewIntelligence {
  const runs = getVerificationRuns(options.session);
  const verificationCommands = Array.isArray(options.session.verificationCommands)
    ? options.session.verificationCommands
    : [];
  const unresolvedFailedRuns = getUnresolvedFailedRuns(runs);
  const proofKinds = summarizeProofKinds(runs);
  const proofFreshness = summarizeProofFreshness(runs, options.currentProofSnapshot);
  const incompleteVerifications = detectIncompleteVerificationAttempts(options.session);
  const filesByCategory = groupFilesByCategory(options.changedFiles);
  const projectReviewContract = options.projectReviewContract
    ? evaluateProjectReviewContract({
        contract: options.projectReviewContract,
        changedFiles: options.changedFiles,
        verificationCommands,
        proofKinds,
        verificationRuns: runs,
        proofFreshness,
        currentProofSnapshot: options.currentProofSnapshot,
        unresolvedFailedRuns,
        filesByCategory
      })
    : undefined;
  const proofGaps = buildProofGaps({
    changedFiles: options.changedFiles,
    verificationCommands,
    proofKinds,
    proofFreshness,
    unresolvedFailedRuns,
    incompleteVerifications,
    filesByCategory,
    projectReviewContract
  });
  const focus = buildReviewFocus({
    changedFiles: options.changedFiles,
    proofGaps,
    proofKinds,
    proofFreshness,
    unresolvedFailedRuns,
    projscanHints: options.projscanHints
  });
  const readiness = buildReadinessDecision({
    changedFiles: options.changedFiles,
    proofGaps,
    focus,
    unresolvedFailedRuns
  });
  const contract = buildReviewContract({
    taskTitle: options.session.task.title,
    projectReviewContract,
    focus,
    proofGaps,
    readiness
  });
  const calibration = options.historicalSessions
    ? buildProofCalibration({
        currentSessionId: options.session.id,
        changedFiles: options.changedFiles,
        verificationRuns: runs,
        verificationCommands,
        historicalSessions: options.historicalSessions
      })
    : undefined;
  const reviewReceipt = buildReviewReceiptEvaluation({
    session: options.session,
    changedFiles: options.changedFiles,
    currentProofSnapshot: options.currentProofSnapshot,
    unresolvedFailedRuns
  });
  const trustDelta = buildTrustDelta({
    changedFiles: options.changedFiles,
    filesByCategory,
    proofGaps,
    proofFreshness,
    projectReviewContract,
    calibration,
    reviewReceipt
  });
  const reviewQueue = buildReviewQueue({ trustDelta, focus });
  const reviewRoutes = buildReviewRoutes({
    changedFiles: options.changedFiles,
    filesByCategory,
    proofGaps,
    proofFreshness,
    projectReviewContract,
    calibration,
    reviewReceipt,
    trustDelta,
    reviewQueue,
    focus,
    readiness
  });

  return {
    focus,
    ...(projectReviewContract ? { projectReviewContract } : {}),
    ...(calibration ? { calibration } : {}),
    reviewReceipt,
    trustDelta,
    reviewQueue,
    reviewRoutes,
    proofFreshness: {
      state: proofFreshness.state,
      reason: proofFreshness.reason,
      staleFiles: proofFreshness.staleFiles,
      staleCategories: proofFreshness.staleCategories
    },
    proofGaps,
    readiness,
    contract
  };
}

function buildTrustDelta(input: {
  changedFiles: string[];
  filesByCategory: Map<RiskCategory, string[]>;
  proofGaps: ProofGap[];
  proofFreshness: ProofFreshnessSummary;
  projectReviewContract?: ProjectReviewContractEvaluation | undefined;
  calibration?: ProofCalibration | undefined;
  reviewReceipt: ReviewReceiptEvaluation;
}): TrustDelta {
  const items: TrustDeltaItem[] = [
    ...failedProofDeltaItems(input.proofGaps),
    ...staleProofDeltaItems(input.proofGaps, input.proofFreshness),
    ...staleReceiptDeltaItems(input.reviewReceipt),
    ...reviewReceiptDeltaItems(input.reviewReceipt),
    ...missingProofDeltaItems(input.proofGaps),
    ...manualReviewDeltaItems(input.projectReviewContract, input.proofFreshness),
    ...repoCalibrationDeltaItems(input.calibration, input.filesByCategory, input.changedFiles)
  ];

  const finalItems =
    items.length > 0 ? dedupeTrustDeltaItems(items) : [fallbackTrustDeltaItem(input.changedFiles)];

  return {
    summary: summarizeTrustDelta(finalItems),
    items: finalItems
  };
}

function buildReviewReceiptEvaluation(input: {
  session: AgentFlightSession;
  changedFiles: string[];
  currentProofSnapshot?: ProofSnapshot | undefined;
  unresolvedFailedRuns: VerificationRun[];
}): ReviewReceiptEvaluation {
  const receipt = getLatestReviewReceipt(input.session);
  if (!receipt) {
    return {
      state: "none",
      label: "No review receipt",
      summary: "No local review receipt recorded yet.",
      nextAction: "Run agentflight handoff --accept after local review.",
      staleFiles: []
    };
  }

  if (receipt.decision !== "accepted") {
    return reviewReceiptOutcome(receipt);
  }

  if (hasFailedProofAfterReceipt(receipt, input.unresolvedFailedRuns)) {
    return {
      state: "stale",
      label: "Review receipt stale",
      summary: "Accepted handoff is stale because verification failed after review.",
      nextAction: "Fix the failed proof, rerun verification, and regenerate the handoff.",
      staleFiles: uniqueSorted(
        input.changedFiles.length > 0 ? input.changedFiles : receipt.snapshot.changedFiles
      ),
      receipt
    };
  }

  const staleFiles = receiptStaleFiles(receipt, input.changedFiles, input.currentProofSnapshot);
  if (staleFiles.length > 0) {
    return {
      state: "stale",
      label: "Review receipt stale",
      summary: "Accepted handoff is stale because files changed after review.",
      nextAction: "Regenerate the handoff after re-review.",
      staleFiles,
      receipt
    };
  }

  return {
    state: "current",
    label: "Review receipt current",
    summary: "Accepted handoff still matches the current changed-file state.",
    nextAction: "Keep the receipt with the local handoff.",
    staleFiles: [],
    receipt
  };
}

function hasFailedProofAfterReceipt(receipt: ReviewReceipt, runs: VerificationRun[]): boolean {
  const recordedAt = Date.parse(receipt.recordedAt);
  if (Number.isNaN(recordedAt)) return false;
  return runs.some((run) => {
    const finishedAt = Date.parse(run.finishedAt);
    return !Number.isNaN(finishedAt) && finishedAt > recordedAt;
  });
}

function reviewReceiptOutcome(receipt: ReviewReceipt): ReviewReceiptEvaluation {
  const outcome = reviewReceiptNonAcceptedOutcome(receipt.decision);
  return {
    ...outcome,
    staleFiles: [],
    receipt
  };
}

function reviewReceiptNonAcceptedOutcome(
  decision: ReviewReceipt["decision"]
): Pick<ReviewReceiptEvaluation, "state" | "label" | "summary" | "nextAction"> {
  if (decision === "needs_changes") {
    return {
      state: "needs_changes",
      label: "Review receipt needs changes",
      summary: "Local review recorded requested changes.",
      nextAction: "Address the requested changes before trusting this handoff."
    };
  }
  if (decision === "blocked") {
    return {
      state: "blocked",
      label: "Review receipt blocked",
      summary: "Local review recorded a blocker.",
      nextAction: "Resolve the blocker before trusting this handoff."
    };
  }
  return {
    state: "superseded",
    label: "Review receipt superseded",
    summary: "A newer review decision superseded this receipt.",
    nextAction: "Regenerate handoff evidence for the current session state."
  };
}

function receiptStaleFiles(
  receipt: ReviewReceipt,
  changedFiles: string[],
  currentProofSnapshot: ProofSnapshot | undefined
): string[] {
  if (changedFiles.length === 0) return [];

  const receiptSnapshot = receipt.snapshot.proofSnapshot;
  if (!receiptSnapshot || !currentProofSnapshot) {
    return uniqueSorted(changedFiles);
  }
  return compareProofSnapshotToCurrent(receiptSnapshot, currentProofSnapshot).staleFiles;
}

function staleReceiptDeltaItems(receipt: ReviewReceiptEvaluation): TrustDeltaItem[] {
  if (receipt.state !== "stale") return [];
  return [
    {
      kind: "stale_receipt",
      severity: "warning",
      message: receipt.summary,
      relatedFiles: receipt.staleFiles,
      relatedProofGapIds: []
    }
  ];
}

function reviewReceiptDeltaItems(receipt: ReviewReceiptEvaluation): TrustDeltaItem[] {
  if (
    receipt.state !== "blocked" &&
    receipt.state !== "needs_changes" &&
    receipt.state !== "superseded"
  ) {
    return [];
  }

  return [
    {
      kind: "review_receipt",
      severity: receipt.state === "blocked" ? "blocking" : "warning",
      message: receipt.summary,
      relatedFiles: receipt.receipt?.snapshot.changedFiles ?? receipt.staleFiles,
      relatedProofGapIds: []
    }
  ];
}

function failedProofDeltaItems(gaps: ProofGap[]): TrustDeltaItem[] {
  return gaps
    .filter((gap) => gap.id === "failed-verification")
    .map((gap) => ({
      kind: "failed_proof" as const,
      severity: "blocking" as const,
      message: "Failed proof still blocks review. Fix the failure and rerun verification.",
      relatedFiles: gap.relatedFiles,
      ...(gap.suggestedCommand ? { suggestedCommand: gap.suggestedCommand } : {}),
      relatedProofGapIds: [gap.id]
    }));
}

function staleProofDeltaItems(
  gaps: ProofGap[],
  proofFreshness: ProofFreshnessSummary
): TrustDeltaItem[] {
  const staleGaps = gaps.filter((gap) => gap.id === "stale-verification-proof");
  if (staleGaps.length === 0) return [];
  const suggestedCommand = staleGaps.find((gap) => gap.suggestedCommand)?.suggestedCommand;

  return [
    {
      kind: "stale_proof",
      severity: highestProofGapSeverity(staleGaps),
      message: proofFreshness.state === "stale" ? proofFreshness.reason : staleGaps[0]!.message,
      relatedFiles: uniqueSorted(staleGaps.flatMap((gap) => gap.relatedFiles)),
      ...(suggestedCommand ? { suggestedCommand } : {}),
      relatedProofGapIds: uniqueSorted(staleGaps.map((gap) => gap.id))
    }
  ];
}

function highestProofGapSeverity(gaps: ProofGap[]): ProofGap["severity"] {
  if (gaps.some((gap) => gap.severity === "blocking")) return "blocking";
  if (gaps.some((gap) => gap.severity === "warning")) return "warning";
  return "info";
}

function missingProofDeltaItems(gaps: ProofGap[]): TrustDeltaItem[] {
  return gaps
    .filter((gap) => !ignoredForMissingProofDelta(gap))
    .map((gap) => ({
      kind: "missing_proof" as const,
      severity: gap.severity,
      message: gap.message,
      relatedFiles: gap.relatedFiles,
      ...(gap.suggestedCommand ? { suggestedCommand: gap.suggestedCommand } : {}),
      relatedProofGapIds: [gap.id]
    }));
}

function ignoredForMissingProofDelta(gap: ProofGap): boolean {
  return (
    gap.severity === "info" ||
    gap.id === "failed-verification" ||
    gap.id === "stale-verification-proof"
  );
}

function manualReviewDeltaItems(
  contract: ProjectReviewContractEvaluation | undefined,
  proofFreshness: ProofFreshnessSummary
): TrustDeltaItem[] {
  const requirementItems =
    contract?.enabled === true
      ? contract.requirements
          .filter((requirement) => requirement.status === "needs_review")
          .map((requirement) => ({
            kind: "manual_review" as const,
            severity: "info" as const,
            message: `Manual review remains: ${requirement.label}.`,
            relatedFiles: requirement.relatedFiles,
            relatedProofGapIds: requirement.relatedProofGapIds
          }))
      : [];
  const staleManualFiles = proofFreshness.staleCategories
    .filter((entry) => !entry.proofRequired)
    .flatMap((entry) => entry.files);
  const staleManualItem =
    proofFreshness.state === "stale" && staleManualFiles.length > 0
      ? [
          {
            kind: "manual_review" as const,
            severity: "info" as const,
            message: "Manual-review files changed after proof was captured.",
            relatedFiles: staleManualFiles,
            relatedProofGapIds: []
          }
        ]
      : [];

  return [...requirementItems, ...staleManualItem];
}

function repoCalibrationDeltaItems(
  calibration: ProofCalibration | undefined,
  filesByCategory: Map<RiskCategory, string[]>,
  changedFiles: string[]
): TrustDeltaItem[] {
  if (!calibration || calibration.suggestions.length === 0) return [];

  return calibration.suggestions.map((suggestion) => ({
    kind: "repo_calibration" as const,
    severity: "warning" as const,
    message: suggestion.message,
    relatedFiles: filesByCategory.get(suggestion.category) ?? changedFiles,
    suggestedCommand: suggestion.suggestedCommand,
    relatedProofGapIds: []
  }));
}

function fallbackTrustDeltaItem(changedFiles: string[]): TrustDeltaItem {
  if (changedFiles.length === 0) {
    return {
      kind: "clean",
      severity: "info",
      message: "No changed files currently change the trust state.",
      relatedFiles: [],
      relatedProofGapIds: []
    };
  }

  return {
    kind: "ready",
    severity: "info",
    message: "No failed, stale, or missing proof detected.",
    relatedFiles: changedFiles,
    relatedProofGapIds: []
  };
}

function summarizeTrustDelta(items: TrustDeltaItem[]): string {
  if (items.some((item) => item.kind === "failed_proof")) {
    return "Trust changed because failed proof blocks review.";
  }
  if (items.some((item) => item.kind === "stale_proof" || item.kind === "missing_proof")) {
    return "Trust changed because proof is stale or missing.";
  }
  if (items.some((item) => item.kind === "stale_receipt")) {
    return "Trust changed because accepted review is stale.";
  }
  if (items.some((item) => item.kind === "review_receipt")) {
    return items.some((item) => item.severity === "blocking")
      ? "Trust changed because review acceptance is blocked."
      : "Trust changed because review acceptance needs attention.";
  }
  if (items.some((item) => item.kind === "repo_calibration")) {
    return "Proof exists, but similar local ready handoffs used stronger proof.";
  }
  if (items.some((item) => item.kind === "manual_review")) {
    return "Ready for review; manual review remains.";
  }
  if (items.some((item) => item.kind === "clean")) {
    return "No changed files currently change the trust state.";
  }
  return "No failed, stale, or missing proof detected.";
}

function dedupeTrustDeltaItems(items: TrustDeltaItem[]): TrustDeltaItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = [
      item.kind,
      item.message,
      item.suggestedCommand ?? "",
      item.relatedFiles.join("|")
    ].join("::");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildReviewQueue(input: {
  trustDelta: TrustDelta;
  focus: ReviewFocusItem[];
}): ReviewQueueItem[] {
  const items = [
    ...input.trustDelta.items.flatMap(reviewQueueItemsForTrustDelta),
    ...focusReviewQueueItems(input.focus)
  ];
  return dedupeReviewQueueItems(items).map((item, index) => ({ ...item, rank: index + 1 }));
}

function buildReviewRoutes(input: {
  changedFiles: string[];
  filesByCategory: Map<RiskCategory, string[]>;
  proofGaps: ProofGap[];
  proofFreshness: ProofFreshnessSummary;
  projectReviewContract?: ProjectReviewContractEvaluation | undefined;
  calibration?: ProofCalibration | undefined;
  reviewReceipt: ReviewReceiptEvaluation;
  trustDelta: TrustDelta;
  reviewQueue: ReviewQueueItem[];
  focus: ReviewFocusItem[];
  readiness: ReviewReadinessDecision;
}): ReviewRoutes {
  if (
    input.changedFiles.length === 0 &&
    input.proofGaps.length === 0 &&
    (input.reviewReceipt.state === "none" || input.reviewReceipt.state === "current")
  ) {
    return {
      summary: "No reviewer routing needed for the current worktree.",
      items: []
    };
  }

  const items = [
    maintainerReviewRoute(input),
    verificationReviewRoute(input),
    securityReviewRoute(input),
    docsDxReviewRoute(input),
    releaseReviewRoute(input)
  ].filter((item): item is Omit<ReviewRouteItem, "priority"> => Boolean(item));

  const ordered = items
    .sort(
      (left, right) =>
        reviewRouteRoleOrder(left.role) - reviewRouteRoleOrder(right.role) ||
        left.label.localeCompare(right.label)
    )
    .map((item, index) => ({ ...item, priority: index + 1 }));

  return {
    summary: summarizeReviewRoutes(ordered),
    items: ordered
  };
}

function maintainerReviewRoute(input: {
  changedFiles: string[];
  proofGaps: ProofGap[];
  trustDelta: TrustDelta;
  reviewReceipt: ReviewReceiptEvaluation;
  focus: ReviewFocusItem[];
  readiness: ReviewReadinessDecision;
}): Omit<ReviewRouteItem, "priority"> {
  const files = input.focus.length
    ? input.focus.slice(0, 3).map((item) => item.file)
    : input.changedFiles.slice(0, 3);
  const status =
    input.proofGaps.some((gap) => gap.severity === "blocking") ||
    input.reviewReceipt.state === "blocked"
      ? "blocked"
      : "needs_review";

  return {
    role: "maintainer",
    label: "Maintainer",
    status,
    summary:
      status === "blocked"
        ? "Review is blocked until the highest-priority proof issue is cleared."
        : "Start with the highest-signal changed files and trust-state summary.",
    reason: input.trustDelta.summary || input.readiness.reason,
    relatedFiles: uniqueSorted(files),
    ...(input.readiness.suggestedCommand
      ? { suggestedCommand: input.readiness.suggestedCommand }
      : {}),
    relatedProofGapIds: uniqueSorted(input.proofGaps.map((gap) => gap.id))
  };
}

function verificationReviewRoute(input: {
  changedFiles: string[];
  proofGaps: ProofGap[];
  proofFreshness: ProofFreshnessSummary;
  calibration?: ProofCalibration | undefined;
  reviewQueue: ReviewQueueItem[];
  focus: ReviewFocusItem[];
  readiness: ReviewReadinessDecision;
}): Omit<ReviewRouteItem, "priority"> | undefined {
  const context = verificationRouteContext(input);
  if (!verificationRouteShouldRender(context)) return undefined;

  return {
    role: "verification",
    label: "Verification",
    status: context.status,
    summary: verificationRouteSummary(context),
    reason: verificationRouteReason(input.proofFreshness, context),
    relatedFiles: uniqueSorted(verificationRouteRelatedFiles(input.focus, context.proofGaps)),
    ...(context.suggestedCommand ? { suggestedCommand: context.suggestedCommand } : {}),
    relatedProofGapIds: uniqueSorted(context.proofGaps.map((gap) => gap.id))
  };
}

function verificationRouteReason(
  proofFreshness: ProofFreshnessSummary,
  context: VerificationRouteContext
): string {
  if (context.proofGaps[0]) return context.proofGaps[0].message;
  if (context.calibrationSuggestion) return context.calibrationSuggestion.message;
  if (context.freshnessNeedsReview || context.hasProofRequiredStaleFiles) {
    return proofFreshness.reason;
  }
  return "Verification evidence matches the current proof state.";
}

interface VerificationRouteContext {
  proofGaps: ProofGap[];
  hasProofRelevantFiles: boolean;
  hasProofRequiredStaleFiles: boolean;
  freshnessNeedsReview: boolean;
  calibrationSuggestion?: ProofCalibrationSuggestion | undefined;
  status: ReviewRouteStatus;
  suggestedCommand?: string | undefined;
}

function verificationRouteContext(input: {
  proofGaps: ProofGap[];
  proofFreshness: ProofFreshnessSummary;
  calibration?: ProofCalibration | undefined;
  reviewQueue: ReviewQueueItem[];
  focus: ReviewFocusItem[];
  readiness: ReviewReadinessDecision;
}): VerificationRouteContext {
  const proofGaps = input.proofGaps.filter(isVerificationProofGap);
  const hasProofRelevantFiles = input.focus.some((item) => item.proofStatus !== "not_required");
  const hasProofRequiredStaleFiles = staleProofRequiredFiles(input.proofFreshness).length > 0;
  const freshnessNeedsReview =
    hasProofRelevantFiles &&
    (input.proofFreshness.state === "legacy" || input.proofFreshness.state === "unavailable");
  const calibrationSuggestion = input.calibration?.suggestions[0];

  return {
    proofGaps,
    hasProofRelevantFiles,
    hasProofRequiredStaleFiles,
    freshnessNeedsReview,
    calibrationSuggestion,
    status: verificationRouteStatus({ proofGaps, freshnessNeedsReview, calibrationSuggestion }),
    suggestedCommand: verificationRouteSuggestedCommand(input, proofGaps, calibrationSuggestion)
  };
}

function verificationRouteShouldRender(context: VerificationRouteContext): boolean {
  return (
    context.proofGaps.length > 0 ||
    context.hasProofRelevantFiles ||
    context.hasProofRequiredStaleFiles ||
    context.freshnessNeedsReview ||
    Boolean(context.calibrationSuggestion)
  );
}

function verificationRouteStatus(input: {
  proofGaps: ProofGap[];
  freshnessNeedsReview: boolean;
  calibrationSuggestion?: ProofCalibrationSuggestion | undefined;
}): ReviewRouteStatus {
  if (input.proofGaps.some((gap) => gap.severity === "blocking")) return "blocked";
  if (input.proofGaps.length > 0 || input.calibrationSuggestion || input.freshnessNeedsReview) {
    return "needs_review";
  }
  return "clear";
}

function verificationRouteSuggestedCommand(
  input: {
    reviewQueue: ReviewQueueItem[];
    readiness: ReviewReadinessDecision;
  },
  proofGaps: ProofGap[],
  calibrationSuggestion: ProofCalibrationSuggestion | undefined
): string | undefined {
  return (
    proofGaps.find((gap) => gap.suggestedCommand)?.suggestedCommand ??
    calibrationSuggestion?.suggestedCommand ??
    input.reviewQueue.find((item) => item.suggestedCommand)?.suggestedCommand ??
    input.readiness.suggestedCommand
  );
}

function verificationRouteRelatedFiles(focus: ReviewFocusItem[], proofGaps: ProofGap[]): string[] {
  const relatedProofFiles = proofGaps.flatMap((gap) => gap.relatedFiles);
  return relatedProofFiles.length > 0
    ? relatedProofFiles
    : focus
        .filter((item) => item.proofStatus !== "not_required")
        .slice(0, 3)
        .map((item) => item.file);
}

function verificationRouteSummary(context: VerificationRouteContext): string {
  const summaries: Record<ReviewRouteStatus, string> = {
    blocked: "Proof is blocked by a failed or incomplete verification run.",
    needs_review: context.freshnessNeedsReview
      ? "Proof exists, but freshness cannot be compared for the proof-relevant change."
      : "Proof needs a rerun, missing command, or stronger local-history check.",
    clear: "Recorded proof is current for the proof-relevant change."
  };
  return summaries[context.status];
}

function securityReviewRoute(input: {
  filesByCategory: Map<RiskCategory, string[]>;
  proofGaps: ProofGap[];
}): Omit<ReviewRouteItem, "priority"> | undefined {
  const files = securityReviewCategories().flatMap(
    (category) => input.filesByCategory.get(category) ?? []
  );
  if (files.length === 0) return undefined;

  const relatedGaps = proofGapsForFiles(input.proofGaps, files);
  const blocking = relatedGaps.some((gap) => gap.severity === "blocking");

  return {
    role: "security",
    label: "Security",
    status: blocking ? "blocked" : "needs_review",
    summary: blocking
      ? "Security-sensitive paths are blocked by required proof."
      : "Security-sensitive paths need focused manual inspection.",
    reason: "Auth, payment, secret, database, dependency, or runtime configuration paths changed.",
    relatedFiles: uniqueSorted(files),
    ...(relatedGaps.find((gap) => gap.suggestedCommand)?.suggestedCommand
      ? { suggestedCommand: relatedGaps.find((gap) => gap.suggestedCommand)!.suggestedCommand }
      : {}),
    relatedProofGapIds: uniqueSorted(relatedGaps.map((gap) => gap.id))
  };
}

function docsDxReviewRoute(input: {
  changedFiles: string[];
  proofGaps: ProofGap[];
}): Omit<ReviewRouteItem, "priority"> | undefined {
  const files = input.changedFiles.filter(isDocsDxReviewFile);
  if (files.length === 0) return undefined;

  const relatedGaps = proofGapsForFiles(input.proofGaps, files).filter(
    (gap) => gap.id !== "failed-verification"
  );

  return {
    role: "docs_dx",
    label: "Docs/DX",
    status: relatedGaps.some((gap) => gap.severity === "blocking") ? "blocked" : "needs_review",
    summary: "User-facing docs, examples, or command/report copy changed.",
    reason: "Check that public wording, examples, and local-first claims remain accurate.",
    relatedFiles: uniqueSorted(files),
    ...(relatedGaps.find((gap) => gap.suggestedCommand)?.suggestedCommand
      ? { suggestedCommand: relatedGaps.find((gap) => gap.suggestedCommand)!.suggestedCommand }
      : {}),
    relatedProofGapIds: uniqueSorted(relatedGaps.map((gap) => gap.id))
  };
}

function releaseReviewRoute(input: {
  changedFiles: string[];
  proofGaps: ProofGap[];
  reviewReceipt: ReviewReceiptEvaluation;
  readiness: ReviewReadinessDecision;
}): Omit<ReviewRouteItem, "priority"> | undefined {
  const files = input.changedFiles.filter(isReleaseReviewFile);
  if (files.length === 0) return undefined;

  const relatedGaps = proofGapsForFiles(input.proofGaps, files);
  const blocking =
    input.readiness.state === "blocked_by_failed_verification" ||
    relatedGaps.some((gap) => gap.severity === "blocking") ||
    input.reviewReceipt.state === "blocked";

  return {
    role: "release",
    label: "Release",
    status: blocking ? "blocked" : "needs_review",
    summary: blocking
      ? "Release review is blocked until proof or receipt blockers clear."
      : "Release-facing metadata or review acceptance needs manual signoff.",
    reason: "Package, changelog, configuration, CI, or release documentation changed.",
    relatedFiles: uniqueSorted(files),
    ...(relatedGaps.find((gap) => gap.suggestedCommand)?.suggestedCommand
      ? { suggestedCommand: relatedGaps.find((gap) => gap.suggestedCommand)!.suggestedCommand }
      : {}),
    relatedProofGapIds: uniqueSorted(relatedGaps.map((gap) => gap.id))
  };
}

function summarizeReviewRoutes(items: ReviewRouteItem[]): string {
  if (items.length === 0) return "No reviewer routing needed for the current worktree.";

  const attentionCount = items.filter((item) => item.status !== "clear").length;
  if (attentionCount === 0) return "Reviewer routing is clear for the current proof state.";
  return `${attentionCount} reviewer route${attentionCount === 1 ? "" : "s"} need attention before trust.`;
}

function reviewRouteRoleOrder(role: ReviewRouteItem["role"]): number {
  const order: Record<ReviewRouteItem["role"], number> = {
    maintainer: 1,
    verification: 2,
    security: 3,
    docs_dx: 4,
    release: 5
  };
  return order[role];
}

function isVerificationProofGap(gap: ProofGap): boolean {
  return (
    gap.id === "failed-verification" ||
    gap.id === "stale-verification-proof" ||
    gap.id === "incomplete-verification" ||
    gap.id.startsWith("missing-") ||
    Boolean(gap.suggestedCommand)
  );
}

function securityReviewCategories(): RiskCategory[] {
  return [
    "auth",
    "billing/payments",
    "security/secrets",
    "database/migrations",
    "dependencies",
    "config"
  ];
}

function proofGapsForFiles(gaps: ProofGap[], files: string[]): ProofGap[] {
  const fileSet = new Set(files);
  return gaps.filter((gap) => gap.relatedFiles.some((file) => fileSet.has(file)));
}

function isDocsDxReviewFile(file: string): boolean {
  const normalized = normalizeFilePath(file);
  const category = categorizeFile(file);
  return (
    category === "docs" ||
    category === "agentflight/config" ||
    normalized === "readme.md" ||
    normalized.startsWith("docs/") ||
    normalized.startsWith("examples/") ||
    normalized.startsWith("src/commands/") ||
    normalized.startsWith("src/renderers/")
  );
}

function isReleaseReviewFile(file: string): boolean {
  const normalized = normalizeFilePath(file).toLowerCase();
  return (
    releaseReviewCategories.has(categorizeFile(file)) ||
    releaseReviewExactFiles.has(normalized) ||
    releaseReviewPrefixes.some((prefix) => normalized.startsWith(prefix)) ||
    releaseReviewMarkers.some((marker) => normalized.includes(marker))
  );
}

const releaseReviewCategories = new Set<RiskCategory>(["dependencies", "config"]);

const releaseReviewExactFiles = new Set([
  "package.json",
  "package-lock.json",
  "npm-shrinkwrap.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lockb",
  "changelog.md",
  "agentflight_devlog.md"
]);

const releaseReviewPrefixes = [".github/"];
const releaseReviewMarkers = ["release-audit"];

type ReviewQueueBuilder = (item: TrustDeltaItem) => Array<Omit<ReviewQueueItem, "rank">>;

const reviewQueueBuilders: Record<TrustDeltaItem["kind"], ReviewQueueBuilder> = {
  failed_proof: (item) =>
    trustDeltaQueueItem(item, "fix_failed_proof", "Fix failed proof", { includeCommand: true }),
  stale_proof: (item) =>
    trustDeltaQueueItem(item, "rerun_stale_proof", "Rerun stale proof", { includeCommand: true }),
  stale_receipt: (item) =>
    trustDeltaQueueItem(item, "refresh_review_receipt", "Refresh stale review receipt"),
  review_receipt: (item) =>
    trustDeltaQueueItem(item, "refresh_review_receipt", "Resolve review receipt"),
  missing_proof: (item) =>
    trustDeltaQueueItem(item, "run_missing_proof", "Run missing proof", { includeCommand: true }),
  manual_review: (item) =>
    trustDeltaQueueItem(item, "inspect_manual_review", "Review manual-only changes"),
  repo_calibration: (item) =>
    trustDeltaQueueItem(
      item,
      "consider_repo_calibration",
      "Consider stronger local-history proof",
      {
        includeCommand: true
      }
    ),
  ready: () => [],
  clean: () => []
};

function reviewQueueItemsForTrustDelta(item: TrustDeltaItem): Omit<ReviewQueueItem, "rank">[] {
  return reviewQueueBuilders[item.kind](item);
}

function trustDeltaQueueItem(
  item: TrustDeltaItem,
  action: ReviewQueueItem["action"],
  label: string,
  options: { includeCommand?: boolean } = {}
): Array<Omit<ReviewQueueItem, "rank">> {
  return [
    {
      action,
      label,
      detail: item.message,
      relatedFiles: item.relatedFiles,
      ...(options.includeCommand && item.suggestedCommand
        ? { suggestedCommand: item.suggestedCommand }
        : {}),
      relatedProofGapIds: item.relatedProofGapIds
    }
  ];
}

function focusReviewQueueItems(focus: ReviewFocusItem[]): Array<Omit<ReviewQueueItem, "rank">> {
  return focus.slice(0, 3).map((item) => ({
    action: "inspect_file" as const,
    label: `Inspect ${item.file}`,
    detail: item.suggestedReviewerFocus,
    relatedFiles: [item.file],
    ...(item.suggestedCommand ? { suggestedCommand: item.suggestedCommand } : {}),
    relatedProofGapIds: item.relatedProofGapIds
  }));
}

function dedupeReviewQueueItems(
  items: Array<Omit<ReviewQueueItem, "rank">>
): Array<Omit<ReviewQueueItem, "rank">> {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = [
      item.action,
      item.label,
      item.suggestedCommand ?? "",
      item.relatedFiles.join("|")
    ].join("::");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

export { classifyVerificationProofKind } from "./proof-kind.js";

function isAgentFlightReadoutCommand(command: string): boolean {
  const normalized = normalizeCommand(command).toLowerCase().replaceAll("\\", "/");
  return /(?:^|\s)(?:agentflight(?:@[^\s]+)?|node\s+(?:\.\/)?dist\/cli\.js)\s+(?:status|report|replay|resume|handoff|history|doctor)\b/.test(
    normalized
  );
}

function summarizeProofKinds(runs: VerificationRun[]): {
  passed: Set<VerificationProofKind>;
  failed: Set<VerificationProofKind>;
} {
  const passed = new Set<VerificationProofKind>();
  const failed = new Set<VerificationProofKind>();

  for (const run of runs) {
    const kind = classifyVerificationProofKind(run.command);
    if (run.status === "passed") passed.add(kind);
    if (run.status === "failed") failed.add(kind);
  }

  return { passed, failed };
}

interface ProofFreshnessSummary {
  state: ProofFreshnessAttribution["state"];
  run?: VerificationRun | undefined;
  staleFiles: string[];
  staleCategories: ProofFreshnessAttribution["staleCategories"];
  reason: string;
}

function summarizeProofFreshness(
  runs: VerificationRun[],
  currentProofSnapshot: ProofSnapshot | undefined
): ProofFreshnessSummary {
  const latestPassedRun = [...runs].reverse().find((run) => run.status === "passed");
  if (!latestPassedRun) {
    return {
      state: "none",
      staleFiles: [],
      staleCategories: [],
      reason: "No passing verification proof has been recorded."
    };
  }

  const proofSnapshot = latestPassedRun.proofSnapshot;
  if (!proofSnapshot) {
    return {
      state: "legacy",
      run: latestPassedRun,
      staleFiles: [],
      staleCategories: [],
      reason: "Passing verification proof was recorded before proof freshness snapshots existed."
    };
  }

  if (proofSnapshot.source !== "git_status" || !currentProofSnapshot) {
    return {
      state: "unavailable",
      run: latestPassedRun,
      staleFiles: [],
      staleCategories: [],
      reason:
        proofSnapshot.unavailableReason ?? "Proof freshness cannot be compared in this worktree."
    };
  }

  const comparison = compareProofSnapshotToCurrent(proofSnapshot, currentProofSnapshot);
  const staleCategories = buildProofFreshnessCategories(comparison.staleFiles);
  return {
    state: comparison.current ? "current" : "stale",
    run: latestPassedRun,
    staleFiles: comparison.staleFiles,
    staleCategories,
    reason: comparison.current ? comparison.reason : formatProofFreshnessReason(staleCategories)
  };
}

function buildProofGaps(input: {
  changedFiles: string[];
  verificationCommands: string[];
  proofKinds: { passed: Set<VerificationProofKind>; failed: Set<VerificationProofKind> };
  proofFreshness: ProofFreshnessSummary;
  unresolvedFailedRuns: VerificationRun[];
  incompleteVerifications: IncompleteVerificationAttempt[];
  filesByCategory: Map<RiskCategory, string[]>;
  projectReviewContract?: ProjectReviewContractEvaluation | undefined;
}): ProofGap[] {
  const gaps: ProofGap[] = [];
  const failedRuns = input.unresolvedFailedRuns;
  if (failedRuns.length > 0) {
    const failedCommand = failedRuns[0]!.command;
    gaps.push({
      id: "failed-verification",
      severity: "blocking",
      message: `A verification command failed and must be fixed or rerun successfully: ${failedCommand}`,
      suggestedCommand: failedCommand,
      relatedFiles: input.changedFiles
    });
  }

  for (const attempt of input.incompleteVerifications) {
    gaps.push({
      id: "incomplete-verification",
      severity: "blocking",
      message: formatIncompleteVerificationMessage(attempt.command),
      suggestedCommand: attempt.command,
      relatedFiles: input.changedFiles
    });
  }

  if (input.projectReviewContract?.enabled) {
    gaps.push(...projectRequirementProofGaps(input.projectReviewContract));
  } else {
    for (const rule of categoryProofGapRules) {
      addCategoryGap(gaps, input, input.filesByCategory, rule);
    }
  }

  addStaleProofGap(gaps, input);

  addGeneratedFileGuidance(gaps, input.changedFiles);

  return dedupeProofGaps(gaps);
}

function dedupeProofGaps(gaps: ProofGap[]): ProofGap[] {
  const seen = new Set<string>();
  return gaps.filter((gap) => {
    const key = [gap.id, gap.suggestedCommand ?? "", gap.relatedFiles.join("|"), gap.message].join(
      "::"
    );
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function addCategoryGap(
  gaps: ProofGap[],
  input: {
    verificationCommands: string[];
    proofKinds: { passed: Set<VerificationProofKind>; failed: Set<VerificationProofKind> };
  },
  filesByCategory: Map<RiskCategory, string[]>,
  rule: CategoryProofGapRule
): void {
  const relatedFiles = rule.categories.flatMap((category) => filesByCategory.get(category) ?? []);
  if (relatedFiles.length === 0) return;
  if (rule.proofKinds.some((kind) => input.proofKinds.passed.has(kind))) return;

  const suggestedCommand = findSuggestedCommand(input.verificationCommands, rule.proofKinds);
  gaps.push({
    id: rule.id,
    severity: rule.severity,
    message: rule.message,
    ...(suggestedCommand ? { suggestedCommand } : {}),
    relatedFiles
  });
}

function addStaleProofGap(
  gaps: ProofGap[],
  input: {
    changedFiles: string[];
    proofKinds: { passed: Set<VerificationProofKind>; failed: Set<VerificationProofKind> };
    proofFreshness: ProofFreshnessSummary;
  }
): void {
  if (input.proofFreshness.state !== "stale") return;
  if (input.proofKinds.passed.size === 0) return;

  const proofRequiredStaleFiles = staleProofRequiredFiles(input.proofFreshness);
  if (proofRequiredStaleFiles.length === 0) return;

  const gap: ProofGap = {
    id: "stale-verification-proof",
    severity: "warning",
    message: input.proofFreshness.reason,
    relatedFiles: proofRequiredStaleFiles
  };
  if (input.proofFreshness.run?.command) gap.suggestedCommand = input.proofFreshness.run.command;
  gaps.push(gap);
}

function buildProofFreshnessCategories(
  staleFiles: string[]
): ProofFreshnessAttribution["staleCategories"] {
  const byCategory = new Map<
    RiskCategory,
    { category: RiskCategory; files: string[]; proofRequired: boolean }
  >();
  for (const file of staleFiles) {
    const category = categorizeFile(file);
    const current = byCategory.get(category) ?? {
      category,
      files: [],
      proofRequired: isProofRequiredStaleFile(file, category)
    };
    current.files.push(file);
    current.proofRequired ||= isProofRequiredStaleFile(file, category);
    byCategory.set(category, current);
  }
  return [...byCategory.values()]
    .map((entry) => ({
      ...entry,
      files: entry.files.sort((left, right) => left.localeCompare(right))
    }))
    .sort(
      (left, right) =>
        Number(right.proofRequired) - Number(left.proofRequired) ||
        left.category.localeCompare(right.category)
    );
}

function isProofRequiredStaleFile(
  file: string,
  category: RiskCategory = categorizeFile(file)
): boolean {
  if (isGeneratedGuidanceFile(file)) return false;
  return proofRequiredCategories().has(category);
}

function proofRequiredCategories(): Set<RiskCategory> {
  return new Set(categoryProofGapRules.flatMap((rule) => rule.categories));
}

function staleProofRequiredFiles(proofFreshness: ProofFreshnessSummary): string[] {
  return proofFreshness.staleCategories
    .filter((entry) => entry.proofRequired)
    .flatMap((entry) => entry.files)
    .sort((left, right) => left.localeCompare(right));
}

function formatProofFreshnessReason(
  staleCategories: ProofFreshnessAttribution["staleCategories"]
): string {
  const proofRequired = staleCategories.filter((entry) => entry.proofRequired);
  const reviewOnly = staleCategories.filter((entry) => !entry.proofRequired);
  if (proofRequired.length === 0 && reviewOnly.length === 0) {
    return "Changed files were added or changed after proof was captured.";
  }
  if (proofRequired.length === 0) {
    return `${formatCategoryList(reviewOnly)} changed after proof was captured; manual review remains.`;
  }
  const rerun = `Verification proof is stale for ${formatCategoryList(proofRequired)} changes after proof was captured. Rerun verification for these files.`;
  if (reviewOnly.length === 0) return rerun;
  return `${rerun} ${capitalizeFirst(formatCategoryList(reviewOnly))} changes also need manual review.`;
}

function formatCategoryList(
  categories: Pick<ProofFreshnessAttribution["staleCategories"][number], "category">[]
): string {
  const labels = [...new Set(categories.map((entry) => entry.category))];
  if (labels.length === 0) return "Changed files";
  if (labels.length === 1) return labels[0]!;
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels.at(-1)}`;
}

function capitalizeFirst(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function buildReviewFocus(input: {
  changedFiles: string[];
  proofGaps: ProofGap[];
  proofKinds: { passed: Set<VerificationProofKind>; failed: Set<VerificationProofKind> };
  proofFreshness: ProofFreshnessSummary;
  unresolvedFailedRuns: VerificationRun[];
  projscanHints?: ProjScanReviewHint[] | undefined;
}): ReviewFocusItem[] {
  const hasFailedVerification = input.unresolvedFailedRuns.length > 0;
  const projscanHints = normalizeProjScanHints(input.projscanHints, input.changedFiles);
  const proofGapsByFile = indexProofGapsByFile(input.proofGaps);
  const items = input.changedFiles.map((file) => {
    const category = categorizeFile(file);
    const relatedGaps = proofGapsByFile.get(file) ?? [];
    const projscanHint = projscanHints.get(normalizeFilePath(file));
    const generatedGuidanceFile = getGeneratedGuidanceFile(file);
    const proofStatus = determineProofStatus({
      category,
      relatedGaps,
      generatedGuidanceFile: Boolean(generatedGuidanceFile),
      hasFailedVerification,
      proofKinds: input.proofKinds,
      proofFreshness: input.proofFreshness
    });
    const reasons = buildFocusReasons({
      category,
      proofStatus,
      relatedGaps,
      projscanHint,
      generatedGuidanceFile
    });
    const score =
      scoreFocusItem(file, category, proofStatus, relatedGaps, hasFailedVerification) +
      (generatedGuidanceFile ? 0 : scoreProjScanHint(projscanHint));

    const suggestedCommand = relatedGaps.find((gap) => gap.suggestedCommand)?.suggestedCommand;
    return {
      rank: 0,
      file,
      category,
      riskLevel: riskLevelForCategory(category),
      score,
      reasons,
      suggestedReviewerFocus:
        generatedGuidanceFile?.suggestedReviewerFocus ?? suggestedReviewerFocus(category),
      proofStatus,
      ...(suggestedCommand ? { suggestedCommand } : {}),
      relatedProofGapIds: relatedGaps.map((gap) => gap.id)
    };
  });

  return items
    .sort((left, right) => right.score - left.score || left.file.localeCompare(right.file))
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

function indexProofGapsByFile(gaps: ProofGap[]): Map<string, ProofGap[]> {
  const indexed = new Map<string, ProofGap[]>();
  for (const gap of gaps) {
    for (const file of gap.relatedFiles) {
      const existing = indexed.get(file);
      if (existing) {
        existing.push(gap);
      } else {
        indexed.set(file, [gap]);
      }
    }
  }
  return indexed;
}

interface DetermineProofStatusInput {
  category: RiskCategory;
  relatedGaps: ProofGap[];
  generatedGuidanceFile?: boolean;
  hasFailedVerification: boolean;
  proofKinds: { passed: Set<VerificationProofKind>; failed: Set<VerificationProofKind> };
  proofFreshness: ProofFreshnessSummary;
}

interface ProofStatusRule {
  matches(input: DetermineProofStatusInput): boolean;
  status: ReviewProofStatus | ((input: DetermineProofStatusInput) => ReviewProofStatus);
}

const proofStatusRules: ProofStatusRule[] = [
  { matches: (input) => Boolean(input.generatedGuidanceFile), status: "not_required" },
  { matches: isFailedProofStatus, status: "failed" },
  { matches: hasStaleProofGap, status: "stale" },
  { matches: hasActionableProofGaps, status: "missing" },
  { matches: isProofOptionalCategory, status: "not_required" },
  { matches: hasPassingProof, status: statusFromPassingProof }
];

function determineProofStatus(input: DetermineProofStatusInput): ReviewProofStatus {
  const rule = proofStatusRules.find((candidate) => candidate.matches(input));
  if (!rule) return fallbackProofStatus(input.category);
  return typeof rule.status === "function" ? rule.status(input) : rule.status;
}

function isFailedProofStatus(input: DetermineProofStatusInput): boolean {
  return input.hasFailedVerification && input.category !== "docs";
}

function hasStaleProofGap(input: DetermineProofStatusInput): boolean {
  return input.relatedGaps.some((gap) => gap.id === "stale-verification-proof");
}

function hasActionableProofGaps(input: DetermineProofStatusInput): boolean {
  return input.relatedGaps.some((gap) => gap.severity !== "info");
}

function isProofOptionalCategory(input: DetermineProofStatusInput): boolean {
  return input.category === "docs" || input.category === "agentflight/config";
}

function hasPassingProof(input: DetermineProofStatusInput): boolean {
  return input.proofKinds.passed.size > 0;
}

function statusFromPassingProof(input: DetermineProofStatusInput): ReviewProofStatus {
  return input.proofFreshness.state === "current" ? "current" : "covered";
}

function fallbackProofStatus(category: RiskCategory): ReviewProofStatus {
  return category === "unknown" ? "unknown" : "not_required";
}

function buildReadinessDecision(input: {
  changedFiles: string[];
  proofGaps: ProofGap[];
  focus: ReviewFocusItem[];
  unresolvedFailedRuns: VerificationRun[];
}): ReviewReadinessDecision {
  const failedRuns = input.unresolvedFailedRuns;
  if (failedRuns.length > 0) {
    const failedCommand = failedRuns[0]!.command;
    return readinessDecision({
      state: "blocked_by_failed_verification",
      reason: `A verification command failed and must be fixed or rerun successfully: ${failedCommand}`,
      nextAction: `Fix the failed command, then rerun agentflight verify -- ${failedCommand}`,
      suggestedCommand: failedCommand,
      proofGaps: input.proofGaps,
      failedVerificationSummary: failedRuns.map((run) => `${run.command} failed`).join("; ")
    });
  }

  const actionableGaps = input.proofGaps.filter((gap) => gap.severity !== "info");
  const incompleteGap = actionableGaps.find((gap) => gap.id === "incomplete-verification");
  const blockingGap = actionableGaps.find((gap) => gap.severity === "blocking");
  const firstGap = incompleteGap ?? blockingGap ?? actionableGaps[0];
  if (firstGap) {
    const state: ReviewReadinessState = blockingGap ? "needs_verification" : "needs_verification";
    const suggestedCommand = firstGap.suggestedCommand;
    return readinessDecision({
      state,
      reason: firstGap.message,
      nextAction: formatGapNextAction(firstGap),
      suggestedCommand,
      proofGaps: input.proofGaps
    });
  }

  if (input.changedFiles.length === 0) {
    return readinessDecision({
      state: "clean_worktree",
      reason: "No changed files are currently detected.",
      nextAction: "Start a new AgentFlight session when you begin the next task.",
      proofGaps: input.proofGaps
    });
  }

  return readinessDecision({
    state: "ready_for_review",
    reason: "Verification evidence matches the observed review risk.",
    nextAction: "Run agentflight handoff to generate the local review packet.",
    proofGaps: []
  });
}

function readinessDecision(input: {
  state: ReviewReadinessState;
  reason: string;
  nextAction: string;
  proofGaps: ProofGap[];
  suggestedCommand?: string | undefined;
  failedVerificationSummary?: string | undefined;
}): ReviewReadinessDecision {
  return {
    state: input.state,
    label: labelReadiness(input.state),
    reason: input.reason,
    nextAction: input.nextAction,
    ...(input.suggestedCommand ? { suggestedCommand: input.suggestedCommand } : {}),
    proofGaps: input.proofGaps,
    ...(input.failedVerificationSummary
      ? { failedVerificationSummary: input.failedVerificationSummary }
      : {})
  };
}

function scoreFocusItem(
  file: string,
  category: RiskCategory,
  proofStatus: ReviewProofStatus,
  relatedGaps: ProofGap[],
  hasFailedVerification: boolean
): number {
  const generatedGuidanceFile = isGeneratedGuidanceFile(file);
  return (
    baseFocusScore(category, generatedGuidanceFile) +
    proofStatusScore(proofStatus) +
    failedVerificationScore(category, hasFailedVerification) +
    categoryGapScore(category, relatedGaps, generatedGuidanceFile)
  );
}

function formatIncompleteVerificationMessage(command: string): string {
  return `Verification is still running or did not record a completed result: ${command}`;
}

function formatGapNextAction(gap: ProofGap): string {
  if (!gap.suggestedCommand) return "Run relevant verification before requesting review.";

  if (gap.id === "incomplete-verification") {
    return `Wait for the command to finish; if no result appears, rerun agentflight verify -- ${gap.suggestedCommand}`;
  }

  return `Run agentflight verify -- ${gap.suggestedCommand}`;
}

function baseFocusScore(category: RiskCategory, generatedGuidanceFile: boolean): number {
  return generatedGuidanceFile ? 5 : baseScores[category];
}

function proofStatusScore(proofStatus: ReviewProofStatus): number {
  if (proofStatus === "missing" || proofStatus === "stale") return 30;
  return 0;
}

function failedVerificationScore(category: RiskCategory, hasFailedVerification: boolean): number {
  return hasFailedVerification && category !== "docs" ? 40 : 0;
}

function categoryGapScore(
  category: RiskCategory,
  relatedGaps: ProofGap[],
  generatedGuidanceFile: boolean
): number {
  const hasGaps = relatedGaps.length > 0;
  const scores: Partial<Record<RiskCategory, number>> = {
    dependencies: hasGaps ? 20 : 0,
    config: hasGaps ? 15 : 0,
    unknown: generatedGuidanceFile ? 0 : 10
  };
  return scores[category] ?? 0;
}

function isGeneratedGuidanceFile(file: string): boolean {
  return Boolean(getGeneratedGuidanceFile(file));
}

function getGeneratedGuidanceFile(file: string): GeneratedGuidanceFile | undefined {
  return generatedGuidanceFiles.get(normalizeFilePath(file));
}

function scoreProjScanHint(hint: NormalizedProjScanHint | undefined): number {
  if (!hint) return 0;
  return Math.round(hint.riskScore * 0.6);
}

function buildFocusReasons(input: {
  category: RiskCategory;
  proofStatus: ReviewProofStatus;
  relatedGaps: ProofGap[];
  projscanHint?: NormalizedProjScanHint | undefined;
  generatedGuidanceFile?: GeneratedGuidanceFile | undefined;
}): string[] {
  const { category, proofStatus, relatedGaps, projscanHint, generatedGuidanceFile } = input;
  if (generatedGuidanceFile) return [generatedGuidanceFile.reason];

  const reasons = [categoryLabel(category)];
  if (proofStatus === "failed") reasons.push("verification failed");
  if (proofStatus === "current") reasons.push("proof current");
  if (proofStatus === "stale") reasons.push("proof stale");
  if (relatedGaps.some((gap) => gap.message.toLowerCase().includes("test"))) {
    reasons.push("no passing test evidence");
  } else if (relatedGaps.length > 0) {
    reasons.push("matching proof missing");
  }
  if (projscanHint?.reason) reasons.push(`ProjScan: ${projscanHint.reason}`);
  return reasons;
}

interface NormalizedProjScanHint {
  riskScore: number;
  reason?: string | undefined;
}

function normalizeProjScanHints(
  hints: ProjScanReviewHint[] | undefined,
  changedFiles: string[]
): Map<string, NormalizedProjScanHint> {
  const changedFileSet = new Set(changedFiles.map(normalizeFilePath));
  const normalized = new Map<string, NormalizedProjScanHint>();
  if (!Array.isArray(hints)) return normalized;

  for (const hint of hints) {
    const parsed = parseProjScanHint(hint, changedFileSet);
    if (!parsed) continue;
    normalized.set(parsed.file, mergeProjScanHint(normalized.get(parsed.file), parsed.hint));
  }

  return normalized;
}

function parseProjScanHint(
  hint: ProjScanReviewHint,
  changedFileSet: Set<string>
): { file: string; hint: NormalizedProjScanHint } | null {
  const file = readProjScanHintFile(hint, changedFileSet);
  if (!file) return null;

  const riskScore = readProjScanHintRiskScore(hint);
  const reason = readProjScanHintReason(hint);
  if (riskScore === null && !reason) return null;

  return {
    file,
    hint: {
      riskScore: riskScore ?? 0,
      ...(reason ? { reason } : {})
    }
  };
}

function readProjScanHintFile(
  hint: ProjScanReviewHint,
  changedFileSet: Set<string>
): string | null {
  const file = typeof hint.file === "string" ? normalizeFilePath(hint.file) : "";
  return file && changedFileSet.has(file) ? file : null;
}

function readProjScanHintRiskScore(hint: ProjScanReviewHint): number | null {
  if (typeof hint.riskScore !== "number" || !Number.isFinite(hint.riskScore)) return null;
  return clamp(hint.riskScore, 0, 100);
}

function readProjScanHintReason(hint: ProjScanReviewHint): string {
  return typeof hint.reason === "string" ? hint.reason.trim() : "";
}

function mergeProjScanHint(
  previous: NormalizedProjScanHint | undefined,
  next: NormalizedProjScanHint
): NormalizedProjScanHint {
  return {
    riskScore: Math.max(next.riskScore, previous?.riskScore ?? 0),
    ...(next.reason ? { reason: next.reason } : previous?.reason ? { reason: previous.reason } : {})
  };
}

function normalizeFilePath(file: string): string {
  return file.replaceAll("\\", "/").replace(/^\.\//, "");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function categoryLabel(category: RiskCategory): string {
  return categoryLabels.get(category) ?? `${category} file`;
}

function groupFilesByCategory(files: string[]): Map<RiskCategory, string[]> {
  const grouped = new Map<RiskCategory, string[]>();
  for (const file of files) {
    const category = categorizeFile(file);
    const bucket = grouped.get(category);
    if (bucket) {
      bucket.push(file);
    } else {
      grouped.set(category, [file]);
    }
  }
  return grouped;
}

function findSuggestedCommand(
  verificationCommands: string[],
  proofKinds: VerificationProofKind[]
): string | undefined {
  for (const proofKind of proofKinds) {
    const command = verificationCommands.find(
      (candidate) => classifyVerificationProofKind(candidate) === proofKind
    );
    if (command) return command;
  }

  return undefined;
}

function riskLevelForCategory(category: RiskCategory): RiskLevel {
  if (
    category === "auth" ||
    category === "billing/payments" ||
    category === "security/secrets" ||
    category === "database/migrations" ||
    category === "config"
  ) {
    return "high";
  }
  if (
    category === "backend/api" ||
    category === "dependencies" ||
    category === "source" ||
    category === "unknown" ||
    category === "agentflight/config"
  ) {
    return "medium";
  }
  return "low";
}

function suggestedReviewerFocus(category: RiskCategory): string {
  return reviewerFocusByCategory.get(category) ?? "Inspect this file manually.";
}

function labelReadiness(state: ReviewReadinessState): string {
  return readinessLabels[state];
}

interface IncompleteVerificationAttempt {
  command: string;
  startedAt: string;
}

function detectIncompleteVerificationAttempts(
  session: AgentFlightSession
): IncompleteVerificationAttempt[] {
  const events = session.events ?? [];
  const runs = getVerificationRuns(session);
  const latestCompletionByCommand = buildLatestVerificationCompletionIndex(events, runs);
  const startedEvents = events.filter((event) => event.type === "verification_started");

  return startedEvents
    .map((event) => ({
      command: readEventCommand(event.metadata) ?? "unknown verification command",
      startedAt: event.timestamp
    }))
    .filter((attempt) => !isAgentFlightReadoutCommand(attempt.command))
    .filter((attempt) => !hasIndexedCompletionAtOrAfter(attempt, latestCompletionByCommand));
}

function buildLatestVerificationCompletionIndex(
  events: NonNullable<AgentFlightSession["events"]>,
  runs: VerificationRun[]
): Map<string, string> {
  const index = new Map<string, string>();

  for (const event of events) {
    if (event.type !== "verification_passed" && event.type !== "verification_failed") continue;
    const command = normalizeCommand(readEventCommand(event.metadata) ?? "");
    if (!command) continue;
    recordLatestCompletion(index, command, event.timestamp);
  }

  for (const run of runs) {
    recordLatestCompletion(index, normalizeCommand(run.command), run.finishedAt);
  }

  return index;
}

function recordLatestCompletion(
  index: Map<string, string>,
  command: string,
  timestamp: string
): void {
  const previous = index.get(command);
  if (!previous || timestampAtOrAfter(timestamp, previous)) {
    index.set(command, timestamp);
  }
}

function hasIndexedCompletionAtOrAfter(
  attempt: IncompleteVerificationAttempt,
  latestCompletionByCommand: Map<string, string>
): boolean {
  const command = normalizeCommand(attempt.command);
  const latestCompletion = latestCompletionByCommand.get(command);
  return latestCompletion ? timestampAtOrAfter(latestCompletion, attempt.startedAt) : false;
}

function addGeneratedFileGuidance(gaps: ProofGap[], changedFiles: string[]): void {
  if (!changedFiles.includes(".projscan-memory/memory.json")) return;

  gaps.push({
    id: "suggest-projscan-memory-filter",
    severity: "info",
    message:
      'Generated ProjScan memory is present. If this file is not meant for review, add ".projscan-memory/**" to changedFileFilters.ignore in .agentflight/config.json.',
    relatedFiles: [".projscan-memory/memory.json"]
  });
}

function readEventCommand(metadata: Record<string, unknown> | undefined): string | null {
  const command = metadata?.command;
  return typeof command === "string" && command.trim().length > 0 ? command : null;
}

function normalizeCommand(command: string): string {
  return command.trim().replace(/\s+/g, " ");
}

function timestampAtOrAfter(candidate: string, reference: string): boolean {
  const candidateTime = Date.parse(candidate);
  const referenceTime = Date.parse(reference);
  if (Number.isNaN(candidateTime) || Number.isNaN(referenceTime)) {
    return candidate >= reference;
  }
  return candidateTime >= referenceTime;
}
