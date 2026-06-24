import type {
  ProjectReviewContractConfig,
  ProjectReviewContractEvaluation,
  ProjectReviewMatchedCategory,
  ProjectReviewContractRule,
  ProjectReviewContractSummary,
  ProjectReviewRequirementState,
  ProjectReviewRequirementStatus,
  ProjectReviewSatisfiedProof,
  ProofGap,
  ReviewProofStatus,
  RiskCategory,
  VerificationProofKind,
  VerificationRun
} from "../types/index.js";

export interface EvaluateProjectReviewContractOptions {
  contract: ProjectReviewContractConfig;
  changedFiles: string[];
  verificationCommands: string[];
  proofKinds: {
    passed: Set<VerificationProofKind>;
    failed: Set<VerificationProofKind>;
  };
  verificationRuns: VerificationRun[];
  proofFreshness: {
    state: "current" | "stale" | "legacy" | "unavailable" | "none";
  };
  unresolvedFailedRuns: VerificationRun[];
  filesByCategory: Map<RiskCategory, string[]>;
}

export function defaultProjectReviewContractConfig(): ProjectReviewContractConfig {
  return {
    enabled: true,
    rules: defaultProjectReviewContractRules()
  };
}

export function defaultProjectReviewContractRules(): ProjectReviewContractRule[] {
  return [
    {
      id: "missing-auth-test-proof",
      label: "Sensitive auth, payment, or security review",
      categories: ["auth", "billing/payments", "security/secrets"],
      requiredProof: ["test"],
      manualReview: [
        "Review session, permission, identity, payment, or credential boundaries manually."
      ],
      severity: "blocking",
      message: "Sensitive auth, payment, or security files changed without passing test evidence."
    },
    {
      id: "missing-database-test-proof",
      label: "Database migration review",
      categories: ["database/migrations"],
      requiredProof: ["test", "build"],
      manualReview: ["Review migration safety, data impact, and rollback assumptions manually."],
      severity: "blocking",
      message: "Database schema or migration files changed without passing test or build evidence."
    },
    {
      id: "missing-backend-proof",
      label: "Backend/API review",
      categories: ["backend/api"],
      requiredProof: ["test", "build"],
      manualReview: ["Review request handling, validation, and public API behavior manually."],
      severity: "warning",
      message: "Backend/API files changed without passing test or build evidence."
    },
    {
      id: "missing-dependency-proof",
      label: "Dependency review",
      categories: ["dependencies"],
      requiredProof: ["install", "build", "typecheck", "test"],
      manualReview: ["Review package and lockfile changes manually."],
      severity: "warning",
      message: "Dependency files changed without install, build, typecheck, or test evidence."
    },
    {
      id: "missing-config-proof",
      label: "Configuration and CI review",
      categories: ["config"],
      requiredProof: ["lint", "typecheck", "build"],
      manualReview: ["Review build, CI, and runtime configuration impact manually."],
      severity: "warning",
      message: "Config or CI files changed without lint, typecheck, or build evidence."
    },
    {
      id: "missing-frontend-build-proof",
      label: "Frontend behavior review",
      categories: ["frontend"],
      requiredProof: ["build", "test"],
      severity: "warning",
      message: "Frontend files changed without passing build or test evidence."
    },
    {
      id: "missing-source-proof",
      label: "Source behavior review",
      categories: ["source"],
      requiredProof: ["test", "typecheck", "build"],
      severity: "warning",
      message: "Source files changed without passing typecheck, test, or build evidence."
    },
    {
      id: "missing-test-suite-proof",
      label: "Test suite review",
      categories: ["tests"],
      requiredProof: ["test"],
      severity: "warning",
      message: "Test files changed without passing test evidence."
    },
    {
      id: "docs-manual-review",
      label: "Documentation review",
      categories: ["docs"],
      manualReview: ["Review documentation accuracy and scope manually."],
      severity: "info"
    },
    {
      id: "agentflight-config-manual-review",
      label: "AgentFlight config review",
      categories: ["agentflight/config"],
      manualReview: [
        "Review AgentFlight session defaults, verification commands, and changed-file filters manually."
      ],
      severity: "info"
    }
  ];
}

export function resolveProjectReviewContractConfig(
  config: ProjectReviewContractConfig | null | undefined
): ProjectReviewContractConfig {
  if (!config) return defaultProjectReviewContractConfig();
  return {
    enabled: config.enabled !== false,
    rules: Array.isArray(config.rules) ? config.rules : []
  };
}

export function evaluateProjectReviewContract(
  options: EvaluateProjectReviewContractOptions
): ProjectReviewContractEvaluation {
  if (!options.contract.enabled) {
    return {
      enabled: false,
      requirements: [],
      summary: emptyProjectReviewContractSummary()
    };
  }

  const requirements = options.contract.rules
    .map((rule) => evaluateRule(rule, options))
    .filter((requirement): requirement is ProjectReviewRequirementStatus => Boolean(requirement));

  return {
    enabled: true,
    requirements,
    summary: summarizeProjectReviewRequirements(requirements)
  };
}

export function projectRequirementProofGaps(
  evaluation: ProjectReviewContractEvaluation
): ProofGap[] {
  if (!evaluation.enabled) return [];
  return evaluation.requirements
    .filter((requirement) => requirement.status === "missing")
    .map((requirement) => {
      const gap: ProofGap = {
        id: requirement.id,
        severity: requirement.severity,
        message:
          requirement.message ??
          `${requirement.label} requires passing ${formatProofKinds(requirement.requiredProof)} proof.`,
        relatedFiles: requirement.relatedFiles
      };
      if (requirement.suggestedCommand) gap.suggestedCommand = requirement.suggestedCommand;
      return gap;
    });
}

function evaluateRule(
  rule: ProjectReviewContractRule,
  options: EvaluateProjectReviewContractOptions
): ProjectReviewRequirementStatus | null {
  const relatedFiles = relatedFilesForRule(rule, options.filesByCategory);
  if (relatedFiles.length === 0) return null;

  const requiredProof = normalizedProofKinds(rule.requiredProof ?? []);
  const manualReview = normalizedStrings(rule.manualReview ?? []);
  const proofStatus = determineRequirementProofStatus(requiredProof, options);
  const status = determineRequirementStatus(proofStatus, manualReview);
  const matchedCategories = matchedCategoriesForRule(rule, options.filesByCategory);
  const suggestedCommand = suggestedCommandForRequirement(proofStatus, requiredProof, options);
  const satisfiedProof = satisfiedProofForRequirement(requiredProof, options.verificationRuns);

  return buildRequirementStatus({
    rule,
    status,
    proofStatus,
    requiredProof,
    manualReview,
    relatedFiles,
    matchedCategories,
    matchReason: formatMatchReason(matchedCategories),
    proofReason: formatProofReason({
      proofStatus,
      requiredProof,
      satisfiedProof,
      suggestedCommand
    }),
    satisfiedProof,
    remainingReview: remainingReviewForRequirement({
      proofStatus,
      suggestedCommand,
      manualReview
    }),
    suggestedCommand
  });
}

function buildRequirementStatus(input: {
  rule: ProjectReviewContractRule;
  status: ProjectReviewRequirementState;
  proofStatus: ReviewProofStatus;
  requiredProof: VerificationProofKind[];
  manualReview: string[];
  relatedFiles: string[];
  matchedCategories: ProjectReviewMatchedCategory[];
  matchReason: string;
  proofReason: string;
  satisfiedProof?: ProjectReviewSatisfiedProof | undefined;
  remainingReview: string[];
  suggestedCommand?: string | undefined;
}): ProjectReviewRequirementStatus {
  const requirement: ProjectReviewRequirementStatus = {
    id: input.rule.id,
    label: input.rule.label,
    status: input.status,
    proofStatus: input.proofStatus,
    severity: input.rule.severity ?? "warning",
    requiredProof: input.requiredProof,
    manualReview: input.manualReview,
    relatedFiles: input.relatedFiles,
    matchedCategories: input.matchedCategories,
    matchReason: input.matchReason,
    proofReason: input.proofReason,
    remainingReview: input.remainingReview,
    relatedProofGapIds: relatedProofGapsForRequirement(input.rule.id, input.status)
  };
  if (input.satisfiedProof) requirement.satisfiedProof = input.satisfiedProof;
  if (input.suggestedCommand) requirement.suggestedCommand = input.suggestedCommand;
  if (input.rule.message) requirement.message = input.rule.message;
  return requirement;
}

function suggestedCommandForRequirement(
  proofStatus: ReviewProofStatus,
  requiredProof: VerificationProofKind[],
  options: EvaluateProjectReviewContractOptions
): string | undefined {
  if (proofStatus === "failed") {
    return findFailedCommand(options.unresolvedFailedRuns, requiredProof);
  }

  if (proofStatus === "missing" || proofStatus === "stale") {
    return findSuggestedCommand(options.verificationCommands, requiredProof);
  }

  return undefined;
}

function relatedFilesForRule(
  rule: ProjectReviewContractRule,
  filesByCategory: Map<RiskCategory, string[]>
): string[] {
  return uniqueStrings(rule.categories.flatMap((category) => filesByCategory.get(category) ?? []));
}

function matchedCategoriesForRule(
  rule: ProjectReviewContractRule,
  filesByCategory: Map<RiskCategory, string[]>
): ProjectReviewMatchedCategory[] {
  return rule.categories
    .map((category) => ({
      category,
      files: filesByCategory.get(category) ?? []
    }))
    .filter((match) => match.files.length > 0);
}

function determineRequirementProofStatus(
  requiredProof: VerificationProofKind[],
  options: EvaluateProjectReviewContractOptions
): ReviewProofStatus {
  if (requiredProof.length === 0) return "not_required";
  if (requiredProof.some((kind) => options.proofKinds.failed.has(kind))) return "failed";
  if (!requiredProof.some((kind) => options.proofKinds.passed.has(kind))) return "missing";
  if (options.proofFreshness.state === "stale") return "stale";
  return options.proofFreshness.state === "current" ? "current" : "covered";
}

function determineRequirementStatus(
  proofStatus: ReviewProofStatus,
  manualReview: string[]
): ProjectReviewRequirementState {
  if (proofStatus === "failed") return "failed";
  if (proofStatus === "stale") return "stale";
  if (proofStatus === "missing") return "missing";
  if (proofStatus === "unknown") return "unknown";
  if (manualReview.length > 0) return "needs_review";
  if (proofStatus === "not_required") return "not_required";
  return "supported";
}

function relatedProofGapsForRequirement(
  ruleId: string,
  status: ProjectReviewRequirementState
): string[] {
  if (status === "missing") return [ruleId];
  if (status === "failed") return ["failed-verification"];
  if (status === "stale") return ["stale-verification-proof"];
  return [];
}

function summarizeProjectReviewRequirements(
  requirements: ProjectReviewRequirementStatus[]
): ProjectReviewContractSummary {
  const summary = emptyProjectReviewContractSummary();
  for (const requirement of requirements) {
    summary.total += 1;
    if (requirement.manualReview.length > 0) summary.manualReview += 1;
    if (requirement.status === "supported") summary.supported += 1;
    else if (requirement.status === "needs_review") summary.needsReview += 1;
    else if (requirement.status === "missing") summary.missing += 1;
    else if (requirement.status === "failed") summary.failed += 1;
    else if (requirement.status === "stale") summary.stale += 1;
    else if (requirement.status === "not_required") summary.notRequired += 1;
    else summary.unknown += 1;
  }
  return summary;
}

function emptyProjectReviewContractSummary(): ProjectReviewContractSummary {
  return {
    total: 0,
    supported: 0,
    needsReview: 0,
    missing: 0,
    failed: 0,
    stale: 0,
    manualReview: 0,
    notRequired: 0,
    unknown: 0
  };
}

function findSuggestedCommand(
  commands: string[],
  proofKinds: VerificationProofKind[]
): string | undefined {
  for (const proofKind of proofKinds) {
    const command = commands.find((candidate) => classifyCommandProofKind(candidate) === proofKind);
    if (command) return command;
  }
  return undefined;
}

function findFailedCommand(
  runs: VerificationRun[],
  proofKinds: VerificationProofKind[]
): string | undefined {
  return runs.find((run) => proofKinds.includes(classifyCommandProofKind(run.command)))?.command;
}

function satisfiedProofForRequirement(
  proofKinds: VerificationProofKind[],
  runs: VerificationRun[]
): ProjectReviewSatisfiedProof | undefined {
  for (const proofKind of proofKinds) {
    const run = [...runs]
      .reverse()
      .find(
        (candidate) =>
          candidate.status === "passed" && classifyCommandProofKind(candidate.command) === proofKind
      );
    if (run) {
      const satisfiedProof: ProjectReviewSatisfiedProof = {
        kind: proofKind,
        command: run.command
      };
      if (run.finishedAt) satisfiedProof.finishedAt = run.finishedAt;
      return satisfiedProof;
    }
  }
  return undefined;
}

function formatMatchReason(matches: ProjectReviewMatchedCategory[]): string {
  return `Matched ${formatMatchedCategorySeries(matches)}`;
}

function formatMatchedCategorySeries(matches: ProjectReviewMatchedCategory[]): string {
  const parts = matches.map(
    (match) => `${match.category} changes: ${formatMatchedFiles(match.files)}`
  );
  if (parts.length === 0) return "configured review rule";
  if (parts.length === 1) return parts[0]!;
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

function formatMatchedFiles(files: string[]): string {
  if (files.length <= 3) return files.join(", ");
  return `${files.length} files`;
}

function formatProofReason(input: {
  proofStatus: ReviewProofStatus;
  requiredProof: VerificationProofKind[];
  satisfiedProof?: ProjectReviewSatisfiedProof | undefined;
  suggestedCommand?: string | undefined;
}): string {
  if (input.proofStatus === "not_required") return "No automated proof required.";
  if (input.proofStatus === "missing") {
    return `No passing ${formatProofKinds(input.requiredProof)} proof recorded.`;
  }
  if (input.proofStatus === "failed") {
    const proof = input.suggestedCommand
      ? `${formatProofKinds(input.requiredProof)} proof failed: ${input.suggestedCommand}`
      : `${formatProofKinds(input.requiredProof)} proof failed`;
    return capitalizeFirst(proof);
  }
  if (input.proofStatus === "stale") {
    const kind = input.satisfiedProof?.kind ?? formatProofKinds(input.requiredProof);
    return `${capitalizeFirst(kind)} proof is stale; files changed after proof was captured.`;
  }
  if (input.satisfiedProof) {
    return `Satisfied by ${input.proofStatus} ${input.satisfiedProof.kind} proof: ${input.satisfiedProof.command}`;
  }
  return `Proof status: ${input.proofStatus}.`;
}

function remainingReviewForRequirement(input: {
  proofStatus: ReviewProofStatus;
  suggestedCommand?: string | undefined;
  manualReview: string[];
}): string[] {
  const remaining: string[] = [];
  if (input.proofStatus === "missing" && input.suggestedCommand) {
    remaining.push(`Run agentflight verify -- ${input.suggestedCommand}.`);
  } else if (input.proofStatus === "stale" && input.suggestedCommand) {
    remaining.push(`Rerun agentflight verify -- ${input.suggestedCommand}.`);
  } else if (input.proofStatus === "failed" && input.suggestedCommand) {
    remaining.push(`Fix failed proof and rerun agentflight verify -- ${input.suggestedCommand}.`);
  }
  remaining.push(...input.manualReview);
  return remaining;
}

function classifyCommandProofKind(command: string): VerificationProofKind {
  const normalized = command.toLowerCase();

  if (/\b(npm|pnpm|yarn|bun)\s+(ci|install)\b/.test(normalized)) return "install";
  if (/\b(vitest|jest|mocha|playwright|cypress|test|verify)\b/.test(normalized)) return "test";
  if (/\bbuild\b/.test(normalized)) return "build";
  if (/\b(typecheck|tsc)\b/.test(normalized)) return "typecheck";
  if (/\b(lint|eslint)\b/.test(normalized)) return "lint";

  return "unknown";
}

function normalizedProofKinds(kinds: VerificationProofKind[]): VerificationProofKind[] {
  const allowed = new Set<VerificationProofKind>([
    "test",
    "build",
    "typecheck",
    "lint",
    "install",
    "unknown"
  ]);
  return uniqueStrings(kinds.filter((kind) => allowed.has(kind))) as VerificationProofKind[];
}

function normalizedStrings(values: string[]): string[] {
  return uniqueStrings(values.map((value) => value.trim()).filter(Boolean));
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function formatProofKinds(kinds: VerificationProofKind[]): string {
  if (kinds.length === 0) return "manual-review";
  if (kinds.length === 1) return kinds[0]!;
  if (kinds.length === 2) return `${kinds[0]} or ${kinds[1]}`;
  return `${kinds.slice(0, -1).join(", ")}, or ${kinds[kinds.length - 1]}`;
}

function capitalizeFirst(value: string): string {
  return value ? `${value[0]!.toUpperCase()}${value.slice(1)}` : value;
}
