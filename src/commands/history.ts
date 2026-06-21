import { chooseOpenFirstArtifact, readReviewArtifacts } from "../core/artifacts.js";
import { formatVerificationCountLine } from "../core/output.js";
import { formatRepoRelativePath } from "../core/paths.js";
import { listSessionSummaries } from "../core/session.js";
import { readCurrentSession } from "./status.js";
import type { SessionSummary, SkippedSessionFile } from "../core/session.js";

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
${formatSkipped(options.repoRoot, history.skipped)}
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
    latestSession.id === currentSessionId,
    await findPreviousOpenFirstArtifact(repoRoot, sessions.slice(1))
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
  isCurrent: boolean,
  previousOpenFirst: string | null
): Promise<string> {
  const artifacts = await readReviewArtifacts(repoRoot, session.id);
  const openFirst = chooseOpenFirstArtifact(session.latestReview?.state, artifacts);
  const nextAction =
    isCurrent && openFirst === "none yet" ? formatMissingArtifactNextAction(session) : "";
  const previousArtifact =
    isCurrent && openFirst === "none yet" && previousOpenFirst
      ? `\nPrevious artifact: ${previousOpenFirst}`
      : "";

  return `Latest action:
Open first: ${openFirst}${nextAction}${previousArtifact}
Recorded readiness: ${formatReadiness(session)}
Task: ${session.taskTitle}`;
}

function formatMissingArtifactNextAction(session: SessionSummary): string {
  return hasVerificationEvidence(session)
    ? "\nNext: run agentflight handoff"
    : "\nNext: run agentflight verify, then agentflight handoff";
}

async function formatSession(
  repoRoot: string,
  session: SessionSummary,
  isCurrent: boolean
): Promise<string> {
  const marker = isCurrent ? " [current]" : "";
  const branch = session.branch ?? "unknown";
  const artifacts = await readReviewArtifacts(repoRoot, session.id);
  const header = `- ${formatStartedAt(session.startedAt)}${marker} ${session.taskTitle}
  ID: ${session.id}
  Branch: ${branch}${session.dirty ? " (dirty at start)" : ""}`;

  if (isStartOnlySession(session, isCurrent, artifacts)) {
    return `${header}
  Start only: no verification or review artifacts recorded.`;
  }

  return `${header}
  Verification: ${formatVerificationCountLine({
    passed: session.verificationPassed,
    failed: session.verificationFailed,
    unresolvedFailed: session.verificationUnresolvedFailed,
    resolvedFailed: session.verificationResolvedFailed
  })}
  Recorded readiness: ${formatReadiness(session)}
  Open first: ${chooseOpenFirstArtifact(session.latestReview?.state, artifacts)}
  Handoff: ${artifacts.handoff}
  Report: ${artifacts.report}
  Replay: ${artifacts.replay}
  Resume: ${artifacts.resume}`;
}

function isStartOnlySession(
  session: SessionSummary,
  isCurrent: boolean,
  artifacts: Awaited<ReturnType<typeof readReviewArtifacts>>
): boolean {
  if (isCurrent) return false;
  if (session.latestReview) return false;
  if (hasVerificationEvidence(session)) return false;
  return !hasReviewArtifact(artifacts);
}

function hasVerificationEvidence(session: SessionSummary): boolean {
  const counts = [
    session.verificationPassed,
    session.verificationFailed,
    session.verificationUnresolvedFailed,
    session.verificationResolvedFailed
  ];
  return counts.some((count) => count > 0);
}

function hasReviewArtifact(artifacts: Awaited<ReturnType<typeof readReviewArtifacts>>): boolean {
  return Object.values(artifacts).some((artifact) => artifact !== "missing");
}

function formatReadiness(session: SessionSummary): string {
  const review = session.latestReview;
  if (!review) return "not recorded";

  return `${review.label} (risk ${review.riskLevel}, ${formatChangedFiles(review.changedFiles)})`;
}

async function findPreviousOpenFirstArtifact(
  repoRoot: string,
  sessions: SessionSummary[]
): Promise<string | null> {
  for (const session of sessions) {
    const artifacts = await readReviewArtifacts(repoRoot, session.id);
    const openFirst = chooseOpenFirstArtifact(session.latestReview?.state, artifacts);
    if (openFirst !== "none yet") return openFirst;
  }

  return null;
}

function formatChangedFiles(count: number): string {
  return `${count} changed ${count === 1 ? "file" : "files"}`;
}

function formatStartedAt(startedAt: string): string {
  const date = new Date(startedAt);
  if (Number.isNaN(date.getTime())) return startedAt;
  return date.toISOString().replace("T", " ").slice(0, 16);
}

function formatSkipped(repoRoot: string, skipped: SkippedSessionFile[]): string {
  if (skipped.length === 0) return "";

  const visiblePaths = skipped
    .map((file) => formatRepoRelativePath(repoRoot, file.path))
    .sort((left, right) => left.localeCompare(right))
    .slice(0, 3);
  const omitted = skipped.length - visiblePaths.length;
  const omittedLine =
    omitted > 0
      ? `\n... ${omitted} more malformed session ${omitted === 1 ? "file" : "files"} omitted.`
      : "";

  return `\nSkipped malformed sessions:
${visiblePaths.map((path) => `- ${path}`).join("\n")}${omittedLine}`;
}
