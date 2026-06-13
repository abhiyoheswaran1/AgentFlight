import { basename } from "node:path";
import { writeJsonFileSafe, writeTextFileSafe } from "./fs-safe.js";
import { resolveAgentFlightPaths } from "./paths.js";
import type {
  AgentFlightSession,
  GitInfo,
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
