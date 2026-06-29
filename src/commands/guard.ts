import { createAgentFlightGuardSummary, renderAgentFlightGuardSummary } from "../core/guard.js";
import { baseframeResultRelativePath } from "../core/baseframe.js";
import { reviewPassportArtifactPaths } from "../core/review-passport.js";
import { runStatusCommand } from "./status.js";
import type {
  AgentFlightGuardArtifactHints,
  AgentFlightGuardSummary,
  AgentFlightResultV1,
  ProofGap,
  ReviewQueueItem,
  ReviewReadinessDecision,
  ReviewRouteItem,
  ReviewRoutes,
  TrustDelta
} from "../types/index.js";

export interface GuardCommandOptions {
  repoRoot: string;
  once?: boolean | undefined;
  format?: string | undefined;
  intervalMs?: number | undefined;
  clear?: boolean | undefined;
  changedFiles?: string[] | undefined;
  now?: Date | undefined;
}

export interface GuardCommandResult {
  output: string;
  exitCode: number;
  summary: AgentFlightGuardSummary;
}

type GuardFormat = "text" | "json";

interface GuardStatusJson {
  session: { id: string };
  task: { title: string };
  changedFiles: string[];
  verification: {
    passed: number;
    failed: number;
    unresolvedFailed: number;
    resolvedFailed: number;
  };
  review: {
    readiness: Pick<
      ReviewReadinessDecision,
      "state" | "label" | "reason" | "nextAction" | "suggestedCommand"
    >;
    proofGaps: ProofGap[];
    trustDelta?: TrustDelta | undefined;
    reviewQueue?: ReviewQueueItem[] | undefined;
    reviewRoutes?: ReviewRoutes | { items: ReviewRouteItem[] } | undefined;
  };
  baseframe: AgentFlightResultV1 | null;
  nextAction: string;
}

export async function runGuardCommand(options: GuardCommandOptions): Promise<GuardCommandResult> {
  const format = normalizeGuardFormat(options.format);
  if (options.once) return runGuardOnce({ ...options, format });
  return runGuardWatch({ ...options, format });
}

async function runGuardOnce(
  options: GuardCommandOptions & { format: GuardFormat }
): Promise<GuardCommandResult> {
  const now = options.now ?? new Date();
  const status = await readGuardStatus({
    repoRoot: options.repoRoot,
    changedFiles: options.changedFiles,
    now
  });
  const summary = createAgentFlightGuardSummary({
    generatedAt: now,
    task: status.task,
    changedFiles: status.changedFiles,
    verification: status.verification,
    artifactHints: buildArtifactHints({
      repoRoot: options.repoRoot,
      sessionId: status.session.id,
      baseframeTaskId: status.baseframe?.taskId
    }),
    review: status.review,
    baseframe: status.baseframe,
    nextAction: status.nextAction
  });

  return {
    output:
      options.format === "json"
        ? `${JSON.stringify(summary, null, 2)}\n`
        : renderAgentFlightGuardSummary(summary),
    exitCode: guardExitCode(summary),
    summary
  };
}

async function runGuardWatch(
  options: GuardCommandOptions & { format: GuardFormat }
): Promise<GuardCommandResult> {
  const intervalMs = normalizeIntervalMs(options.intervalMs);
  let stopped = false;
  const stop = () => {
    stopped = true;
  };
  process.once("SIGINT", stop);

  let latest = await runGuardOnce(watchOnceOptions(options));
  try {
    while (!stopped) {
      if (options.clear !== false && options.format === "text") {
        process.stdout.write("\x1Bc");
      }
      process.stdout.write(latest.output);
      await sleep(intervalMs);
      if (!stopped) {
        latest = await runGuardOnce(watchOnceOptions(options));
      }
    }
  } finally {
    process.removeListener("SIGINT", stop);
  }

  return {
    output: "AgentFlight guard stopped.\n",
    exitCode: latest.exitCode,
    summary: latest.summary
  };
}

function watchOnceOptions(
  options: GuardCommandOptions & { format: GuardFormat }
): GuardCommandOptions & { format: GuardFormat } {
  return {
    repoRoot: options.repoRoot,
    once: true,
    format: options.format,
    intervalMs: options.intervalMs,
    clear: options.clear,
    changedFiles: options.changedFiles
  };
}

async function readGuardStatus(input: {
  repoRoot: string;
  changedFiles?: string[] | undefined;
  now: Date;
}): Promise<GuardStatusJson> {
  const status = await runStatusCommand({
    repoRoot: input.repoRoot,
    changedFiles: input.changedFiles,
    now: input.now,
    format: "json"
  });
  return JSON.parse(status.output) as GuardStatusJson;
}

function buildArtifactHints(input: {
  repoRoot: string;
  sessionId: string;
  baseframeTaskId?: string | undefined;
}): AgentFlightGuardArtifactHints {
  const passport = reviewPassportArtifactPaths(input.repoRoot, input.sessionId);
  return {
    reviewPassportJson: passport.jsonRelativePath,
    reviewPassportMarkdown: passport.markdownRelativePath,
    ...(input.baseframeTaskId
      ? { baseframeResult: baseframeResultRelativePath(input.baseframeTaskId) }
      : {})
  };
}

function normalizeGuardFormat(format: string | undefined): GuardFormat {
  if (!format || format === "text") return "text";
  if (format === "json") return "json";
  throw new Error(`Unsupported guard format "${format}". Use "text" or "json".`);
}

function normalizeIntervalMs(intervalMs: number | undefined): number {
  if (intervalMs === undefined || Number.isNaN(intervalMs)) return 2_000;
  return Math.max(500, Math.floor(intervalMs));
}

function guardExitCode(summary: AgentFlightGuardSummary): number {
  if (
    summary.readiness.state === "ready_for_review" ||
    summary.readiness.state === "clean_worktree"
  ) {
    return 0;
  }
  return 1;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
