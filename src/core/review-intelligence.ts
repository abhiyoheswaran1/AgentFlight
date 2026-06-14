import { categorizeFile } from "./risk.js";
import { getVerificationRuns } from "./session.js";
import type {
  AgentFlightSession,
  ProofGap,
  ReviewFocusItem,
  ReviewIntelligence,
  ReviewProofStatus,
  ReviewReadinessDecision,
  ReviewReadinessState,
  RiskAnalysis,
  RiskCategory,
  RiskLevel,
  VerificationProofKind,
  VerificationRun
} from "../types/index.js";

export interface BuildReviewIntelligenceOptions {
  changedFiles: string[];
  risk: RiskAnalysis;
  session: AgentFlightSession;
}

const baseScores: Record<RiskCategory, number> = {
  auth: 100,
  "billing/payments": 95,
  "security/secrets": 95,
  "database/migrations": 90,
  config: 75,
  "backend/api": 70,
  dependencies: 65,
  unknown: 50,
  frontend: 35,
  tests: 20,
  docs: 10
};

const reviewerFocusByCategory = new Map<RiskCategory, string>([
  ["auth", "Check session, permission, and identity boundaries first."],
  ["billing/payments", "Check payment state, idempotency, and webhook handling first."],
  ["security/secrets", "Check credential handling and accidental exposure first."],
  ["database/migrations", "Check data model, migration safety, and rollback assumptions first."],
  ["config", "Check build, CI, and runtime configuration impact first."],
  ["backend/api", "Check request handling, validation, and error paths first."],
  ["dependencies", "Check install/build impact and dependency risk first."],
  ["frontend", "Check user-facing behavior and build evidence first."],
  ["tests", "Check whether tests cover the changed behavior."],
  ["docs", "Check accuracy and scope of documentation changes."],
  ["unknown", "Inspect manually because AgentFlight could not classify this file."]
]);

const readinessLabels: Record<ReviewReadinessState, string> = {
  ready_for_review: "Ready for review",
  not_ready_for_review: "Not ready for review",
  needs_verification: "Needs verification",
  blocked_by_failed_verification: "Blocked by failed verification",
  unknown: "Unknown"
};

export function buildReviewIntelligence(
  options: BuildReviewIntelligenceOptions
): ReviewIntelligence {
  const runs = getVerificationRuns(options.session);
  const proofKinds = summarizeProofKinds(runs);
  const proofGaps = buildProofGaps({
    changedFiles: options.changedFiles,
    verificationCommands: options.session.verificationCommands,
    proofKinds,
    runs
  });
  const focus = buildReviewFocus({
    changedFiles: options.changedFiles,
    proofGaps,
    proofKinds,
    runs
  });
  const readiness = buildReadinessDecision({
    changedFiles: options.changedFiles,
    proofGaps,
    focus,
    runs
  });

  return {
    focus,
    proofGaps,
    readiness
  };
}

export function classifyVerificationProofKind(command: string): VerificationProofKind {
  const normalized = command.toLowerCase();

  if (/\b(npm|pnpm|yarn|bun)\s+(ci|install)\b/.test(normalized)) return "install";
  if (/\b(vitest|jest|mocha|playwright|cypress|test)\b/.test(normalized)) return "test";
  if (/\bbuild\b/.test(normalized)) return "build";
  if (/\b(typecheck|tsc)\b/.test(normalized)) return "typecheck";
  if (/\b(lint|eslint)\b/.test(normalized)) return "lint";

  return "unknown";
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

function buildProofGaps(input: {
  changedFiles: string[];
  verificationCommands: string[];
  proofKinds: { passed: Set<VerificationProofKind>; failed: Set<VerificationProofKind> };
  runs: VerificationRun[];
}): ProofGap[] {
  const gaps: ProofGap[] = [];
  const failedRuns = input.runs.filter((run) => run.status === "failed");
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

  const filesByCategory = groupFilesByCategory(input.changedFiles);
  addCategoryGap(gaps, input, filesByCategory, {
    categories: ["auth", "billing/payments", "security/secrets"],
    id: "missing-auth-test-proof",
    severity: "blocking",
    proofKinds: ["test"],
    message: "Sensitive auth, payment, or security files changed without passing test evidence."
  });
  addCategoryGap(gaps, input, filesByCategory, {
    categories: ["database/migrations"],
    id: "missing-database-test-proof",
    severity: "blocking",
    proofKinds: ["test", "build"],
    message: "Database schema or migration files changed without passing test or build evidence."
  });
  addCategoryGap(gaps, input, filesByCategory, {
    categories: ["backend/api"],
    id: "missing-backend-proof",
    severity: "warning",
    proofKinds: ["test", "build"],
    message: "Backend/API files changed without passing test or build evidence."
  });
  addCategoryGap(gaps, input, filesByCategory, {
    categories: ["dependencies"],
    id: "missing-dependency-proof",
    severity: "warning",
    proofKinds: ["install", "build", "typecheck", "test"],
    message: "Dependency files changed without install, build, typecheck, or test evidence."
  });
  addCategoryGap(gaps, input, filesByCategory, {
    categories: ["config"],
    id: "missing-config-proof",
    severity: "warning",
    proofKinds: ["lint", "typecheck", "build"],
    message: "Config or CI files changed without lint, typecheck, or build evidence."
  });
  addCategoryGap(gaps, input, filesByCategory, {
    categories: ["frontend"],
    id: "missing-frontend-build-proof",
    severity: "warning",
    proofKinds: ["build", "test"],
    message: "Frontend files changed without passing build or test evidence."
  });
  addCategoryGap(gaps, input, filesByCategory, {
    categories: ["tests"],
    id: "missing-test-suite-proof",
    severity: "warning",
    proofKinds: ["test"],
    message: "Test files changed without passing test evidence."
  });

  return gaps;
}

function addCategoryGap(
  gaps: ProofGap[],
  input: {
    verificationCommands: string[];
    proofKinds: { passed: Set<VerificationProofKind>; failed: Set<VerificationProofKind> };
  },
  filesByCategory: Map<RiskCategory, string[]>,
  rule: {
    categories: RiskCategory[];
    id: string;
    severity: ProofGap["severity"];
    proofKinds: VerificationProofKind[];
    message: string;
  }
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

function buildReviewFocus(input: {
  changedFiles: string[];
  proofGaps: ProofGap[];
  proofKinds: { passed: Set<VerificationProofKind>; failed: Set<VerificationProofKind> };
  runs: VerificationRun[];
}): ReviewFocusItem[] {
  const hasFailedVerification = input.runs.some((run) => run.status === "failed");
  const items = input.changedFiles.map((file) => {
    const category = categorizeFile(file);
    const relatedGaps = input.proofGaps.filter((gap) => gap.relatedFiles.includes(file));
    const proofStatus = determineProofStatus({
      category,
      relatedGaps,
      hasFailedVerification,
      proofKinds: input.proofKinds
    });
    const reasons = buildFocusReasons(category, proofStatus, relatedGaps);
    const score = scoreFocusItem(category, proofStatus, relatedGaps, hasFailedVerification);

    const suggestedCommand = relatedGaps.find((gap) => gap.suggestedCommand)?.suggestedCommand;
    return {
      rank: 0,
      file,
      category,
      riskLevel: riskLevelForCategory(category),
      score,
      reasons,
      suggestedReviewerFocus: suggestedReviewerFocus(category),
      proofStatus,
      ...(suggestedCommand ? { suggestedCommand } : {}),
      relatedProofGapIds: relatedGaps.map((gap) => gap.id)
    };
  });

  return items
    .sort((left, right) => right.score - left.score || left.file.localeCompare(right.file))
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

function determineProofStatus(input: {
  category: RiskCategory;
  relatedGaps: ProofGap[];
  hasFailedVerification: boolean;
  proofKinds: { passed: Set<VerificationProofKind>; failed: Set<VerificationProofKind> };
}): ReviewProofStatus {
  if (input.hasFailedVerification && input.category !== "docs") return "failed";
  if (input.relatedGaps.length > 0) return "missing";
  if (input.category === "docs") return "not_required";
  if (input.proofKinds.passed.size > 0) return "covered";
  return input.category === "unknown" ? "unknown" : "not_required";
}

function buildReadinessDecision(input: {
  changedFiles: string[];
  proofGaps: ProofGap[];
  focus: ReviewFocusItem[];
  runs: VerificationRun[];
}): ReviewReadinessDecision {
  const failedRuns = input.runs.filter((run) => run.status === "failed");
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

  if (input.changedFiles.length === 0) {
    return readinessDecision({
      state: "unknown",
      reason: "No changed files were detected for review.",
      nextAction: "Make changes or inspect git status before requesting review.",
      proofGaps: input.proofGaps
    });
  }

  const blockingGap = input.proofGaps.find((gap) => gap.severity === "blocking");
  const firstGap = blockingGap ?? input.proofGaps[0];
  if (firstGap) {
    const state: ReviewReadinessState = blockingGap ? "needs_verification" : "needs_verification";
    const suggestedCommand = firstGap.suggestedCommand;
    return readinessDecision({
      state,
      reason: firstGap.message,
      nextAction: suggestedCommand
        ? `Run agentflight verify -- ${suggestedCommand}`
        : "Run relevant verification before requesting review.",
      suggestedCommand,
      proofGaps: input.proofGaps
    });
  }

  return readinessDecision({
    state: "ready_for_review",
    reason: "Verification evidence matches the observed review risk.",
    nextAction: "Generate or share the AgentFlight report/replay and request scoped human review.",
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
  category: RiskCategory,
  proofStatus: ReviewProofStatus,
  relatedGaps: ProofGap[],
  hasFailedVerification: boolean
): number {
  let score = baseScores[category];
  if (proofStatus === "missing") score += 30;
  if (hasFailedVerification && category !== "docs") score += 40;
  if (category === "dependencies" && relatedGaps.length > 0) score += 20;
  if (category === "config" && relatedGaps.length > 0) score += 15;
  if (category === "unknown") score += 10;
  return score;
}

function buildFocusReasons(
  category: RiskCategory,
  proofStatus: ReviewProofStatus,
  relatedGaps: ProofGap[]
): string[] {
  const reasons = [categoryLabel(category)];
  if (proofStatus === "failed") reasons.push("verification failed");
  if (relatedGaps.some((gap) => gap.message.toLowerCase().includes("test"))) {
    reasons.push("no passing test evidence");
  } else if (relatedGaps.length > 0) {
    reasons.push("matching proof missing");
  }
  return reasons;
}

function categoryLabel(category: RiskCategory): string {
  if (category === "auth") return "identity/session path";
  if (category === "billing/payments") return "payment-sensitive path";
  if (category === "security/secrets") return "credential-handling path";
  if (category === "database/migrations") return "database schema or migration path";
  if (category === "backend/api") return "backend/API file";
  if (category === "dependencies") return "dependency metadata changed";
  if (category === "config") return "configuration or CI path";
  return `${category} file`;
}

function groupFilesByCategory(files: string[]): Map<RiskCategory, string[]> {
  const grouped = new Map<RiskCategory, string[]>();
  for (const file of files) {
    const category = categorizeFile(file);
    grouped.set(category, [...(grouped.get(category) ?? []), file]);
  }
  return grouped;
}

function findSuggestedCommand(
  verificationCommands: string[],
  proofKinds: VerificationProofKind[]
): string | undefined {
  return verificationCommands.find((command) =>
    proofKinds.includes(classifyVerificationProofKind(command))
  );
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
  if (category === "backend/api" || category === "dependencies" || category === "unknown") {
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
