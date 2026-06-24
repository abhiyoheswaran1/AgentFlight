import { chooseOpenFirstArtifact, readReviewArtifacts } from "../core/artifacts.js";
import { filterChangedFiles } from "../core/changed-files.js";
import { loadConfig } from "../core/config.js";
import { listChangedFiles } from "../core/git.js";
import { formatVerificationCountLine } from "../core/output.js";
import { formatRepoRelativePath } from "../core/paths.js";
import { buildProofSnapshot, compareProofSnapshotToCurrent } from "../core/proof-snapshot.js";
import { listSessionSummaries } from "../core/session.js";
import { readCurrentSession } from "./status.js";
import type { SessionSummary, SkippedSessionFile } from "../core/session.js";

export interface HistoryCommandOptions {
  repoRoot: string;
  limit?: number | undefined;
  task?: string | undefined;
  state?: string | undefined;
}

export interface HistoryCommandResult {
  output: string;
}

export async function runHistoryCommand(
  options: HistoryCommandOptions
): Promise<HistoryCommandResult> {
  const limit = normalizeLimit(options.limit);
  const filters = normalizeHistoryFilters(options);
  const history = await listSessionSummaries(options.repoRoot);
  const currentSessionId = await readCurrentSessionId(options.repoRoot);
  const currentChangedFiles =
    currentSessionId === null ? null : await readFilteredChangedFiles(options.repoRoot);
  const sessions = applyHistoryFilters(history.sessions, filters, currentSessionId).slice(0, limit);

  return {
    output: `AgentFlight history

${await formatSessions(options.repoRoot, sessions, currentSessionId, currentChangedFiles, filters)}
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

type HistoryStateFilter = "ready" | "blocked" | "needs_verification" | "unknown" | "current";

interface NormalizedHistoryFilters {
  task: string | null;
  state: HistoryStateFilter | null;
  rawTask: string | null;
  rawState: string | null;
}

const historyStateFilterLabels: HistoryStateFilter[] = [
  "ready",
  "blocked",
  "needs_verification",
  "unknown",
  "current"
];

const historyStateAliases = new Map<string, HistoryStateFilter>([
  ["ready", "ready"],
  ["ready_for_review", "ready"],
  ["blocked", "blocked"],
  ["blocked_by_failed_verification", "blocked"],
  ["failed", "blocked"],
  ["not_ready", "blocked"],
  ["not_ready_for_review", "blocked"],
  ["needs", "needs_verification"],
  ["needs-verification", "needs_verification"],
  ["needs_verification", "needs_verification"],
  ["unknown", "unknown"],
  ["current", "current"]
]);

function normalizeHistoryFilters(options: HistoryCommandOptions): NormalizedHistoryFilters {
  const rawTask = normalizeOptionalText(options.task);
  const rawState = normalizeOptionalText(options.state);

  return {
    task: rawTask ? rawTask.toLocaleLowerCase() : null,
    state: rawState ? normalizeHistoryState(rawState) : null,
    rawTask,
    rawState
  };
}

function normalizeOptionalText(value: string | undefined): string | null {
  if (value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeHistoryState(value: string): HistoryStateFilter {
  const normalized = value
    .trim()
    .toLocaleLowerCase()
    .replace(/[\s-]+/g, "_");
  const state = historyStateAliases.get(normalized);
  if (state) return state;

  throw new Error(`History state filter must be one of: ${historyStateFilterLabels.join(", ")}.`);
}

async function readCurrentSessionId(repoRoot: string): Promise<string | null> {
  try {
    return (await readCurrentSession(repoRoot)).id;
  } catch {
    return null;
  }
}

async function readFilteredChangedFiles(repoRoot: string): Promise<string[] | null> {
  const config = await loadConfig(repoRoot);
  let changedFiles: string[];
  try {
    changedFiles = await listChangedFiles(repoRoot);
  } catch {
    return null;
  }
  return filterChangedFiles(changedFiles, { ignore: config?.changedFileFilters?.ignore });
}

async function formatSessions(
  repoRoot: string,
  sessions: SessionSummary[],
  currentSessionId: string | null,
  currentChangedFiles: string[] | null,
  filters: NormalizedHistoryFilters
): Promise<string> {
  if (sessions.length === 0) {
    return hasHistoryFilters(filters) ? formatEmptyFilteredHistory(filters) : formatEmptyHistory();
  }

  const latestSession = sessions[0];
  if (!latestSession) {
    return formatEmptyHistory();
  }

  const latestAction = await formatLatestAction(
    repoRoot,
    latestSession,
    latestSession.id === currentSessionId,
    latestSession.id === currentSessionId ? currentChangedFiles : null,
    await findPreviousOpenFirstArtifact(repoRoot, sessions.slice(1))
  );
  const lines = await Promise.all(
    sessions.map(async (session) =>
      formatSession(
        repoRoot,
        session,
        session.id === currentSessionId,
        session.id === currentSessionId ? currentChangedFiles : null
      )
    )
  );

  return `${formatFilters(filters)}${latestAction}

Recent sessions:
${lines.join("\n")}`;
}

function formatEmptyHistory(): string {
  return `No AgentFlight sessions recorded yet.

Next action:
Run agentflight start --task "Describe the task" to begin a local session.`;
}

function formatEmptyFilteredHistory(filters: NormalizedHistoryFilters): string {
  return `No AgentFlight sessions matched the history filters.

${formatFilters(filters)}Next action:
Run agentflight history without filters to list recent local sessions.`;
}

async function formatLatestAction(
  repoRoot: string,
  session: SessionSummary,
  isCurrent: boolean,
  currentChangedFiles: string[] | null,
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
${await formatReviewReceipt(repoRoot, session, currentChangedFiles)}
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
  isCurrent: boolean,
  currentChangedFiles: string[] | null
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
${await formatReviewReceipt(repoRoot, session, currentChangedFiles)}
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

function applyHistoryFilters(
  sessions: SessionSummary[],
  filters: NormalizedHistoryFilters,
  currentSessionId: string | null
): SessionSummary[] {
  return sessions
    .filter((session) => matchesTaskFilter(session, filters.task))
    .filter((session) => matchesStateFilter(session, filters.state, currentSessionId));
}

function matchesTaskFilter(session: SessionSummary, taskFilter: string | null): boolean {
  if (!taskFilter) return true;
  return session.taskTitle.toLocaleLowerCase().includes(taskFilter);
}

function matchesStateFilter(
  session: SessionSummary,
  stateFilter: HistoryStateFilter | null,
  currentSessionId: string | null
): boolean {
  if (!stateFilter) return true;
  if (stateFilter === "current") return session.id === currentSessionId;
  if (stateFilter === "unknown")
    return !session.latestReview || session.latestReview.state === "unknown";
  if (!session.latestReview) return false;

  if (stateFilter === "ready") return session.latestReview.state === "ready_for_review";
  if (stateFilter === "blocked") {
    return (
      session.latestReview.state === "blocked_by_failed_verification" ||
      session.latestReview.state === "not_ready_for_review"
    );
  }
  return session.latestReview.state === "needs_verification";
}

function hasHistoryFilters(filters: NormalizedHistoryFilters): boolean {
  return Boolean(filters.rawTask || filters.rawState);
}

function formatFilters(filters: NormalizedHistoryFilters): string {
  if (!hasHistoryFilters(filters)) return "";

  const lines = ["Filters:"];
  if (filters.rawTask) lines.push(`- Task contains: ${filters.rawTask}`);
  if (filters.rawState) lines.push(`- State: ${filters.rawState}`);
  return `${lines.join("\n")}\n\n`;
}

function formatReadiness(session: SessionSummary): string {
  const review = session.latestReview;
  if (!review) return "not recorded";

  return `${review.label} (risk ${review.riskLevel}, ${formatChangedFiles(review.changedFiles)})`;
}

async function formatReviewReceipt(
  repoRoot: string,
  session: SessionSummary,
  currentChangedFiles: string[] | null
): Promise<string> {
  const receipt = session.latestReviewReceipt;
  if (!receipt) return "Review receipt: not recorded";
  const state = await evaluateHistoryReceiptState(repoRoot, receipt, currentChangedFiles);
  return `Review receipt: ${receipt.decision.replaceAll("_", " ")} (${state}) at ${receipt.recordedAt}
  ${receipt.summary}`;
}

async function evaluateHistoryReceiptState(
  repoRoot: string,
  receipt: NonNullable<SessionSummary["latestReviewReceipt"]>,
  currentChangedFiles: string[] | null
): Promise<string> {
  if (receipt.decision !== "accepted") return receipt.decision.replaceAll("_", " ");
  const changedFiles = currentChangedFiles ?? receipt.snapshot.changedFiles;
  if (changedFiles.length === 0) return "current";
  if (!receipt.snapshot.proofSnapshot) return "stale";

  const currentSnapshot = await buildProofSnapshot({
    repoRoot,
    changedFiles,
    capturedAt: new Date().toISOString(),
    gitCommit: receipt.snapshot.gitCommit
  });
  return compareProofSnapshotToCurrent(receipt.snapshot.proofSnapshot, currentSnapshot).current
    ? "current"
    : "stale";
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
