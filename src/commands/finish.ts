import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  baseframeResultRelativePath,
  formatAgentLoopKitReconciliationCommand
} from "../core/baseframe.js";
import { formatRepoRelativePath } from "../core/paths.js";
import {
  createReviewPassport,
  reviewPassportArtifactPaths,
  writeReviewPassportArtifacts
} from "../core/review-passport.js";
import { appendSessionEvent } from "../core/session.js";
import type { VerificationSummary } from "../core/verification.js";
import { runFinalizeCommand } from "./finalize.js";
import { runHandoffCommand } from "./handoff.js";
import { readCurrentSession, runStatusCommand } from "./status.js";
import type {
  AgentFlightResultV1,
  ReviewIntelligence,
  ReviewPassportArtifact,
  ReviewPassportV1,
  RiskAnalysis
} from "../types/index.js";

export interface FinishCommandOptions {
  repoRoot: string;
  changedFiles?: string[] | undefined;
  now?: Date | undefined;
  producerVersion?: string | undefined;
}

export interface FinishCommandResult {
  output: string;
  exitCode: number;
  passportPath: string;
  passportMarkdownPath: string;
}

interface FinishStatusJson {
  changedFiles: string[];
  risk: RiskAnalysis;
  verification: {
    passed: number;
    failed: number;
    unresolvedFailed: number;
    resolvedFailed: number;
    runs: VerificationSummary["runs"];
  };
  review: ReviewIntelligence;
  baseframe: AgentFlightResultV1 | null;
  reason: string;
  nextAction: string;
}

export async function runFinishCommand(
  options: FinishCommandOptions
): Promise<FinishCommandResult> {
  const now = options.now ?? new Date();
  const initialSession = await readCurrentSession(options.repoRoot);
  const status = await readFinishStatus({
    repoRoot: options.repoRoot,
    changedFiles: options.changedFiles,
    now
  });
  const stableChangedFiles = status.changedFiles;
  const handoff = await runHandoffCommand({
    repoRoot: options.repoRoot,
    changedFiles: stableChangedFiles,
    now
  });

  let baseframeResultPath: string | undefined;
  let agentLoopKitCommand: string | undefined;
  let baseframeResult = status.baseframe ?? undefined;
  if (initialSession.baseframeIntegration) {
    const finalized = await runFinalizeCommand({
      repoRoot: options.repoRoot,
      changedFiles: stableChangedFiles,
      now
    });
    baseframeResultPath = formatRepoRelativePath(options.repoRoot, finalized.resultPath);
    baseframeResult = await readBaseframeResult(finalized.resultPath);
    agentLoopKitCommand = formatAgentLoopKitReconciliationCommand(
      initialSession.baseframeIntegration.taskId,
      baseframeResultRelativePath(initialSession.baseframeIntegration.taskId)
    );
  }

  const session = await readCurrentSession(options.repoRoot);
  const passportPaths = reviewPassportArtifactPaths(options.repoRoot, session.id);
  const producerVersion = options.producerVersion ?? (await readAgentFlightVersion());
  const review = withFinishNextAction(status.review);
  const artifacts: ReviewPassportArtifact[] = [
    { kind: "passport-json", path: passportPaths.jsonRelativePath },
    { kind: "passport-markdown", path: passportPaths.markdownRelativePath },
    { kind: "handoff", path: formatRepoRelativePath(options.repoRoot, handoff.sessionHandoffPath) },
    { kind: "report", path: formatRepoRelativePath(options.repoRoot, handoff.reportPath) },
    { kind: "replay", path: formatRepoRelativePath(options.repoRoot, handoff.replayPath) },
    { kind: "resume", path: formatRepoRelativePath(options.repoRoot, handoff.sessionResumePath) }
  ];

  const passport = createReviewPassport({
    generatedAt: now,
    producerVersion,
    session,
    changedFiles: stableChangedFiles,
    risk: status.risk,
    verification: {
      runs: status.verification.runs,
      passed: status.verification.passed,
      failed: status.verification.failed,
      unresolvedFailed: status.verification.unresolvedFailed,
      resolvedFailed: status.verification.resolvedFailed,
      unresolvedFailedRuns: [],
      missingCommands: [],
      gaps: [],
      readiness: "Unknown",
      nextAction: review.readiness.nextAction
    },
    review,
    artifacts,
    baseframeResult,
    baseframeResultPath
  });
  const written = await writeReviewPassportArtifacts({
    repoRoot: options.repoRoot,
    passport
  });

  await appendSessionEvent(options.repoRoot, session, {
    type: "review_passport_generated",
    timestamp: now,
    title: "Review Passport generated",
    metadata: {
      path: written.jsonRelativePath,
      markdownPath: written.markdownRelativePath,
      readiness: passport.readiness.state
    }
  });

  return {
    output: renderFinishOutput({
      passport,
      jsonPath: written.jsonRelativePath,
      markdownPath: written.markdownRelativePath,
      handoffPath: formatRepoRelativePath(options.repoRoot, handoff.sessionHandoffPath),
      reportPath: formatRepoRelativePath(options.repoRoot, handoff.reportPath),
      replayPath: formatRepoRelativePath(options.repoRoot, handoff.replayPath),
      resumePath: formatRepoRelativePath(options.repoRoot, handoff.sessionResumePath),
      baseframeResultPath,
      agentLoopKitCommand
    }),
    exitCode: handoff.exitCode,
    passportPath: written.jsonPath,
    passportMarkdownPath: written.markdownPath
  };
}

async function readFinishStatus(input: {
  repoRoot: string;
  changedFiles?: string[] | undefined;
  now: Date;
}): Promise<FinishStatusJson> {
  const status = await runStatusCommand({
    repoRoot: input.repoRoot,
    changedFiles: input.changedFiles,
    now: input.now,
    format: "json"
  });
  return JSON.parse(status.output) as FinishStatusJson;
}

async function readBaseframeResult(resultPath: string): Promise<AgentFlightResultV1> {
  return JSON.parse(await readFile(resultPath, "utf8")) as AgentFlightResultV1;
}

function renderFinishOutput(input: {
  passport: ReviewPassportV1;
  jsonPath: string;
  markdownPath: string;
  handoffPath: string;
  reportPath: string;
  replayPath: string;
  resumePath: string;
  baseframeResultPath?: string | undefined;
  agentLoopKitCommand?: string | undefined;
}): string {
  const blockingSignals = input.passport.proofGaps.filter((gap) => gap.severity === "blocking");

  return `AgentFlight finish

Readiness:
${input.passport.readiness.label}

Changed files:
${input.passport.changedFiles.length}

Verification:
${input.passport.verification.passed} passed, ${input.passport.verification.failed} failed

Blocking signals:
${formatBlockingSignals(blockingSignals)}

Review Passport:
- JSON: ${input.jsonPath}
- Markdown: ${input.markdownPath}

Artifacts:
- Handoff: ${input.handoffPath}
- Report: ${input.reportPath}
- Replay: ${input.replayPath}
- Resume: ${input.resumePath}
${formatBaseframeSection(input)}
Next action:
${input.passport.readiness.nextAction}

Local only: no upload, no telemetry, no automatic PR comment.
`;
}

function withFinishNextAction(review: ReviewIntelligence): ReviewIntelligence {
  if (review.readiness.state === "ready_for_review") {
    return {
      ...review,
      readiness: {
        ...review.readiness,
        nextAction: "Share the Review Passport and handoff packet for scoped review."
      }
    };
  }
  if (review.readiness.state === "clean_worktree") {
    return {
      ...review,
      readiness: {
        ...review.readiness,
        nextAction: "Start a new AgentFlight session when you begin the next task."
      }
    };
  }
  return review;
}

function formatBlockingSignals(gaps: ReviewPassportV1["proofGaps"]): string {
  if (gaps.length === 0) return "- none";
  return gaps
    .slice(0, 5)
    .map((gap) => `- ${gap.message}${gap.suggestedCommand ? ` (${gap.suggestedCommand})` : ""}`)
    .join("\n");
}

function formatBaseframeSection(input: {
  baseframeResultPath?: string | undefined;
  agentLoopKitCommand?: string | undefined;
}): string {
  if (!input.baseframeResultPath) return "";
  return `- Baseframe result: ${input.baseframeResultPath}

AgentLoopKit reconciliation:
${input.agentLoopKitCommand ?? ""}

`;
}

async function readAgentFlightVersion(): Promise<string> {
  const packagePath = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "package.json");
  try {
    const packageJson = JSON.parse(await readFile(packagePath, "utf8")) as { version?: unknown };
    return typeof packageJson.version === "string" ? packageJson.version : "0.0.0";
  } catch {
    return "0.0.0";
  }
}
