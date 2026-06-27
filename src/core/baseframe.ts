import { readFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { filterBuiltInRuntimePaths } from "./changed-files.js";
import { pathExists, readJsonFile, writeJsonFileSafe } from "./fs-safe.js";
import { categorizeFile } from "./risk.js";
import { getSessionEvents, getVerificationRuns } from "./session.js";
import { getUnresolvedFailedRuns, normalizeCommandString } from "./verification-runs.js";
import type {
  AgentFlightResultV1,
  AgentFlightSession,
  AgentLoopKitTaskContractV1,
  BaseframeIntegrationContext,
  GateEvidenceStatus,
  ProjScanAssessmentV1,
  ScopeDriftFinding,
  SessionEvent,
  VerificationRun
} from "../types/index.js";

export interface LoadBaseframeIntegrationContextOptions {
  repoRoot: string;
  taskPath: string;
  projscanPath?: string | undefined;
  taskId?: string | undefined;
}

export interface CreateAgentFlightResultOptions {
  repoRoot: string;
  session: AgentFlightSession;
  changedFiles: string[];
  now?: Date | undefined;
  artifacts?: AgentFlightResultV1["artifacts"] | undefined;
}

export interface MatchVerificationGateInput {
  gates: Array<{
    id: string;
    command: string;
    reason: string;
    required: boolean;
    status?: "pending" | "passed" | "failed" | "skipped" | undefined;
  }>;
  runs: VerificationRun[];
  events?: SessionEvent[] | undefined;
}

export interface DetectScopeDriftInput {
  changedFiles: string[];
  allowedPaths: string[];
  excludedPaths: string[];
}

export interface UpdateBaseframeWorkflowManifestOptions {
  repoRoot: string;
  taskId: string;
  resultPath: string;
  version: string;
}

export interface BaseframeLoadedContracts {
  context: BaseframeIntegrationContext;
  task: AgentLoopKitTaskContractV1;
  assessment: ProjScanAssessmentV1;
}

export async function loadBaseframeIntegrationContext(
  options: LoadBaseframeIntegrationContextOptions
): Promise<BaseframeIntegrationContext> {
  return (await loadBaseframeContracts(options)).context;
}

export async function loadBaseframeContracts(
  options: LoadBaseframeIntegrationContextOptions
): Promise<BaseframeLoadedContracts> {
  const taskPath = resolveSafeLocalPath(options.repoRoot, options.taskPath);
  const task = validateAgentLoopKitTaskContract(await readJsonFile<unknown>(taskPath.absolute));
  if (options.taskId && options.taskId !== task.taskId) {
    throw new Error(
      `Baseframe task ID mismatch: requested "${options.taskId}" does not match AgentLoopKit "${task.taskId}".`
    );
  }

  const assessmentInputPath = options.projscanPath ?? task.sourceAssessment.path;
  const assessmentPath = resolveSafeLocalPath(options.repoRoot, assessmentInputPath);
  const assessment = validateProjScanAssessment(
    await readJsonFile<unknown>(assessmentPath.absolute)
  );
  validateLinkedContracts(task, assessment);

  return {
    task,
    assessment,
    context: buildBaseframeIntegrationContext({
      task,
      assessment,
      taskPath: taskPath.relative,
      assessmentPath: assessmentPath.relative
    })
  };
}

export async function createAgentFlightResult(
  options: CreateAgentFlightResultOptions
): Promise<AgentFlightResultV1> {
  const context = options.session.baseframeIntegration;
  if (!context) {
    throw new Error(
      "No Baseframe integration context is recorded on the current AgentFlight session."
    );
  }

  const task = context.agentloopkitTaskPath
    ? validateAgentLoopKitTaskContract(
        await readJsonFile<unknown>(
          resolveSafeLocalPath(options.repoRoot, context.agentloopkitTaskPath).absolute
        )
      )
    : buildTaskFallbackFromContext(context);
  const assessment = context.projscanAssessmentPath
    ? validateProjScanAssessment(
        await readJsonFile<unknown>(
          resolveSafeLocalPath(options.repoRoot, context.projscanAssessmentPath).absolute
        )
      )
    : undefined;
  if (assessment) validateLinkedContracts(task, assessment);

  const changedFiles = uniqueSorted(filterBuiltInRuntimePaths(options.changedFiles));
  const scopeDrift = detectScopeDrift({
    changedFiles,
    allowedPaths: context.expectedScope.allowedPaths,
    excludedPaths: context.expectedScope.excludedPaths
  });
  const gates = matchVerificationGates({
    gates: task.verificationGates,
    runs: getVerificationRuns(options.session),
    events: getSessionEvents(options.session)
  });
  const incompleteVerification = detectIncompleteVerificationAttempts(options.session);
  const verification = buildResultVerification(
    getVerificationRuns(options.session),
    incompleteVerification
  );
  const proofGaps = buildBaseframeProofGaps({
    assessment,
    task,
    scopeDrift,
    gates,
    session: options.session,
    incompleteVerification
  });
  const reviewFocus = buildUnifiedReviewFocus({
    changedFiles,
    imported: context.importedReviewFocus
  });
  const readiness = determineBaseframeReadiness({
    assessment,
    task,
    scopeDrift,
    gates,
    proofGaps,
    session: options.session,
    incompleteVerification
  });
  const version = await readAgentFlightVersion();
  const result: AgentFlightResultV1 = {
    schemaVersion: "1.0",
    kind: "agentflight-result",
    producer: {
      name: "agentflight",
      version
    },
    taskId: context.taskId,
    generatedAt: (options.now ?? new Date()).toISOString(),
    source: buildResultSource(context),
    readiness,
    summary: summarizeBaseframeResult({
      assessment,
      task,
      changedFiles,
      scopeDrift,
      gates,
      readiness
    }),
    changedFiles,
    scopeDrift: scopeDrift.map((finding) => ({
      path: finding.path,
      reason: finding.reason
    })),
    verification,
    gates: gates.map((gate) => ({
      gateId: gate.gateId,
      command: gate.command,
      status: gate.status,
      ...(gate.matchingVerificationRunId
        ? { verificationRunId: gate.matchingVerificationRunId }
        : {})
    })),
    proofGaps,
    reviewFocus,
    artifacts: uniqueArtifacts(options.artifacts ?? [])
  };

  const resultPath = baseframeResultPath(options.repoRoot, context.taskId);
  await writeJsonFileSafe(resultPath, result, { overwrite: true });
  return result;
}

export function detectScopeDrift(input: DetectScopeDriftInput): ScopeDriftFinding[] {
  const changedFiles = uniqueSorted(filterBuiltInRuntimePaths(input.changedFiles));
  const allowedPatterns = normalizePatternList(input.allowedPaths);
  const excludedPatterns = normalizePatternList(input.excludedPaths);
  const hasAllowedScope = allowedPatterns.length > 0;
  const findings: ScopeDriftFinding[] = [];

  for (const file of changedFiles) {
    if (matchesAnyPattern(file, excludedPatterns)) {
      findings.push({
        path: file,
        reason: "inside-excluded-scope",
        severity: "blocking"
      });
      continue;
    }

    if (hasAllowedScope && !matchesAnyPattern(file, allowedPatterns)) {
      findings.push({
        path: file,
        reason: "outside-allowed-scope",
        severity: "warning"
      });
      continue;
    }

    if (!hasAllowedScope) {
      findings.push({
        path: file,
        reason: "unclassified",
        severity: "warning"
      });
    }
  }

  return findings;
}

export function matchVerificationGates(input: MatchVerificationGateInput): GateEvidenceStatus[] {
  const incompleteCommands = detectIncompleteCommands(input.events ?? [], input.runs);

  return input.gates.map((gate) => {
    if (!gate.required || gate.status === "skipped") {
      return {
        gateId: gate.id,
        command: gate.command,
        status: "skipped"
      };
    }

    const matchingRuns = input.runs
      .map((run, index) => ({ run, index }))
      .filter(({ run }) => commandsMatch(gate.command, run.command));
    const latest = matchingRuns.at(-1);
    if (latest) {
      return {
        gateId: gate.id,
        command: gate.command,
        status: latest.run.status,
        matchingVerificationRunId: latest.run.id ?? `verification-${latest.index + 1}`
      };
    }

    if (incompleteCommands.some((command) => commandsMatch(gate.command, command))) {
      return {
        gateId: gate.id,
        command: gate.command,
        status: "incomplete"
      };
    }

    return {
      gateId: gate.id,
      command: gate.command,
      status: "missing"
    };
  });
}

export async function updateBaseframeWorkflowManifest(
  options: UpdateBaseframeWorkflowManifestOptions
): Promise<void> {
  assertSafeTaskId(options.taskId);
  const resultPath = normalizeRepoRelativePath(options.resultPath);
  const manifestPath = join(options.repoRoot, ".baseframe", "agent-workflow.json");
  const existing = (await pathExists(manifestPath))
    ? await readJsonFile<Record<string, unknown>>(manifestPath)
    : {};
  const next = {
    ...existing,
    agentflight: {
      status: "completed",
      resultPath,
      version: options.version
    }
  };
  await writeJsonFileSafe(manifestPath, next, { overwrite: true });
}

export function baseframeResultRelativePath(taskId: string): string {
  assertSafeTaskId(taskId);
  return `.baseframe/evidence/${taskId}/agentflight-result.json`;
}

export function baseframeResultPath(repoRoot: string, taskId: string): string {
  return join(repoRoot, baseframeResultRelativePath(taskId));
}

export function formatAgentLoopKitReconciliationCommand(
  taskId: string,
  resultPath: string
): string {
  return `agentloopkit check-gates \\
  --task ${taskId} \\
  --from-agentflight ${resultPath}`;
}

function buildBaseframeIntegrationContext(input: {
  task: AgentLoopKitTaskContractV1;
  assessment: ProjScanAssessmentV1;
  taskPath: string;
  assessmentPath: string;
}): BaseframeIntegrationContext {
  return {
    schemaVersion: "1.0",
    taskId: input.task.taskId,
    projscanAssessmentPath: input.assessmentPath,
    agentloopkitTaskPath: input.taskPath,
    expectedScope: {
      allowedPaths: [...input.task.scope.allowedPaths],
      excludedPaths: [...input.task.scope.excludedPaths]
    },
    requiredVerification: input.task.verificationGates.map((gate) => ({
      id: gate.id,
      command: gate.command,
      reason: gate.reason,
      required: gate.required
    })),
    importedReviewFocus: [
      ...input.assessment.reviewFocus.map((item) => ({
        path: item.path,
        priority: item.priority,
        reasons: [...item.reasons],
        source: "projscan" as const
      })),
      ...input.task.scope.reviewFirst.map((item) => ({
        path: item.path,
        priority: "high" as const,
        reasons: [...item.reasons],
        source: "agentloopkit" as const
      }))
    ]
  };
}

function validateLinkedContracts(
  task: AgentLoopKitTaskContractV1,
  assessment: ProjScanAssessmentV1
): void {
  if (task.taskId !== assessment.taskId) {
    throw new Error(
      `Baseframe task ID mismatch: AgentLoopKit "${task.taskId}" does not match ProjScan "${assessment.taskId}".`
    );
  }

  if (normalizeText(task.intent) !== normalizeText(assessment.intent)) {
    throw new Error(
      `Baseframe intent mismatch: AgentLoopKit "${task.intent}" does not match ProjScan "${assessment.intent}".`
    );
  }
}

function validateProjScanAssessment(value: unknown): ProjScanAssessmentV1 {
  const object = expectObject(value, "ProjScan assessment");
  expectLiteral(object.schemaVersion, "1.0", "ProjScan assessment", "schemaVersion");
  expectLiteral(object.kind, "projscan-assessment", "ProjScan assessment", "kind");
  expectProducer(object.producer, "projscan", "ProjScan assessment");
  expectString(object.taskId, "ProjScan assessment", "taskId");
  expectString(object.intent, "ProjScan assessment", "intent");
  expectString(object.generatedAt, "ProjScan assessment", "generatedAt");
  expectEnum(
    object.verdict,
    ["proceed", "caution", "block", "unknown"],
    "ProjScan assessment",
    "verdict"
  );
  expectString(object.summary, "ProjScan assessment", "summary");
  const repository = expectObject(object.repository, "ProjScan assessment repository");
  expectString(repository.root, "ProjScan assessment repository", "root");
  expectArray(object.impactedAreas, "ProjScan assessment", "impactedAreas");
  const reviewFocus = expectArray(object.reviewFocus, "ProjScan assessment", "reviewFocus");
  expectArray(object.risks, "ProjScan assessment", "risks");
  expectArray(object.suggestedChecks, "ProjScan assessment", "suggestedChecks");
  const reviewFocusPaths = reviewFocus.map((item) => {
    const focus = expectObject(item, "ProjScan reviewFocus");
    expectString(focus.path, "ProjScan reviewFocus", "path");
    return focus.path as string;
  });
  validatePathList(reviewFocusPaths, "ProjScan reviewFocus");
  validateArtifactPaths(object.artifacts, "ProjScan artifacts");
  return value as ProjScanAssessmentV1;
}

function validateAgentLoopKitTaskContract(value: unknown): AgentLoopKitTaskContractV1 {
  const object = expectObject(value, "AgentLoopKit task contract");
  expectLiteral(object.schemaVersion, "1.0", "AgentLoopKit task contract", "schemaVersion");
  expectLiteral(object.kind, "agentloopkit-task", "AgentLoopKit task contract", "kind");
  expectProducer(object.producer, "agentloopkit", "AgentLoopKit task contract");
  expectString(object.taskId, "AgentLoopKit task contract", "taskId");
  expectString(object.intent, "AgentLoopKit task contract", "intent");
  expectString(object.title, "AgentLoopKit task contract", "title");
  expectString(object.createdAt, "AgentLoopKit task contract", "createdAt");
  const sourceAssessment = expectObject(object.sourceAssessment, "AgentLoopKit sourceAssessment");
  expectString(sourceAssessment.path, "AgentLoopKit sourceAssessment", "path");
  expectString(
    sourceAssessment.producerVersion,
    "AgentLoopKit sourceAssessment",
    "producerVersion"
  );
  expectEnum(
    sourceAssessment.verdict,
    ["proceed", "caution", "block", "unknown"],
    "AgentLoopKit sourceAssessment",
    "verdict"
  );
  const scope = expectObject(object.scope, "AgentLoopKit scope");
  expectStringArray(scope.allowedPaths, "AgentLoopKit scope", "allowedPaths");
  expectStringArray(scope.excludedPaths, "AgentLoopKit scope", "excludedPaths");
  expectArray(scope.reviewFirst, "AgentLoopKit scope", "reviewFirst");
  expectArray(object.acceptanceCriteria, "AgentLoopKit task contract", "acceptanceCriteria");
  expectArray(object.verificationGates, "AgentLoopKit task contract", "verificationGates");
  expectArray(object.risks, "AgentLoopKit task contract", "risks");
  expectEnum(
    object.status,
    ["draft", "active", "blocked", "complete"],
    "AgentLoopKit task contract",
    "status"
  );
  validatePathList([sourceAssessment.path as string], "AgentLoopKit sourceAssessment.path");
  validatePathList(scope.allowedPaths as string[], "AgentLoopKit scope.allowedPaths");
  validatePathList(scope.excludedPaths as string[], "AgentLoopKit scope.excludedPaths");
  return value as AgentLoopKitTaskContractV1;
}

function buildTaskFallbackFromContext(
  context: BaseframeIntegrationContext
): AgentLoopKitTaskContractV1 {
  return {
    schemaVersion: "1.0",
    kind: "agentloopkit-task",
    producer: { name: "agentloopkit", version: "unknown" },
    taskId: context.taskId,
    intent: "",
    title: context.taskId,
    createdAt: "",
    sourceAssessment: {
      path: context.projscanAssessmentPath ?? "",
      producerVersion: "unknown",
      verdict: "unknown"
    },
    scope: {
      allowedPaths: context.expectedScope.allowedPaths,
      reviewFirst: context.importedReviewFocus
        .filter((item) => item.source === "agentloopkit")
        .map((item) => ({ path: item.path, reasons: item.reasons })),
      excludedPaths: context.expectedScope.excludedPaths
    },
    acceptanceCriteria: [],
    verificationGates: context.requiredVerification.map((gate) => ({
      ...gate,
      status: "pending" as const
    })),
    risks: [],
    status: "active"
  };
}

function buildResultSource(context: BaseframeIntegrationContext): AgentFlightResultV1["source"] {
  return {
    ...(context.projscanAssessmentPath
      ? { projscanAssessmentPath: context.projscanAssessmentPath }
      : {}),
    ...(context.agentloopkitTaskPath ? { agentloopkitTaskPath: context.agentloopkitTaskPath } : {})
  };
}

function buildResultVerification(
  runs: VerificationRun[],
  incomplete: IncompleteVerificationAttempt[]
): AgentFlightResultV1["verification"] {
  return [
    ...runs.map((run) => ({
      command: run.command,
      status: run.status,
      ...(typeof run.exitCode === "number" ? { exitCode: run.exitCode } : {})
    })),
    ...incomplete.map((attempt) => ({
      command: attempt.command,
      status: "incomplete" as const
    }))
  ];
}

function buildBaseframeProofGaps(input: {
  assessment?: ProjScanAssessmentV1 | undefined;
  task: AgentLoopKitTaskContractV1;
  scopeDrift: ScopeDriftFinding[];
  gates: GateEvidenceStatus[];
  session: AgentFlightSession;
  incompleteVerification: IncompleteVerificationAttempt[];
}): AgentFlightResultV1["proofGaps"] {
  const gaps: AgentFlightResultV1["proofGaps"] = [];
  const assessment = input.assessment;
  if (assessment?.verdict === "block") {
    gaps.push({
      severity: "blocking",
      message: `ProjScan blocked this task: ${assessment.summary}`
    });
  } else if (assessment?.verdict === "caution") {
    gaps.push({
      severity: "warning",
      message: `ProjScan caution: ${assessment.summary}`
    });
  }
  for (const risk of assessment?.risks ?? []) {
    if (risk.severity === "blocking") {
      gaps.push({
        severity: "blocking",
        message: `ProjScan blocking finding ${risk.id}: ${risk.message}`,
        ...(risk.suggestedAction ? { suggestedCommand: risk.suggestedAction } : {}),
        ...(risk.files ? { relatedFiles: risk.files } : {})
      });
    }
  }

  for (const risk of input.task.risks) {
    if (risk.severity === "blocking") {
      gaps.push({
        severity: "blocking",
        message: `AgentLoopKit blocking risk ${risk.id}: ${risk.message}`,
        ...(risk.files ? { relatedFiles: risk.files } : {})
      });
    }
  }

  for (const criterion of input.task.acceptanceCriteria) {
    if (criterion.status === "pending" || criterion.status === "unknown") {
      gaps.push({
        severity: "warning",
        message: `Acceptance criterion "${criterion.text}" is still ${criterion.status}.`
      });
    }
    if (criterion.status === "failed") {
      gaps.push({
        severity: "blocking",
        message: `Acceptance criterion failed: ${criterion.text}`
      });
    }
  }

  for (const drift of input.scopeDrift) {
    gaps.push({
      severity: drift.severity,
      message:
        drift.reason === "inside-excluded-scope"
          ? `Excluded path changed: ${drift.path}`
          : drift.reason === "outside-allowed-scope"
            ? `File changed outside declared scope: ${drift.path}`
            : `Changed file was not classified by task scope: ${drift.path}`,
      relatedFiles: [drift.path]
    });
  }

  for (const gate of input.gates) {
    if (gate.status === "failed") {
      gaps.push({
        severity: "blocking",
        message: `Required verification gate failed: ${gate.command}`,
        suggestedCommand: gate.command
      });
    }
    if (gate.status === "incomplete") {
      gaps.push({
        severity: "blocking",
        message: `Required verification gate is incomplete: ${gate.command}`,
        suggestedCommand: gate.command
      });
    }
    if (gate.status === "missing") {
      gaps.push({
        severity: "blocking",
        message: `Required verification gate is missing: ${gate.command}`,
        suggestedCommand: gate.command
      });
    }
  }

  for (const run of getUnresolvedFailedRuns(getVerificationRuns(input.session))) {
    gaps.push({
      severity: "blocking",
      message: `AgentFlight verification failed: ${run.command}`,
      suggestedCommand: run.command
    });
  }

  for (const attempt of input.incompleteVerification) {
    gaps.push({
      severity: "blocking",
      message: `AgentFlight verification is incomplete: ${attempt.command}`,
      suggestedCommand: attempt.command
    });
  }

  return dedupeProofGaps(gaps);
}

function determineBaseframeReadiness(input: {
  assessment?: ProjScanAssessmentV1 | undefined;
  task: AgentLoopKitTaskContractV1;
  scopeDrift: ScopeDriftFinding[];
  gates: GateEvidenceStatus[];
  proofGaps: AgentFlightResultV1["proofGaps"];
  session: AgentFlightSession;
  incompleteVerification: IncompleteVerificationAttempt[];
}): AgentFlightResultV1["readiness"] {
  if (input.gates.some((gate) => gate.status === "failed")) return "blocked_by_failed_verification";
  if (getUnresolvedFailedRuns(getVerificationRuns(input.session)).length > 0) {
    return "blocked_by_failed_verification";
  }
  if (
    input.gates.some((gate) => gate.status === "incomplete") ||
    input.incompleteVerification.length > 0
  ) {
    return "blocked_by_failed_verification";
  }
  if (input.gates.some((gate) => gate.status === "missing")) return "needs_verification";
  if (
    input.assessment?.verdict === "block" ||
    input.assessment?.risks.some((risk) => risk.severity === "blocking") ||
    input.task.risks.some((risk) => risk.severity === "blocking") ||
    input.scopeDrift.some((finding) => finding.severity === "blocking") ||
    input.task.acceptanceCriteria.some((criterion) => criterion.status === "failed")
  ) {
    return "not_ready_for_review";
  }
  if (input.task.acceptanceCriteria.some((criterion) => criterion.status === "pending")) {
    return "not_ready_for_review";
  }
  if (input.scopeDrift.some((finding) => finding.reason === "outside-allowed-scope")) {
    return "not_ready_for_review";
  }
  if (input.proofGaps.some((gap) => gap.severity === "blocking")) return "not_ready_for_review";
  return "ready_for_review";
}

function buildUnifiedReviewFocus(input: {
  changedFiles: string[];
  imported: BaseframeIntegrationContext["importedReviewFocus"];
}): AgentFlightResultV1["reviewFocus"] {
  const indexed = new Map<string, AgentFlightResultV1["reviewFocus"][number]>();
  for (const item of input.imported) {
    mergeReviewFocus(indexed, {
      path: item.path,
      priority: item.priority,
      reasons: item.reasons,
      sources: [item.source]
    });
  }
  for (const file of input.changedFiles) {
    mergeReviewFocus(indexed, {
      path: file,
      priority: priorityForChangedFile(file),
      reasons: [`changed ${categorizeFile(file)} file`],
      sources: ["agentflight"]
    });
  }
  return [...indexed.values()].sort(compareReviewFocus);
}

function mergeReviewFocus(
  indexed: Map<string, AgentFlightResultV1["reviewFocus"][number]>,
  item: AgentFlightResultV1["reviewFocus"][number]
): void {
  const key = normalizeChangedPath(item.path);
  const current = indexed.get(key);
  if (!current) {
    indexed.set(key, {
      path: key,
      priority: item.priority,
      reasons: uniqueSorted(item.reasons),
      sources: uniqueSourceList(item.sources)
    });
    return;
  }
  indexed.set(key, {
    path: current.path,
    priority: highestPriority(current.priority, item.priority),
    reasons: uniqueSorted([...current.reasons, ...item.reasons]),
    sources: uniqueSourceList([...current.sources, ...item.sources])
  });
}

function compareReviewFocus(
  left: AgentFlightResultV1["reviewFocus"][number],
  right: AgentFlightResultV1["reviewFocus"][number]
): number {
  return (
    priorityScore(right.priority) - priorityScore(left.priority) ||
    left.path.localeCompare(right.path)
  );
}

function priorityForChangedFile(file: string): "high" | "medium" | "low" {
  const category = categorizeFile(file);
  if (
    category === "auth" ||
    category === "security/secrets" ||
    category === "billing/payments" ||
    category === "database/migrations" ||
    category === "config"
  ) {
    return "high";
  }
  if (category === "docs" || category === "tests") return "low";
  return "medium";
}

function highestPriority(
  left: "high" | "medium" | "low",
  right: "high" | "medium" | "low"
): "high" | "medium" | "low" {
  return priorityScore(left) >= priorityScore(right) ? left : right;
}

function priorityScore(priority: "high" | "medium" | "low"): number {
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  return 1;
}

function uniqueSourceList(
  sources: Array<"projscan" | "agentloopkit" | "agentflight">
): Array<"projscan" | "agentloopkit" | "agentflight"> {
  const order: Array<"projscan" | "agentloopkit" | "agentflight"> = [
    "projscan",
    "agentloopkit",
    "agentflight"
  ];
  const set = new Set(sources);
  return order.filter((source) => set.has(source));
}

function summarizeBaseframeResult(input: {
  assessment?: ProjScanAssessmentV1 | undefined;
  task: AgentLoopKitTaskContractV1;
  changedFiles: string[];
  scopeDrift: ScopeDriftFinding[];
  gates: GateEvidenceStatus[];
  readiness: AgentFlightResultV1["readiness"];
}): string {
  const requiredGates = input.task.verificationGates.filter((gate) => gate.required).length;
  const pendingAcceptance = input.task.acceptanceCriteria.filter(
    (criterion) => criterion.status === "pending"
  ).length;
  const missingGates = input.gates.filter((gate) => gate.status === "missing").length;
  const failedGates = input.gates.filter((gate) => gate.status === "failed").length;
  return [
    `Readiness: ${input.readiness}.`,
    input.assessment ? `Repository assessment: ${input.assessment.verdict}.` : "",
    `Task contract: ${requiredGates} required verification gates.`,
    pendingAcceptance > 0 ? `${pendingAcceptance} acceptance criterion still pending.` : "",
    `Execution: ${input.changedFiles.length} files changed.`,
    input.scopeDrift.length > 0 ? `${input.scopeDrift.length} scope drift finding(s).` : "",
    missingGates > 0 ? `${missingGates} required gate(s) missing.` : "",
    failedGates > 0 ? `${failedGates} required gate(s) failed.` : ""
  ]
    .filter(Boolean)
    .join(" ");
}

function uniqueArtifacts(
  artifacts: AgentFlightResultV1["artifacts"]
): AgentFlightResultV1["artifacts"] {
  const seen = new Set<string>();
  return artifacts
    .map((artifact) => ({ ...artifact, path: normalizeRepoRelativePath(artifact.path) }))
    .filter((artifact) => {
      const key = `${artifact.kind}:${artifact.path}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

interface IncompleteVerificationAttempt {
  command: string;
  startedAt: string;
}

function detectIncompleteVerificationAttempts(
  session: AgentFlightSession
): IncompleteVerificationAttempt[] {
  return detectIncompleteCommands(getSessionEvents(session), getVerificationRuns(session)).map(
    (command) => ({
      command,
      startedAt:
        getSessionEvents(session).find(
          (event) => event.type === "verification_started" && readEventCommand(event) === command
        )?.timestamp ?? ""
    })
  );
}

function detectIncompleteCommands(events: SessionEvent[], runs: VerificationRun[]): string[] {
  const completed = new Map<string, string>();
  for (const event of events) {
    if (event.type !== "verification_passed" && event.type !== "verification_failed") continue;
    const command = normalizeCommandString(readEventCommand(event) ?? "");
    if (!command) continue;
    recordLatestCompletion(completed, command, event.timestamp);
  }
  for (const run of runs) {
    recordLatestCompletion(completed, normalizeCommandString(run.command), run.finishedAt);
  }

  return events
    .filter((event) => event.type === "verification_started")
    .map((event) => ({
      command: readEventCommand(event) ?? "unknown verification command",
      startedAt: event.timestamp
    }))
    .filter((attempt) => {
      const completedAt = completed.get(normalizeCommandString(attempt.command));
      return !completedAt || !timestampAtOrAfter(completedAt, attempt.startedAt);
    })
    .map((attempt) => attempt.command);
}

function recordLatestCompletion(
  index: Map<string, string>,
  command: string,
  timestamp: string
): void {
  const previous = index.get(command);
  if (!previous || timestampAtOrAfter(timestamp, previous)) index.set(command, timestamp);
}

function timestampAtOrAfter(candidate: string, reference: string): boolean {
  const candidateTime = Date.parse(candidate);
  const referenceTime = Date.parse(reference);
  if (Number.isNaN(candidateTime) || Number.isNaN(referenceTime)) return candidate >= reference;
  return candidateTime >= referenceTime;
}

function readEventCommand(event: SessionEvent): string | null {
  const command = event.metadata?.command;
  return typeof command === "string" && command.trim().length > 0 ? command : null;
}

function commandsMatch(expected: string, actual: string): boolean {
  return expected === actual || normalizeCommandString(expected) === normalizeCommandString(actual);
}

function normalizePatternList(patterns: string[]): string[] {
  return uniqueSorted(
    patterns.map(normalizePattern).filter((pattern): pattern is string => Boolean(pattern))
  );
}

function normalizePattern(pattern: string): string | null {
  const normalized = normalizeChangedPath(pattern.trim());
  if (!normalized || normalized === ".." || normalized.startsWith("../")) return null;
  if (isAbsolute(normalized)) return null;
  return normalized;
}

function matchesAnyPattern(file: string, patterns: string[]): boolean {
  return patterns.some((pattern) => matchesPattern(file, pattern));
}

function matchesPattern(fileInput: string, pattern: string): boolean {
  const file = normalizeChangedPath(fileInput);
  if (pattern.endsWith("/**")) {
    const prefix = pattern.slice(0, -3);
    return file === prefix || file.startsWith(`${prefix}/`);
  }
  if (pattern.endsWith("/")) return file.startsWith(pattern);
  if (!pattern.includes("*")) return file === pattern || file.startsWith(`${pattern}/`);
  return globToRegExp(pattern).test(file);
}

function globToRegExp(pattern: string): RegExp {
  let source = "^";
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index]!;
    if (char === "*") {
      if (pattern[index + 1] === "*") {
        source += ".*";
        index += 1;
      } else {
        source += "[^/]*";
      }
      continue;
    }
    source += escapeRegExp(char);
  }
  return new RegExp(`${source}$`);
}

function escapeRegExp(value: string): string {
  return value.replace(/[\\^$+?.()|[\]{}]/g, "\\$&");
}

function resolveSafeLocalPath(
  repoRoot: string,
  inputPath: string
): { absolute: string; relative: string } {
  const normalizedInput = normalizeRepoRelativePath(inputPath);
  const absolute = isAbsolute(inputPath) ? resolve(inputPath) : resolve(repoRoot, normalizedInput);
  const repo = resolve(repoRoot);
  const relativePath = relative(repo, absolute);
  if (relativePath === "" || (!relativePath.startsWith("..") && !isAbsolute(relativePath))) {
    return { absolute, relative: relativePath.split(sep).join("/") };
  }
  throw new Error(`Unsafe Baseframe path: ${inputPath}`);
}

function normalizeRepoRelativePath(path: string): string {
  if (path.includes("\0")) throw new Error(`Unsafe Baseframe path: ${path}`);
  const normalized = path.replaceAll("\\", "/").replace(/^\.\//, "").trim();
  if (!normalized || normalized === ".." || normalized.startsWith("../")) {
    throw new Error(`Unsafe Baseframe path: ${path}`);
  }
  if (isAbsolute(normalized)) throw new Error(`Unsafe Baseframe path: ${path}`);
  return normalized;
}

function normalizeChangedPath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^\.\//, "");
}

function validatePathList(paths: string[], label: string): void {
  for (const path of paths) {
    if (typeof path !== "string") throw new Error(`Invalid ${label}: expected path strings.`);
    normalizePattern(path);
  }
}

function validateArtifactPaths(value: unknown, label: string): void {
  if (value === undefined) return;
  const artifacts = expectArray(value, "ProjScan assessment", "artifacts");
  for (const artifact of artifacts) {
    const item = expectObject(artifact, label);
    expectString(item.path, label, "path");
    normalizeRepoRelativePath(item.path as string);
  }
}

function expectProducer(value: unknown, name: string, label: string): void {
  const producer = expectObject(value, `${label} producer`);
  expectLiteral(producer.name, name, label, "producer.name");
  expectString(producer.version, label, "producer.version");
}

function expectObject(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Invalid ${label}: expected object.`);
  }
  return value as Record<string, unknown>;
}

function expectArray(value: unknown, label: string, field: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`Invalid ${label}: expected ${field} array.`);
  return value;
}

function expectStringArray(value: unknown, label: string, field: string): void {
  const array = expectArray(value, label, field);
  for (const item of array) {
    if (typeof item !== "string") {
      throw new Error(`Invalid ${label}: expected ${field} to contain strings.`);
    }
  }
}

function expectString(value: unknown, label: string, field: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid ${label}: expected ${field} string.`);
  }
}

function expectLiteral(value: unknown, expected: string, label: string, field: string): void {
  if (value !== expected) {
    throw new Error(`Invalid ${label}: expected ${field} "${expected}".`);
  }
}

function expectEnum(
  value: unknown,
  allowed: readonly string[],
  label: string,
  field: string
): void {
  if (typeof value !== "string" || !allowed.includes(value)) {
    throw new Error(`Invalid ${label}: expected ${field} to be one of ${allowed.join(", ")}.`);
  }
}

function assertSafeTaskId(taskId: string): void {
  if (!/^[A-Za-z0-9._-]+$/.test(taskId) || taskId === "." || taskId === "..") {
    throw new Error(`Unsafe Baseframe task ID: ${taskId}`);
  }
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.map(normalizeChangedPath).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right)
  );
}

function dedupeProofGaps(gaps: AgentFlightResultV1["proofGaps"]): AgentFlightResultV1["proofGaps"] {
  const seen = new Set<string>();
  return gaps.filter((gap) => {
    const key = [
      gap.severity,
      gap.message,
      gap.suggestedCommand ?? "",
      gap.relatedFiles?.join("|") ?? ""
    ].join("::");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

export function formatBaseframeResultForDisplay(result: AgentFlightResultV1): string {
  const assessment = result.proofGaps.find((gap) => gap.message.startsWith("ProjScan"));
  const gates = result.gates.map((gate) => `${gate.status.toUpperCase()} ${gate.command}`);
  const nextGate = result.gates.find(
    (gate) => gate.status === "missing" || gate.status === "failed" || gate.status === "incomplete"
  );
  const drift = result.scopeDrift.length
    ? result.scopeDrift.map((finding) => `- ${finding.path}: ${finding.reason}`).join("\n")
    : "- No scope drift detected.";
  return `Repository Assessment
${assessment ? assessment.message : "No blocking repository assessment finding."}

Task Contract
${result.gates.length} verification gates imported.

Scope Adherence
${drift}

Verification Gates
${gates.length ? gates.map((line) => `- ${line}`).join("\n") : "- No gates imported."}

Review Focus
${result.reviewFocus.length ? result.reviewFocus.map((item) => `- ${item.path}: ${item.reasons.join("; ")}`).join("\n") : "- No review focus imported."}

Proof Gaps
${result.proofGaps.length ? result.proofGaps.map((gap) => `- ${gap.severity}: ${gap.message}`).join("\n") : "- No proof gaps."}

Readiness
${result.readiness}

Next Action
${nextGate ? `Run or fix ${nextGate.command}.` : "Hand off for review."}`;
}

export function formatBaseframeResultForMarkdown(result: AgentFlightResultV1): string {
  const text = formatBaseframeResultForDisplay(result);
  return text
    .split("\n\n")
    .map((section) => {
      const [heading, ...body] = section.split("\n");
      return `## ${heading}\n${body.join("\n")}`;
    })
    .join("\n\n");
}
