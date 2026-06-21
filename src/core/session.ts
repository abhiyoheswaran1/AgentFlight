import { readdir, readFile } from "node:fs/promises";
import { basename } from "node:path";
import { writeJsonFileSafe, writeTextFileSafe } from "./fs-safe.js";
import { resolveAgentFlightPaths } from "./paths.js";
import type {
  AgentFlightSession,
  GitInfo,
  ReviewReadinessDecision,
  ReviewReadinessState,
  RiskLevel,
  SessionEvent,
  SessionEventType,
  ToolAdapterResult,
  VerificationRun
} from "../types/index.js";

export interface BuildSessionRecordOptions {
  repoRoot: string;
  task: string;
  now?: Date | undefined;
  git: GitInfo;
  packageManager: string | null;
  repoSummary?: string | undefined;
  verificationCommands?: string[] | undefined;
  tools?:
    | {
        projscan: ToolAdapterResult;
        agentloopkit: ToolAdapterResult;
      }
    | undefined;
}

export type StartSessionOptions = BuildSessionRecordOptions;

export interface StartSessionResult {
  session: AgentFlightSession;
  sessionPath: string;
  currentSessionPath: string;
  handoffPath: string;
}

export interface SessionSummary {
  id: string;
  taskTitle: string;
  startedAt: string;
  branch: string | null;
  commit: string | null;
  dirty: boolean;
  verificationPassed: number;
  verificationFailed: number;
  latestReview?: SessionReviewSummary;
  sessionPath: string;
}

export interface SessionReviewSummary {
  state: ReviewReadinessState;
  label: string;
  riskLevel: RiskLevel;
  changedFiles: number;
  verificationPassed: number;
  verificationFailed: number;
  artifactPath: string | null;
  generatedAt: string;
}

export interface BuildArtifactReviewMetadataOptions {
  path: string;
  readiness: Pick<ReviewReadinessDecision, "state" | "label">;
  riskLevel: RiskLevel;
  changedFiles: number;
  verificationPassed: number;
  verificationFailed: number;
}

export interface SkippedSessionFile {
  path: string;
  reason: string;
}

export interface ListSessionSummariesOptions {
  limit?: number | undefined;
}

export interface ListSessionSummariesResult {
  sessions: SessionSummary[];
  skipped: SkippedSessionFile[];
}

export interface SessionEventInput {
  type: SessionEventType;
  timestamp?: Date | string | undefined;
  title: string;
  message?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

const unavailableTool: ToolAdapterResult = {
  available: false,
  warnings: ["Not inspected for this session."]
};

export function buildSessionRecord(options: BuildSessionRecordOptions): AgentFlightSession {
  const now = options.now ?? new Date();
  const session: AgentFlightSession = {
    id: createSessionId(now, options.task),
    task: {
      title: options.task
    },
    startedAt: now.toISOString(),
    repoRoot: options.repoRoot,
    git: options.git,
    packageManager: options.packageManager,
    verificationCommands: options.verificationCommands ?? [],
    verificationRuns: [],
    events: [
      buildSessionEvent(
        {
          type: "session_started",
          timestamp: now,
          title: "Session started",
          metadata: {
            git: options.git,
            packageManager: options.packageManager
          }
        },
        1
      )
    ],
    tools: options.tools ?? {
      projscan: unavailableTool,
      agentloopkit: unavailableTool
    }
  };

  if (options.repoSummary !== undefined) {
    session.repoSummary = options.repoSummary;
  }

  return session;
}

export async function startSession(options: StartSessionOptions): Promise<StartSessionResult> {
  const session = buildSessionRecord(options);
  const paths = resolveAgentFlightPaths(options.repoRoot);
  const sessionPath = `${paths.sessions}/${session.id}.json`;

  await writeJsonFileSafe(sessionPath, session);
  await writeJsonFileSafe(paths.currentSession, session, { overwrite: true });
  await writeTextFileSafe(paths.currentHandoff, renderInitialHandoff(session), { overwrite: true });

  return {
    session,
    sessionPath,
    currentSessionPath: paths.currentSession,
    handoffPath: paths.currentHandoff
  };
}

export function getVerificationRuns(session: AgentFlightSession): VerificationRun[] {
  return session.verificationRuns ?? [];
}

export function buildArtifactReviewMetadata(
  options: BuildArtifactReviewMetadataOptions
): Record<string, unknown> {
  return {
    path: options.path,
    readiness: {
      state: options.readiness.state,
      label: options.readiness.label,
      riskLevel: options.riskLevel,
      changedFiles: options.changedFiles,
      verificationPassed: options.verificationPassed,
      verificationFailed: options.verificationFailed
    }
  };
}

export async function listSessionSummaries(
  repoRoot: string,
  options: ListSessionSummariesOptions = {}
): Promise<ListSessionSummariesResult> {
  const sessionFiles = await listSessionFiles(resolveAgentFlightPaths(repoRoot).sessions);
  const loadedSessions = await Promise.all(sessionFiles.map(loadSessionSummary));
  const sessions = loadedSessions
    .flatMap((result) => (result.summary ? [result.summary] : []))
    .sort(compareSessionSummaries);
  const skipped = loadedSessions.flatMap((result) => (result.skipped ? [result.skipped] : []));
  const limit = normalizeSessionLimit(options.limit, sessions.length);

  return {
    sessions: sessions.slice(0, limit),
    skipped
  };
}

interface SessionDirEntry {
  name: string;
  isFile(): boolean;
}

type LoadedSessionSummary =
  | {
      summary: SessionSummary;
      skipped?: undefined;
    }
  | {
      summary?: undefined;
      skipped: SkippedSessionFile;
    };

async function listSessionFiles(sessionsPath: string): Promise<string[]> {
  const entries = await readSessionDir(sessionsPath);
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => `${sessionsPath}/${entry.name}`);
}

async function readSessionDir(sessionsPath: string): Promise<SessionDirEntry[]> {
  try {
    return await readdir(sessionsPath, { withFileTypes: true });
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") return [];
    throw error;
  }
}

async function loadSessionSummary(sessionPath: string): Promise<LoadedSessionSummary> {
  try {
    const session = JSON.parse(await readFile(sessionPath, "utf8")) as AgentFlightSession;
    return { summary: summarizeSession(session, sessionPath) };
  } catch (error) {
    return {
      skipped: {
        path: sessionPath,
        reason: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

function summarizeSession(session: AgentFlightSession, sessionPath: string): SessionSummary {
  const runs = getVerificationRuns(session);
  const summary: SessionSummary = {
    id: session.id,
    taskTitle: session.task.title,
    startedAt: session.startedAt,
    branch: session.git.branch ?? null,
    commit: session.git.commit ?? null,
    dirty: session.git.dirty,
    verificationPassed: runs.filter((run) => run.status === "passed").length,
    verificationFailed: runs.filter((run) => run.status === "failed").length,
    sessionPath
  };
  const latestReview = getLatestRecordedReviewSummary(session);
  if (latestReview) summary.latestReview = latestReview;

  return summary;
}

function compareSessionSummaries(left: SessionSummary, right: SessionSummary): number {
  const timeDelta = Date.parse(right.startedAt) - Date.parse(left.startedAt);
  return timeDelta !== 0 ? timeDelta : right.id.localeCompare(left.id);
}

function normalizeSessionLimit(limit: number | undefined, fallback: number): number {
  return limit !== undefined && Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : fallback;
}

export function getSessionEvents(session: AgentFlightSession): SessionEvent[] {
  return session.events ?? [];
}

export function getSessionTimelineEvents(session: AgentFlightSession): SessionEvent[] {
  const events = getSessionEvents(session);
  if (events.length > 0) return events;

  const synthesizedEvents = [
    buildSessionEvent(
      {
        type: "session_started",
        timestamp: session.startedAt,
        title: "Session started"
      },
      1
    )
  ];

  for (const run of getVerificationRuns(session)) {
    synthesizedEvents.push(
      buildSessionEvent(
        {
          type: run.status === "passed" ? "verification_passed" : "verification_failed",
          timestamp: run.finishedAt,
          title: run.status === "passed" ? "Verification passed" : "Verification failed",
          metadata: {
            command: run.command,
            exitCode: run.exitCode,
            stdoutPath: run.stdoutPath,
            stderrPath: run.stderrPath
          }
        },
        synthesizedEvents.length + 1
      )
    );
  }

  return synthesizedEvents;
}

export function getLatestSessionEvent(
  session: AgentFlightSession,
  type: SessionEventType
): SessionEvent | null {
  return (
    getSessionEvents(session)
      .filter((event) => event.type === type)
      .at(-1) ?? null
  );
}

function getLatestRecordedReviewSummary(session: AgentFlightSession): SessionReviewSummary | null {
  const events = getSessionEvents(session);

  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (!event || !isArtifactGeneratedEvent(event)) continue;

    const summary = readRecordedReviewSummary(event);
    if (summary) return summary;
  }

  return null;
}

function isArtifactGeneratedEvent(event: SessionEvent): boolean {
  return event.type === "report_generated" || event.type === "replay_generated";
}

function readRecordedReviewSummary(event: SessionEvent): SessionReviewSummary | null {
  const metadata = readObject(event.metadata);
  const readiness = readObject(metadata?.readiness);
  if (!readiness) return null;

  const state = readReviewReadinessState(readiness.state);
  const label = readNonEmptyString(readiness.label);
  const riskLevel = readRiskLevel(readiness.riskLevel);
  const changedFiles = readNonNegativeInteger(readiness.changedFiles);
  const verificationPassed = readNonNegativeInteger(readiness.verificationPassed);
  const verificationFailed = readNonNegativeInteger(readiness.verificationFailed);
  if (
    !state ||
    !label ||
    !riskLevel ||
    changedFiles === null ||
    verificationPassed === null ||
    verificationFailed === null
  ) {
    return null;
  }

  return {
    state,
    label,
    riskLevel,
    changedFiles,
    verificationPassed,
    verificationFailed,
    artifactPath: readString(metadata?.path),
    generatedAt: event.timestamp
  };
}

function readObject(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readNonEmptyString(value: unknown): string | null {
  const text = readString(value);
  return text && text.trim().length > 0 ? text : null;
}

function readNonNegativeInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

function readReviewReadinessState(value: unknown): ReviewReadinessState | null {
  const states: readonly ReviewReadinessState[] = [
    "ready_for_review",
    "not_ready_for_review",
    "needs_verification",
    "blocked_by_failed_verification",
    "unknown"
  ];
  return typeof value === "string" && states.includes(value as ReviewReadinessState)
    ? (value as ReviewReadinessState)
    : null;
}

function readRiskLevel(value: unknown): RiskLevel | null {
  const levels: readonly RiskLevel[] = ["low", "medium", "high", "unknown"];
  return typeof value === "string" && levels.includes(value as RiskLevel)
    ? (value as RiskLevel)
    : null;
}

export function buildSessionEvent(input: SessionEventInput, ordinal: number): SessionEvent {
  const timestamp = normalizeEventTimestamp(input.timestamp);
  const event: SessionEvent = {
    id: `evt-${formatDateForId(new Date(timestamp))}-${slugify(input.type)}-${String(ordinal).padStart(3, "0")}`,
    type: input.type,
    timestamp,
    title: input.title
  };

  if (input.message !== undefined) event.message = input.message;
  if (input.metadata !== undefined) event.metadata = input.metadata;

  return event;
}

export function addSessionEvent(
  session: AgentFlightSession,
  input: SessionEventInput
): AgentFlightSession {
  const events = getSessionEvents(session);
  return {
    ...session,
    events: [...events, buildSessionEvent(input, events.length + 1)]
  };
}

export async function saveSession(repoRoot: string, session: AgentFlightSession): Promise<void> {
  const paths = resolveAgentFlightPaths(repoRoot);

  await writeJsonFileSafe(`${paths.sessions}/${session.id}.json`, session, { overwrite: true });
  await writeJsonFileSafe(paths.currentSession, session, { overwrite: true });
}

export async function appendSessionEvent(
  repoRoot: string,
  session: AgentFlightSession,
  input: SessionEventInput
): Promise<AgentFlightSession> {
  const updatedSession = addSessionEvent(session, input);

  await saveSession(repoRoot, updatedSession);
  return updatedSession;
}

export async function appendVerificationRun(
  repoRoot: string,
  session: AgentFlightSession,
  run: VerificationRun
): Promise<AgentFlightSession> {
  const updatedSession: AgentFlightSession = {
    ...session,
    verificationRuns: [...getVerificationRuns(session), run]
  };

  await saveSession(repoRoot, updatedSession);
  return updatedSession;
}

export function createSessionId(now: Date, task: string): string {
  return `af-${formatDateForId(now)}-${slugify(task)}`;
}

export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return slug.length > 0 ? slug : "session";
}

function formatDateForId(now: Date): string {
  const iso = now.toISOString();
  return `${iso.slice(0, 10).replaceAll("-", "")}-${iso.slice(11, 19).replaceAll(":", "")}`;
}

function normalizeEventTimestamp(timestamp: Date | string | undefined): string {
  if (timestamp instanceof Date) return timestamp.toISOString();
  if (typeof timestamp === "string") return timestamp;
  return new Date().toISOString();
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error;
}

function renderInitialHandoff(session: AgentFlightSession): string {
  const proof = session.verificationCommands.length
    ? session.verificationCommands.map((command) => `- ${command}`).join("\n")
    : "- No verification commands detected yet.";

  return `# AgentFlight Handoff

## Task
${session.task.title}

## Session
- ID: ${session.id}
- Project: ${basename(session.repoRoot)}
- Started: ${session.startedAt}
- Git branch: ${session.git.branch ?? "unknown"}
- Git commit: ${session.git.commit ?? "unknown"}
- Dirty at start: ${session.git.dirty ? "yes" : "no"}
- Package manager: ${session.packageManager ?? "unknown"}

## Suggested proof
${proof}

Now run your coding agent normally. Keep changes scoped and record proof before claiming completion.
`;
}
