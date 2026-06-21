import { pathExists } from "../core/fs-safe.js";
import { formatVerificationCountLine } from "../core/output.js";
import { formatRepoRelativePath, resolveAgentFlightPaths } from "../core/paths.js";
import { listSessionSummaries } from "../core/session.js";
import { readCurrentSession } from "./status.js";
import type { SessionSummary } from "../core/session.js";

export interface HistoryCommandOptions {
  repoRoot: string;
  limit?: number | undefined;
}

export interface HistoryCommandResult {
  output: string;
}

export async function runHistoryCommand(
  options: HistoryCommandOptions
): Promise<HistoryCommandResult> {
  const limit = normalizeLimit(options.limit);
  const history = await listSessionSummaries(options.repoRoot, { limit });
  const currentSessionId = await readCurrentSessionId(options.repoRoot);

  return {
    output: `AgentFlight history

${await formatSessions(options.repoRoot, history.sessions, currentSessionId)}
${formatSkipped(history.skipped.length)}
`
  };
}

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined) return 10;
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("History limit must be a positive integer.");
  }
  return limit;
}

async function readCurrentSessionId(repoRoot: string): Promise<string | null> {
  try {
    return (await readCurrentSession(repoRoot)).id;
  } catch {
    return null;
  }
}

async function formatSessions(
  repoRoot: string,
  sessions: SessionSummary[],
  currentSessionId: string | null
): Promise<string> {
  if (sessions.length === 0) {
    return formatEmptyHistory();
  }

  const latestSession = sessions[0];
  if (!latestSession) {
    return formatEmptyHistory();
  }

  const latestAction = await formatLatestAction(
    repoRoot,
    latestSession,
    latestSession.id === currentSessionId
  );
  const lines = await Promise.all(
    sessions.map(async (session) =>
      formatSession(repoRoot, session, session.id === currentSessionId)
    )
  );

  return `${latestAction}

Recent sessions:
${lines.join("\n")}`;
}

function formatEmptyHistory(): string {
  return `No AgentFlight sessions recorded yet.

Next action:
Run agentflight start --task "Describe the task" to begin a local session.`;
}

async function formatLatestAction(
  repoRoot: string,
  session: SessionSummary,
  isCurrent: boolean
): Promise<string> {
  const artifacts = await readHistoryArtifacts(repoRoot, session.id);
  const openFirst = chooseOpenFirstArtifact(session, artifacts);
  const nextAction = isCurrent && openFirst === "none yet" ? "\nNext: run agentflight handoff" : "";

  return `Latest action:
Open first: ${openFirst}${nextAction}
Task: ${session.taskTitle}`;
}

async function formatSession(
  repoRoot: string,
  session: SessionSummary,
  isCurrent: boolean
): Promise<string> {
  const marker = isCurrent ? " [current]" : "";
  const branch = session.branch ?? "unknown";
  const artifacts = await readHistoryArtifacts(repoRoot, session.id);

  return `- ${formatStartedAt(session.startedAt)}${marker} ${session.taskTitle}
  ID: ${session.id}
  Branch: ${branch}${session.dirty ? " (dirty at start)" : ""}
  Verification: ${formatVerificationCountLine({
    passed: session.verificationPassed,
    failed: session.verificationFailed,
    unresolvedFailed: session.verificationUnresolvedFailed,
    resolvedFailed: session.verificationResolvedFailed
  })}
  Recorded readiness: ${formatReadiness(session)}
  Open first: ${chooseOpenFirstArtifact(session, artifacts)}
  Handoff: ${artifacts.handoff}
  Report: ${artifacts.report}
  Replay: ${artifacts.replay}
  Resume: ${artifacts.resume}`;
}

function formatReadiness(session: SessionSummary): string {
  const review = session.latestReview;
  if (!review) return "not recorded";

  return `${review.label} (risk ${review.riskLevel}, ${formatChangedFiles(review.changedFiles)})`;
}

function formatChangedFiles(count: number): string {
  return `${count} changed ${count === 1 ? "file" : "files"}`;
}

interface HistoryArtifacts {
  handoff: string;
  report: string;
  replay: string;
  resume: string;
}

async function readHistoryArtifacts(
  repoRoot: string,
  sessionId: string
): Promise<HistoryArtifacts> {
  return {
    handoff: await formatArtifactPath(repoRoot, sessionId, "handoff.md"),
    report: await formatArtifactPath(repoRoot, sessionId, "proof.md"),
    replay: await formatArtifactPath(repoRoot, sessionId, "replay.html"),
    resume: await formatArtifactPath(repoRoot, sessionId, "resume.md")
  };
}

type PrimaryArtifact = "handoff" | "report" | "replay";

function chooseOpenFirstArtifact(session: SessionSummary, artifacts: HistoryArtifacts): string {
  const readiness = session.latestReview?.state;

  if (readiness === "ready_for_review") {
    return formatOpenFirstArtifact(
      firstExistingArtifact(["replay", "handoff", "report"], artifacts),
      artifacts
    );
  }

  if (readiness) {
    return formatOpenFirstArtifact(
      firstExistingArtifact(["report", "handoff", "replay"], artifacts),
      artifacts
    );
  }

  return formatOpenFirstArtifact(
    firstExistingArtifact(["handoff", "replay", "report"], artifacts),
    artifacts
  );
}

function firstExistingArtifact(
  order: PrimaryArtifact[],
  artifacts: HistoryArtifacts
): PrimaryArtifact | null {
  return order.find((artifact) => artifacts[artifact] !== "missing") ?? null;
}

function formatOpenFirstArtifact(
  artifact: PrimaryArtifact | null,
  artifacts: HistoryArtifacts
): string {
  if (!artifact) return "none yet";
  return `${artifact} ${artifacts[artifact]}`;
}

async function formatArtifactPath(
  repoRoot: string,
  sessionId: string,
  suffix: "handoff.md" | "proof.md" | "replay.html" | "resume.md"
): Promise<string> {
  const artifactPath = `${resolveAgentFlightPaths(repoRoot).reports}/${sessionId}-${suffix}`;
  return (await pathExists(artifactPath))
    ? formatRepoRelativePath(repoRoot, artifactPath)
    : "missing";
}

function formatStartedAt(startedAt: string): string {
  const date = new Date(startedAt);
  if (Number.isNaN(date.getTime())) return startedAt;
  return date.toISOString().replace("T", " ").slice(0, 16);
}

function formatSkipped(count: number): string {
  if (count === 0) return "";
  return `\nSkipped: ${count} malformed session ${count === 1 ? "file" : "files"}.`;
}
