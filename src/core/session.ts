import { basename } from "node:path";
import { writeJsonFileSafe, writeTextFileSafe } from "./fs-safe.js";
import { resolveAgentFlightPaths } from "./paths.js";
import type {
  AgentFlightSession,
  GitInfo,
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

export async function saveSession(repoRoot: string, session: AgentFlightSession): Promise<void> {
  const paths = resolveAgentFlightPaths(repoRoot);

  await writeJsonFileSafe(`${paths.sessions}/${session.id}.json`, session, { overwrite: true });
  await writeJsonFileSafe(paths.currentSession, session, { overwrite: true });
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
