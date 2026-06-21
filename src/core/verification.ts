import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ensureDir, tryWriteTextFileExclusive, writeTextFileSafe } from "./fs-safe.js";
import { runCommand, type CommandRunner } from "./process.js";
import { resolveAgentFlightPaths } from "./paths.js";
import { getVerificationRuns } from "./session.js";
import {
  formatCommand,
  getUnresolvedFailedRuns,
  normalizeCommandString
} from "./verification-runs.js";
import type { AgentFlightSession, RiskLevel, VerificationRun } from "../types/index.js";

export {
  formatCommand,
  getUnresolvedFailedRuns,
  normalizeCommandString,
  parseCommandLine
} from "./verification-runs.js";

export interface PackageJsonLike {
  scripts?: Record<string, string>;
}

export interface RunVerificationCommandOptions {
  repoRoot: string;
  session: AgentFlightSession;
  commandArgs: string[];
  now?: (() => Date) | undefined;
  commandRunner?: CommandRunner | undefined;
}

export type ReviewReadiness = "Ready for review" | "Not ready for review" | "Blocked" | "Unknown";

export interface VerificationSummary {
  runs: VerificationRun[];
  passed: number;
  failed: number;
  unresolvedFailed: number;
  resolvedFailed: number;
  unresolvedFailedRuns: VerificationRun[];
  missingCommands: string[];
  gaps: string[];
  readiness: ReviewReadiness;
  nextAction: string;
}

export interface BuildVerificationSummaryOptions {
  changedFilesCount?: number | undefined;
  riskLevel?: RiskLevel | undefined;
}

export function detectVerificationCommands(packageJson: PackageJsonLike): string[] {
  const scripts = packageJson.scripts ?? {};
  const commands: string[] = [];

  if (scripts.typecheck) commands.push("npm run typecheck");
  if (scripts.lint) commands.push("npm run lint");
  if (scripts.test) commands.push("npm test");
  if (scripts.build) commands.push("npm run build");

  return commands;
}

export async function runVerificationCommand(
  options: RunVerificationCommandOptions
): Promise<VerificationRun> {
  if (options.commandArgs.length === 0) {
    throw new Error("Verification command is empty.");
  }

  const now = options.now ?? (() => new Date());
  const startedAt = now();
  const runNumber = getVerificationRuns(options.session).length + 1;
  const { stdoutPath, stderrPath } = await reserveVerificationEvidencePaths({
    repoRoot: options.repoRoot,
    sessionId: options.session.id,
    firstRunNumber: runNumber
  });
  const runner = options.commandRunner ?? runCommand;

  const result = await runner(options.commandArgs[0]!, options.commandArgs.slice(1), {
    cwd: options.repoRoot,
    timeoutMs: 10 * 60_000
  });
  const finishedAt = now();

  await writeTextFileSafe(join(options.repoRoot, stdoutPath), result.stdout, { overwrite: true });
  await writeTextFileSafe(join(options.repoRoot, stderrPath), result.stderr, { overwrite: true });

  const outputExcerpt = buildOutputExcerpt(result.stdout, result.stderr);

  const run: VerificationRun = {
    command: formatCommand(options.commandArgs),
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: Math.max(0, finishedAt.getTime() - startedAt.getTime()),
    exitCode: result.exitCode,
    status: result.exitCode === 0 ? "passed" : "failed",
    stdoutPath,
    stderrPath
  };
  if (outputExcerpt !== undefined) run.outputExcerpt = outputExcerpt;

  return run;
}

interface ReserveVerificationEvidencePathsOptions {
  repoRoot: string;
  sessionId: string;
  firstRunNumber: number;
}

async function reserveVerificationEvidencePaths(
  options: ReserveVerificationEvidencePathsOptions
): Promise<{ stdoutPath: string; stderrPath: string }> {
  const paths = resolveAgentFlightPaths(options.repoRoot);
  const evidenceDir = join(paths.evidence, options.sessionId);
  await ensureDir(evidenceDir);

  for (let offset = 0; offset < 1000; offset += 1) {
    const runName = `verification-${options.firstRunNumber + offset}`;
    const claimPath = join(evidenceDir, `.${runName}.claim`);
    const claimed = await tryWriteTextFileExclusive(
      claimPath,
      `${process.pid} ${new Date().toISOString()}\n`
    );
    if (!claimed) continue;

    return {
      stdoutPath: `.agentflight/evidence/${options.sessionId}/${runName}.stdout.txt`,
      stderrPath: `.agentflight/evidence/${options.sessionId}/${runName}.stderr.txt`
    };
  }

  throw new Error("Unable to reserve AgentFlight verification evidence path.");
}

export interface OutputExcerptOptions {
  maxLines?: number;
  maxLineLength?: number;
  maxChars?: number;
}

/**
 * Build a compact tail of command output for inline display. Prefers stderr when it
 * carries content (crashes, stack traces), otherwise falls back to stdout (most test
 * runners, type checkers, and linters report failures there). Returns undefined when
 * there is nothing meaningful to show.
 */
export function buildOutputExcerpt(
  stdout: string,
  stderr: string,
  options: OutputExcerptOptions = {}
): string | undefined {
  const maxLines = options.maxLines ?? 14;
  const maxLineLength = options.maxLineLength ?? 200;
  const maxChars = options.maxChars ?? 1400;

  const source = stderr.trim().length > 0 ? stderr : stdout;
  const trimmed = source.replace(/\s+$/u, "");
  if (trimmed.length === 0) return undefined;

  const lines = trimmed
    .split("\n")
    .slice(-maxLines)
    .map((line) => (line.length > maxLineLength ? `${line.slice(0, maxLineLength)}…` : line));

  let excerpt = lines.join("\n");
  if (excerpt.length > maxChars) {
    excerpt = `…${excerpt.slice(excerpt.length - maxChars)}`;
  }

  return excerpt;
}

export async function readVerificationStdout(
  repoRoot: string,
  run: VerificationRun
): Promise<string> {
  return readFile(join(repoRoot, run.stdoutPath), "utf8");
}

export function buildVerificationSummary(
  session: AgentFlightSession,
  options: BuildVerificationSummaryOptions = {}
): VerificationSummary {
  const runs = getVerificationRuns(session);
  const passedRuns = runs.filter((run) => run.status === "passed");
  const failedRuns = runs.filter((run) => run.status === "failed");
  const unresolvedFailedRuns = getUnresolvedFailedRuns(runs);
  const passedCommands = new Set(passedRuns.map((run) => normalizeCommandString(run.command)));
  const missingCommands = session.verificationCommands.filter(
    (command) => !passedCommands.has(normalizeCommandString(command))
  );
  const gaps = buildVerificationGaps(runs, missingCommands, unresolvedFailedRuns);
  const readiness = determineReadiness({
    runs,
    failed: unresolvedFailedRuns.length,
    missingCommands,
    changedFilesCount: options.changedFilesCount ?? null
  });

  return {
    runs,
    passed: passedRuns.length,
    failed: failedRuns.length,
    unresolvedFailed: unresolvedFailedRuns.length,
    resolvedFailed: failedRuns.length - unresolvedFailedRuns.length,
    unresolvedFailedRuns,
    missingCommands,
    gaps,
    readiness,
    nextAction: buildNextAction(readiness, missingCommands, options.riskLevel)
  };
}

function buildVerificationGaps(
  runs: VerificationRun[],
  missingCommands: string[],
  unresolvedFailedRuns: VerificationRun[]
): string[] {
  const gaps: string[] = [];

  if (unresolvedFailedRuns.length > 0) {
    gaps.push("A verification command failed and must be fixed or rerun successfully.");
  }

  if (missingCommands.length > 0) {
    gaps.push(
      ...missingCommands.map((command) => `Missing passing verification evidence for: ${command}`)
    );
  }

  if (gaps.length > 0) return gaps;

  if (runs.length === 0) {
    return ["No verification evidence recorded."];
  }

  return ["No configured verification gaps."];
}

function determineReadiness(input: {
  runs: VerificationRun[];
  failed: number;
  missingCommands: string[];
  changedFilesCount: number | null;
}): ReviewReadiness {
  if (input.failed > 0) return "Blocked";
  if (input.changedFilesCount === 0 && input.runs.length === 0) return "Unknown";
  if (input.runs.length === 0 || input.missingCommands.length > 0) return "Not ready for review";
  return "Ready for review";
}

function buildNextAction(
  readiness: ReviewReadiness,
  missingCommands: string[],
  riskLevel: RiskLevel | undefined
): string {
  if (readiness === "Blocked") {
    return missingCommands.length > 0
      ? `Fix the failed command, then rerun agentflight verify -- ${missingCommands[0]}`
      : "Fix the failed verification command, then rerun agentflight verify.";
  }

  if (missingCommands.length > 0) {
    return `Run agentflight verify -- ${missingCommands[0]}`;
  }

  if (readiness === "Ready for review") {
    return riskLevel === "high"
      ? "Generate a report and request focused review for the high-risk areas."
      : "Generate a report and hand off for review.";
  }

  return "Run agentflight verify -- <command> to capture proof before claiming completion.";
}
