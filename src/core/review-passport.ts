import { createHash } from "node:crypto";
import { writeJsonFileSafe, writeTextFileSafe } from "./fs-safe.js";
import { escapeMarkdownTextForDisplay } from "./output.js";
import { formatRepoRelativePath, resolveAgentFlightPaths } from "./paths.js";
import { assertSafeSessionId } from "./session-id.js";
import type { VerificationSummary } from "./verification.js";
import type {
  AgentFlightResultV1,
  AgentFlightSession,
  ReviewIntelligence,
  ReviewPassportArtifact,
  ReviewPassportIntegrityInput,
  ReviewPassportV1,
  RiskAnalysis
} from "../types/index.js";

export interface CreateReviewPassportOptions {
  generatedAt?: Date | undefined;
  producerVersion: string;
  session: AgentFlightSession;
  changedFiles: string[];
  risk: RiskAnalysis;
  verification: VerificationSummary;
  review: ReviewIntelligence;
  artifacts: ReviewPassportArtifact[];
  baseframeResult?: AgentFlightResultV1 | undefined;
  baseframeResultPath?: string | undefined;
}

export interface WriteReviewPassportArtifactsOptions {
  repoRoot: string;
  passport: ReviewPassportV1;
}

export interface ReviewPassportArtifactPaths {
  jsonPath: string;
  markdownPath: string;
  jsonRelativePath: string;
  markdownRelativePath: string;
}

export function createReviewPassport(options: CreateReviewPassportOptions): ReviewPassportV1 {
  const generatedAt = options.generatedAt ?? new Date();
  const baseframe = buildPassportBaseframe(options.baseframeResult, options.baseframeResultPath);
  const artifacts = normalizeArtifacts(options.artifacts, baseframe?.resultPath);
  const verificationRuns = buildPassportVerificationRuns(options.verification);
  const proofGaps = buildPassportProofGaps(options.review);
  const reviewFocus = buildPassportReviewFocus(options.review);
  const reviewQueue = buildPassportReviewQueue(options.review);
  const reviewRoutes = buildPassportReviewRoutes(options.review);
  const trustDelta = buildPassportTrustDelta(options.review);
  const integrityInputs = buildIntegrityInputs({
    session: {
      id: options.session.id,
      task: options.session.task.title,
      startedAt: options.session.startedAt,
      branch: options.session.git.branch,
      commit: options.session.git.commit
    },
    changedFiles: options.changedFiles,
    verification: verificationRuns,
    review: {
      readiness: options.review.readiness,
      proofGaps,
      reviewFocus,
      reviewQueue,
      reviewRoutes,
      trustDelta
    },
    ...(baseframe ? { baseframe } : {}),
    artifacts
  });

  const passport: ReviewPassportV1 = {
    schemaVersion: "1.0",
    kind: "agentflight-review-passport",
    producer: {
      name: "agentflight",
      version: options.producerVersion
    },
    generatedAt: generatedAt.toISOString(),
    session: {
      id: options.session.id,
      task: options.session.task.title,
      startedAt: options.session.startedAt,
      branch: options.session.git.branch,
      commit: options.session.git.commit,
      packageManager: options.session.packageManager
    },
    readiness: buildPassportReadiness(options.review),
    summary: buildPassportSummary({
      changedFiles: options.changedFiles.length,
      riskLevel: options.risk.level,
      verificationPassed: options.verification.passed,
      verificationFailed: options.verification.failed,
      proofGaps: proofGaps.length,
      readinessLabel: options.review.readiness.label
    }),
    changedFiles: options.changedFiles,
    risk: {
      level: options.risk.level,
      reasons: options.risk.reasons,
      categories: options.risk.categories
    },
    verification: {
      passed: options.verification.passed,
      failed: options.verification.failed,
      unresolvedFailed: options.verification.unresolvedFailed,
      resolvedFailed: options.verification.resolvedFailed,
      runs: verificationRuns
    },
    proofGaps,
    reviewFocus,
    reviewQueue,
    reviewRoutes,
    trustDelta,
    artifacts,
    integrity: {
      hashAlgorithm: "sha256",
      inputs: integrityInputs,
      fingerprintHash: sha256Json(integrityInputs)
    }
  };
  if (baseframe) passport.baseframe = baseframe;
  return passport;
}

function buildPassportBaseframe(
  result: AgentFlightResultV1 | undefined,
  resultPath: string | undefined
): ReviewPassportV1["baseframe"] | undefined {
  if (!result) return undefined;
  return {
    taskId: result.taskId,
    readiness: result.readiness,
    resultPath: resultPath ?? `.baseframe/evidence/${result.taskId}/agentflight-result.json`,
    gates: result.gates,
    scopeDrift: result.scopeDrift
  };
}

function buildPassportVerificationRuns(
  verification: VerificationSummary
): ReviewPassportV1["verification"]["runs"] {
  return verification.runs.map((run) => ({
    ...(run.id ? { id: run.id } : {}),
    command: run.command,
    status: run.status,
    exitCode: run.exitCode,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    durationMs: run.durationMs
  }));
}

function buildPassportProofGaps(review: ReviewIntelligence): ReviewPassportV1["proofGaps"] {
  return review.proofGaps.map((gap) => ({
    id: gap.id,
    severity: gap.severity,
    message: gap.message,
    ...(gap.suggestedCommand ? { suggestedCommand: gap.suggestedCommand } : {}),
    relatedFiles: gap.relatedFiles
  }));
}

function buildPassportReviewFocus(review: ReviewIntelligence): ReviewPassportV1["reviewFocus"] {
  return review.focus.map((item) => ({
    rank: item.rank,
    path: item.file,
    category: item.category,
    proofStatus: item.proofStatus,
    reasons: item.reasons,
    suggestedReviewerFocus: item.suggestedReviewerFocus,
    ...(item.suggestedCommand ? { suggestedCommand: item.suggestedCommand } : {})
  }));
}

function buildPassportReviewQueue(review: ReviewIntelligence): ReviewPassportV1["reviewQueue"] {
  return (review.reviewQueue ?? []).map((item) => ({
    rank: item.rank,
    action: item.action,
    label: item.label,
    detail: item.detail,
    relatedFiles: item.relatedFiles,
    ...(item.suggestedCommand ? { suggestedCommand: item.suggestedCommand } : {})
  }));
}

function buildPassportReviewRoutes(review: ReviewIntelligence): ReviewPassportV1["reviewRoutes"] {
  return (review.reviewRoutes?.items ?? []).map((item) => ({
    role: item.role,
    label: item.label,
    status: item.status,
    summary: item.summary,
    relatedFiles: item.relatedFiles,
    ...(item.suggestedCommand ? { suggestedCommand: item.suggestedCommand } : {})
  }));
}

function buildPassportTrustDelta(review: ReviewIntelligence): ReviewPassportV1["trustDelta"] {
  return {
    summary: review.trustDelta?.summary ?? "No trust delta available.",
    items: (review.trustDelta?.items ?? []).map((item) => ({
      kind: item.kind,
      severity: item.severity,
      message: item.message,
      relatedFiles: item.relatedFiles,
      ...(item.suggestedCommand ? { suggestedCommand: item.suggestedCommand } : {})
    }))
  };
}

function buildPassportReadiness(review: ReviewIntelligence): ReviewPassportV1["readiness"] {
  return {
    state: review.readiness.state,
    label: review.readiness.label,
    reason: review.readiness.reason,
    nextAction: review.readiness.nextAction,
    ...(review.readiness.suggestedCommand
      ? { suggestedCommand: review.readiness.suggestedCommand }
      : {})
  };
}

export async function writeReviewPassportArtifacts(
  options: WriteReviewPassportArtifactsOptions
): Promise<ReviewPassportArtifactPaths> {
  assertSafeSessionId(options.passport.session.id);
  const paths = reviewPassportArtifactPaths(options.repoRoot, options.passport.session.id);
  await writeJsonFileSafe(paths.jsonPath, options.passport, { overwrite: true });
  await writeTextFileSafe(paths.markdownPath, renderReviewPassportMarkdown(options.passport), {
    overwrite: true
  });
  return paths;
}

export function reviewPassportArtifactPaths(
  repoRoot: string,
  sessionId: string
): ReviewPassportArtifactPaths {
  assertSafeSessionId(sessionId);
  const reports = resolveAgentFlightPaths(repoRoot).reports;
  const jsonPath = `${reports}/${sessionId}-review-passport.json`;
  const markdownPath = `${reports}/${sessionId}-review-passport.md`;
  return {
    jsonPath,
    markdownPath,
    jsonRelativePath: formatRepoRelativePath(repoRoot, jsonPath),
    markdownRelativePath: formatRepoRelativePath(repoRoot, markdownPath)
  };
}

export function renderReviewPassportMarkdown(passport: ReviewPassportV1): string {
  const baseframe = passport.baseframe
    ? `## Baseframe
- Task: ${md(passport.baseframe.taskId)}
- Readiness: ${md(passport.baseframe.readiness)}
- Result: ${md(passport.baseframe.resultPath)}
- Gates: ${passport.baseframe.gates.map((gate) => `${gate.status} ${gate.command}`).join(", ") || "none"}
`
    : "";

  return `# AgentFlight Review Passport

Readiness: ${md(passport.readiness.label)}
Next action: ${md(passport.readiness.nextAction)}

## Summary

- Task: ${md(passport.session.task)}
- Session: ${md(passport.session.id)}
- Changed files: ${passport.changedFiles.length}
- Risk: ${md(passport.risk.level)}
- Verification: ${passport.verification.passed} passed, ${passport.verification.failed} failed
- Proof gaps: ${passport.proofGaps.length}

## Verification

${formatVerification(passport)}

## Review Focus

${formatReviewFocus(passport)}

## Proof Gaps

${formatProofGaps(passport)}

${baseframe}## Artifacts

${passport.artifacts.map((artifact) => `- ${artifact.kind}: ${md(artifact.path)}`).join("\n")}

## Integrity

- Hash algorithm: ${passport.integrity.hashAlgorithm}
- Fingerprint: ${passport.integrity.fingerprintHash}

Local only: no upload, no telemetry, no automatic PR comment.
`;
}

function normalizeArtifacts(
  artifacts: ReviewPassportArtifact[],
  baseframeResultPath: string | undefined
): ReviewPassportArtifact[] {
  const normalized = [...artifacts];
  if (
    baseframeResultPath &&
    !normalized.some(
      (artifact) => artifact.kind === "baseframe-result" && artifact.path === baseframeResultPath
    )
  ) {
    normalized.push({ kind: "baseframe-result", path: baseframeResultPath });
  }
  return normalized;
}

function buildIntegrityInputs(input: Record<string, unknown>): ReviewPassportIntegrityInput[] {
  return [
    { kind: "session", sha256: sha256Json(input.session) },
    { kind: "changed-files", sha256: sha256Json(input.changedFiles) },
    { kind: "verification", sha256: sha256Json(input.verification) },
    { kind: "review", sha256: sha256Json(input.review) },
    ...(input.baseframe
      ? [{ kind: "baseframe" as const, sha256: sha256Json(input.baseframe) }]
      : []),
    { kind: "artifacts", sha256: sha256Json(input.artifacts) }
  ];
}

function buildPassportSummary(input: {
  changedFiles: number;
  riskLevel: string;
  verificationPassed: number;
  verificationFailed: number;
  proofGaps: number;
  readinessLabel: string;
}): string {
  return `${input.readinessLabel}. ${input.changedFiles} changed file(s), risk ${input.riskLevel}, ${input.verificationPassed} verification run(s) passed, ${input.verificationFailed} failed, ${input.proofGaps} proof gap(s).`;
}

function formatVerification(passport: ReviewPassportV1): string {
  if (passport.verification.runs.length === 0) return "- No verification runs recorded.";
  return passport.verification.runs
    .map(
      (run) =>
        `- ${run.status}: ${md(run.command)}${run.exitCode === null ? "" : ` (exit ${run.exitCode})`}`
    )
    .join("\n");
}

function formatReviewFocus(passport: ReviewPassportV1): string {
  if (passport.reviewFocus.length === 0) return "- No changed files to review.";
  return passport.reviewFocus
    .slice(0, 8)
    .map(
      (item) =>
        `- ${md(item.path)}: ${md(item.reasons.join("; "))}${item.suggestedCommand ? `; suggested proof: ${md(item.suggestedCommand)}` : ""}`
    )
    .join("\n");
}

function formatProofGaps(passport: ReviewPassportV1): string {
  if (passport.proofGaps.length === 0) return "- none";
  return passport.proofGaps
    .map(
      (gap) =>
        `- ${gap.severity}: ${md(gap.message)}${gap.suggestedCommand ? `; suggested command: ${md(gap.suggestedCommand)}` : ""}`
    )
    .join("\n");
}

function sha256Json(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function md(value: string): string {
  return escapeMarkdownTextForDisplay(value);
}
