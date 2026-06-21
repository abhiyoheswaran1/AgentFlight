import { categorizeFile } from "./risk.js";
import { getVerificationRuns } from "./session.js";
import { getUnresolvedFailedRuns } from "./verification.js";
import type {
  AgentFlightSession,
  ProofGap,
  ReviewFocusItem,
  ReviewIntelligence,
  ReviewProofStatus,
  ReviewReadinessDecision,
  ReviewReadinessState,
  ProjScanReviewHint,
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
  projscanHints?: ProjScanReviewHint[] | undefined;
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

const generatedGuidanceFiles = new Set([".projscan-memory/memory.json"]);

const readinessLabels: Record<ReviewReadinessState, string> = {
  ready_for_review: "Ready for review",
  not_ready_for_review: "Not ready for review",
  needs_verification: "Needs verification",
  blocked_by_failed_verification: "Blocked by failed verification",
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
  const unresolvedFailedRuns = getUnresolvedFailedRuns(runs);
  const proofKinds = summarizeProofKinds(runs);
  const incompleteVerifications = detectIncompleteVerificationAttempts(options.session);
  const proofGaps = buildProofGaps({
    changedFiles: options.changedFiles,
    verificationCommands: options.session.verificationCommands,
    proofKinds,
    unresolvedFailedRuns,
    incompleteVerifications
  });
  const focus = buildReviewFocus({
    changedFiles: options.changedFiles,
    proofGaps,
    proofKinds,
    unresolvedFailedRuns,
    projscanHints: options.projscanHints
  });
  const readiness = buildReadinessDecision({
    changedFiles: options.changedFiles,
    proofGaps,
    focus,
    unresolvedFailedRuns
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
  unresolvedFailedRuns: VerificationRun[];
  incompleteVerifications: IncompleteVerificationAttempt[];
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
      message: `Verification was started but no completed result was recorded: ${attempt.command}`,
      suggestedCommand: attempt.command,
      relatedFiles: input.changedFiles
    });
  }

  const filesByCategory = groupFilesByCategory(input.changedFiles);
  for (const rule of categoryProofGapRules) {
    addCategoryGap(gaps, input, filesByCategory, rule);
  }

  addGeneratedFileGuidance(gaps, input.changedFiles);

  return gaps;
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

function buildReviewFocus(input: {
  changedFiles: string[];
  proofGaps: ProofGap[];
  proofKinds: { passed: Set<VerificationProofKind>; failed: Set<VerificationProofKind> };
  unresolvedFailedRuns: VerificationRun[];
  projscanHints?: ProjScanReviewHint[] | undefined;
}): ReviewFocusItem[] {
  const hasFailedVerification = input.unresolvedFailedRuns.length > 0;
  const projscanHints = normalizeProjScanHints(input.projscanHints, input.changedFiles);
  const items = input.changedFiles.map((file) => {
    const category = categorizeFile(file);
    const relatedGaps = input.proofGaps.filter((gap) => gap.relatedFiles.includes(file));
    const projscanHint = projscanHints.get(normalizeFilePath(file));
    const generatedGuidanceFile = isGeneratedGuidanceFile(file);
    const proofStatus = determineProofStatus({
      category,
      relatedGaps,
      generatedGuidanceFile,
      hasFailedVerification,
      proofKinds: input.proofKinds
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
      scoreProjScanHint(projscanHint);

    const suggestedCommand = relatedGaps.find((gap) => gap.suggestedCommand)?.suggestedCommand;
    return {
      rank: 0,
      file,
      category,
      riskLevel: riskLevelForCategory(category),
      score,
      reasons,
      suggestedReviewerFocus: generatedGuidanceFile
        ? "Review only if generated ProjScan memory is meant to be tracked; otherwise add .projscan-memory/** to changedFileFilters.ignore."
        : suggestedReviewerFocus(category),
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
  generatedGuidanceFile?: boolean;
  hasFailedVerification: boolean;
  proofKinds: { passed: Set<VerificationProofKind>; failed: Set<VerificationProofKind> };
}): ReviewProofStatus {
  if (input.generatedGuidanceFile) return "not_required";
  if (input.hasFailedVerification && input.category !== "docs") return "failed";
  const actionableGaps = input.relatedGaps.filter((gap) => gap.severity !== "info");
  if (actionableGaps.length > 0) return "missing";
  if (input.category === "docs" || input.category === "agentflight/config") return "not_required";
  if (input.proofKinds.passed.size > 0) return "covered";
  return input.category === "unknown" ? "unknown" : "not_required";
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

  if (input.changedFiles.length === 0) {
    return readinessDecision({
      state: "unknown",
      reason: "No changed files were detected for review.",
      nextAction: "Make changes or inspect git status before requesting review.",
      proofGaps: input.proofGaps
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

function baseFocusScore(category: RiskCategory, generatedGuidanceFile: boolean): number {
  return generatedGuidanceFile ? 5 : baseScores[category];
}

function proofStatusScore(proofStatus: ReviewProofStatus): number {
  return proofStatus === "missing" ? 30 : 0;
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
  return generatedGuidanceFiles.has(normalizeFilePath(file));
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
  generatedGuidanceFile?: boolean;
}): string[] {
  const { category, proofStatus, relatedGaps, projscanHint, generatedGuidanceFile } = input;
  if (generatedGuidanceFile) return ["generated tool state"];

  const reasons = [categoryLabel(category)];
  if (proofStatus === "failed") reasons.push("verification failed");
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
    grouped.set(category, [...(grouped.get(category) ?? []), file]);
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
  const startedEvents = events.filter((event) => event.type === "verification_started");

  return startedEvents
    .map((event) => ({
      command: readEventCommand(event.metadata) ?? "unknown verification command",
      startedAt: event.timestamp
    }))
    .filter((attempt) => !hasLaterCompletion(attempt, events, runs));
}

function hasLaterCompletion(
  attempt: IncompleteVerificationAttempt,
  events: NonNullable<AgentFlightSession["events"]>,
  runs: VerificationRun[]
): boolean {
  const command = normalizeCommand(attempt.command);

  return (
    events.some((event) => {
      if (event.type !== "verification_passed" && event.type !== "verification_failed") {
        return false;
      }
      return (
        normalizeCommand(readEventCommand(event.metadata) ?? "") === command &&
        timestampAtOrAfter(event.timestamp, attempt.startedAt)
      );
    }) ||
    runs.some(
      (run) =>
        normalizeCommand(run.command) === command &&
        timestampAtOrAfter(run.finishedAt, attempt.startedAt)
    )
  );
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
