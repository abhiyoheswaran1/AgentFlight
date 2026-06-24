import { readdir, readFile } from "node:fs/promises";
import { categorizeFile } from "./risk.js";
import { resolveAgentFlightPaths } from "./paths.js";
import {
  getLatestRecordedReviewSummary,
  getLatestReviewReceipt,
  getVerificationRuns
} from "./session.js";
import type {
  AgentFlightSession,
  ProofCalibration,
  ProofCalibrationSuggestion,
  RiskCategory,
  VerificationProofKind,
  VerificationRun
} from "../types/index.js";

export interface LoadProofCalibrationHistoryOptions {
  currentSessionId?: string | undefined;
  limit?: number | undefined;
}

export interface ProofCalibrationSkippedSession {
  path: string;
  reason: string;
}

export interface ProofCalibrationHistoryResult {
  sessions: AgentFlightSession[];
  skipped: ProofCalibrationSkippedSession[];
}

export interface BuildProofCalibrationOptions {
  currentSessionId: string;
  changedFiles: string[];
  verificationRuns: VerificationRun[];
  verificationCommands?: string[] | undefined;
  historicalSessions?: AgentFlightSession[] | undefined;
}

const DEFAULT_HISTORY_LIMIT = 50;
const MIN_SIMILAR_READY_SESSIONS = 2;
const MAX_SUGGESTIONS = 3;
const EMPTY_PROOF_LABEL = "No passing proof recorded.";
const calibratableCategories = new Set<RiskCategory>([
  "auth",
  "billing/payments",
  "security/secrets",
  "database/migrations",
  "backend/api",
  "dependencies",
  "config",
  "frontend",
  "source",
  "tests"
]);

export async function loadProofCalibrationHistory(
  repoRoot: string,
  options: LoadProofCalibrationHistoryOptions = {}
): Promise<ProofCalibrationHistoryResult> {
  const limit = normalizeHistoryLimit(options.limit);
  const sessionFiles = (await listSessionFiles(resolveAgentFlightPaths(repoRoot).sessions)).sort(
    (left, right) => right.localeCompare(left)
  );
  const sessions: AgentFlightSession[] = [];
  const skipped: ProofCalibrationSkippedSession[] = [];

  for (const path of sessionFiles) {
    if (sessions.length >= limit) break;
    await collectProofCalibrationHistoryFile(path, sessions, skipped, options.currentSessionId);
  }

  return { sessions: sessions.sort(compareHistoricalSessions), skipped };
}

async function collectProofCalibrationHistoryFile(
  path: string,
  sessions: AgentFlightSession[],
  skipped: ProofCalibrationSkippedSession[],
  currentSessionId: string | undefined
): Promise<void> {
  const loaded = await loadSessionFile(path);
  if (loaded.skipped) {
    skipped.push(loaded.skipped);
    return;
  }
  if (loaded.session.id === currentSessionId) return;
  if (!isReadyHistoricalSession(loaded.session)) return;
  sessions.push(loaded.session);
}

export function buildProofCalibration(options: BuildProofCalibrationOptions): ProofCalibration {
  const historicalSessions = options.historicalSessions ?? [];
  const currentCategories = categoriesForFiles(options.changedFiles);
  const currentCommands = passedProofCommands(options.verificationRuns);
  const configuredCommands = normalizedConfiguredCommands(options.verificationCommands ?? []);
  const similarSessions = historicalSessions
    .filter((session) => session.id !== options.currentSessionId)
    .filter(isReadyHistoricalSession)
    .map((session) => buildHistoricalSessionPattern(session, currentCategories))
    .filter((pattern): pattern is HistoricalSessionPattern => Boolean(pattern));
  const acceptedSimilarSessions = similarSessions.filter((session) => session.acceptedReceipt);
  const calibrationSessions =
    acceptedSimilarSessions.length >= MIN_SIMILAR_READY_SESSIONS
      ? acceptedSimilarSessions
      : similarSessions;

  if (currentCategories.length === 0 || calibrationSessions.length < MIN_SIMILAR_READY_SESSIONS) {
    return calibrationResult({
      state: "no_history",
      scannedSessions: historicalSessions.length,
      similarReadySessions: calibrationSessions.length,
      suggestions: []
    });
  }

  const suggestions = buildCalibrationSuggestions({
    currentCategories,
    currentCommands,
    configuredCommands,
    similarSessions: calibrationSessions
  });

  return calibrationResult({
    state: suggestions.length > 0 ? "under_proven" : "aligned",
    scannedSessions: historicalSessions.length,
    similarReadySessions: calibrationSessions.length,
    suggestions
  });
}

type LoadedSessionFile =
  | { session: AgentFlightSession; skipped?: undefined }
  | { session?: undefined; skipped: ProofCalibrationSkippedSession };

interface HistoricalSessionPattern {
  id: string;
  categories: RiskCategory[];
  commands: string[];
  acceptedReceipt: boolean;
}

interface HistoricalCalibrationBoundary {
  acceptedReceipt: boolean;
  cutoffAt?: string | undefined;
  changedFiles?: string[] | undefined;
}

interface CalibrationResultInput {
  state: ProofCalibration["state"];
  scannedSessions: number;
  similarReadySessions: number;
  suggestions: ProofCalibrationSuggestion[];
}

interface BuildCalibrationSuggestionsInput {
  currentCategories: RiskCategory[];
  currentCommands: string[];
  configuredCommands: Set<string>;
  similarSessions: HistoricalSessionPattern[];
}

async function listSessionFiles(sessionsPath: string): Promise<string[]> {
  try {
    const entries = await readdir(sessionsPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => `${sessionsPath}/${entry.name}`);
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") return [];
    throw error;
  }
}

async function loadSessionFile(path: string): Promise<LoadedSessionFile> {
  try {
    return { session: JSON.parse(await readFile(path, "utf8")) as AgentFlightSession };
  } catch (error) {
    return {
      skipped: {
        path,
        reason: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

function isReadyHistoricalSession(session: AgentFlightSession): boolean {
  const latestReview = getLatestRecordedReviewSummary(session);
  const boundary = historicalCalibrationBoundary(session, latestReview);
  return (
    latestReview?.state === "ready_for_review" &&
    passedProofCommands(getVerificationRuns(session), boundary.cutoffAt).length > 0
  );
}

function compareHistoricalSessions(left: AgentFlightSession, right: AgentFlightSession): number {
  const timeDelta = Date.parse(right.startedAt) - Date.parse(left.startedAt);
  return timeDelta !== 0 ? timeDelta : right.id.localeCompare(left.id);
}

function buildHistoricalSessionPattern(
  session: AgentFlightSession,
  currentCategories: RiskCategory[]
): HistoricalSessionPattern | null {
  const boundary = historicalCalibrationBoundary(session);
  const categories = categoriesForFiles(historicalChangedFiles(session, boundary)).filter(
    (category) => currentCategories.includes(category)
  );
  const commands = passedProofCommands(getVerificationRuns(session), boundary.cutoffAt);
  if (categories.length === 0 || commands.length === 0) return null;
  return {
    id: session.id,
    categories,
    commands,
    acceptedReceipt: boundary.acceptedReceipt
  };
}

function historicalCalibrationBoundary(
  session: AgentFlightSession,
  latestReview = getLatestRecordedReviewSummary(session)
): HistoricalCalibrationBoundary {
  const receipt = getLatestReviewReceipt(session);
  if (receipt?.decision === "accepted") {
    return {
      acceptedReceipt: true,
      cutoffAt: receipt.recordedAt,
      changedFiles: receipt.snapshot.changedFiles
    };
  }
  return {
    acceptedReceipt: false,
    cutoffAt: latestReview?.generatedAt
  };
}

function buildCalibrationSuggestions(
  input: BuildCalibrationSuggestionsInput
): ProofCalibrationSuggestion[] {
  const currentCommandKeys = new Set(input.currentCommands.map(normalizeCommand));
  const suggestions: ProofCalibrationSuggestion[] = [];

  for (const category of input.currentCategories) {
    const categorySessions = input.similarSessions.filter((session) =>
      session.categories.includes(category)
    );
    if (categorySessions.length < MIN_SIMILAR_READY_SESSIONS) continue;

    const commandCounts = countCommands(categorySessions);
    const historicalProof = sortedCommandsByFrequency(commandCounts);
    const missingCommand = historicalProof.find((command) => {
      const count = commandCounts.get(command)?.count ?? 0;
      const normalizedCommand = normalizeCommand(command);
      return (
        count >= MIN_SIMILAR_READY_SESSIONS &&
        !currentCommandKeys.has(normalizedCommand) &&
        input.configuredCommands.has(normalizedCommand)
      );
    });
    if (!missingCommand) continue;

    suggestions.push({
      id: `repo-calibration-${stableId(category)}-${stableId(missingCommand)}`,
      status: "under_proven",
      category,
      message: `Similar local ready handoffs for ${category} changes usually included ${missingCommand}.`,
      currentProof: input.currentCommands.length > 0 ? input.currentCommands : [EMPTY_PROOF_LABEL],
      historicalProof,
      suggestedCommand: missingCommand,
      similarReadySessions: categorySessions.length,
      matchedSessionIds: categorySessions.map((session) => session.id)
    });
  }

  return suggestions.slice(0, MAX_SUGGESTIONS);
}

function countCommands(
  sessions: HistoricalSessionPattern[]
): Map<string, { count: number; proofKind: VerificationProofKind }> {
  const counts = new Map<string, { count: number; proofKind: VerificationProofKind }>();
  for (const session of sessions) {
    for (const command of uniqueStrings(session.commands)) {
      const current = counts.get(command);
      counts.set(command, {
        count: (current?.count ?? 0) + 1,
        proofKind: classifyProofKind(command)
      });
    }
  }
  return counts;
}

function sortedCommandsByFrequency(
  counts: Map<string, { count: number; proofKind: VerificationProofKind }>
): string[] {
  return [...counts.entries()]
    .sort(
      ([leftCommand, left], [rightCommand, right]) =>
        right.count - left.count ||
        proofKindPriority(left.proofKind) - proofKindPriority(right.proofKind) ||
        leftCommand.localeCompare(rightCommand)
    )
    .map(([command]) => command)
    .slice(0, 5);
}

function historicalChangedFiles(
  session: AgentFlightSession,
  boundary: HistoricalCalibrationBoundary
): string[] {
  if (boundary.changedFiles && boundary.changedFiles.length > 0) return boundary.changedFiles;

  const runs = getVerificationRuns(session).filter((run) =>
    isRunAtOrBeforeBoundary(run, boundary.cutoffAt)
  );
  for (let index = runs.length - 1; index >= 0; index -= 1) {
    const changedFiles = runs[index]?.proofSnapshot?.changedFiles;
    if (changedFiles && changedFiles.length > 0) return changedFiles;
  }
  return session.git.changedFiles ?? [];
}

function passedProofCommands(runs: VerificationRun[], cutoffAt?: string | undefined): string[] {
  return uniqueStrings(
    runs
      .filter((run) => run.status === "passed" && isRunAtOrBeforeBoundary(run, cutoffAt))
      .map((run) => run.command.trim().replace(/\s+/g, " "))
      .filter((command) => command.length > 0 && !isAgentFlightReadoutCommand(command))
  );
}

function isRunAtOrBeforeBoundary(run: VerificationRun, cutoffAt: string | undefined): boolean {
  if (!cutoffAt) return true;
  const cutoffTime = Date.parse(cutoffAt);
  if (!Number.isFinite(cutoffTime)) return true;
  const runTime = Date.parse(run.finishedAt ?? run.startedAt);
  return !Number.isFinite(runTime) || runTime <= cutoffTime;
}

function categoriesForFiles(files: string[]): RiskCategory[] {
  return uniqueStrings(files.map(categorizeFile).filter(isCalibratableCategory));
}

function isCalibratableCategory(category: RiskCategory): boolean {
  return calibratableCategories.has(category);
}

function normalizedConfiguredCommands(commands: string[]): Set<string> {
  return new Set(
    commands
      .map((command) => command.trim().replace(/\s+/g, " "))
      .filter((command) => command.length > 0 && !isAgentFlightReadoutCommand(command))
      .map(normalizeCommand)
  );
}

function calibrationResult(input: CalibrationResultInput): ProofCalibration {
  return {
    source: "local_session_history",
    state: input.state,
    summary: calibrationSummary(input),
    scannedSessions: input.scannedSessions,
    similarReadySessions: input.similarReadySessions,
    suggestions: input.suggestions
  };
}

function calibrationSummary(input: CalibrationResultInput): string {
  if (input.state === "under_proven") {
    return `Similar local ready handoffs suggest ${input.suggestions.length} additional proof command${input.suggestions.length === 1 ? "" : "s"} for this change.`;
  }
  if (input.state === "aligned") {
    return `Current proof matches frequent proof commands from ${input.similarReadySessions} similar ready local handoffs.`;
  }
  return "Not enough similar ready local handoffs yet.";
}

function classifyProofKind(command: string): VerificationProofKind {
  const normalized = command.toLowerCase();

  if (/\b(npm|pnpm|yarn|bun)\s+(ci|install)\b/.test(normalized)) return "install";
  if (/\b(vitest|jest|mocha|playwright|cypress|test|verify|e2e)\b/.test(normalized)) {
    return "test";
  }
  if (/\bbuild\b/.test(normalized)) return "build";
  if (/\b(typecheck|tsc)\b/.test(normalized)) return "typecheck";
  if (/\b(lint|eslint)\b/.test(normalized)) return "lint";

  return "unknown";
}

function proofKindPriority(kind: VerificationProofKind): number {
  const priorities: Record<VerificationProofKind, number> = {
    test: 0,
    typecheck: 1,
    build: 2,
    lint: 3,
    install: 4,
    unknown: 5
  };
  return priorities[kind];
}

function normalizeCommand(command: string): string {
  return command.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeHistoryLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) return DEFAULT_HISTORY_LIMIT;
  return Math.max(0, Math.floor(limit));
}

function uniqueStrings<T extends string>(values: T[]): T[] {
  return [...new Set(values)];
}

function stableId(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("\\", "/")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isAgentFlightReadoutCommand(command: string): boolean {
  return /(?:^|\s)(?:agentflight(?:@[^\s]+)?|node\s+(?:\.\/)?dist\/cli\.js)\s+(?:status|report|replay|resume|handoff|history|doctor)\b/.test(
    normalizeCommand(command).replaceAll("\\", "/")
  );
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error;
}
