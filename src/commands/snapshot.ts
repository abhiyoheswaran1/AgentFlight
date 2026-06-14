import { filterAgentFlightRuntimePaths } from "../core/changed-files.js";
import { getGitInfo } from "../core/git.js";
import { analyzeRisk } from "../core/risk.js";
import { appendSessionEvent } from "../core/session.js";
import { buildVerificationSummary } from "../core/verification.js";
import { readCurrentSession } from "./status.js";
import type { GitInfo, SessionEvent } from "../types/index.js";

export interface SnapshotCommandOptions {
  repoRoot: string;
  note?: string | undefined;
  now?: Date | undefined;
  git?: GitInfo | undefined;
}

export interface SnapshotCommandResult {
  output: string;
  event: SessionEvent;
}

export async function runSnapshotCommand(
  options: SnapshotCommandOptions
): Promise<SnapshotCommandResult> {
  const session = await readCurrentSession(options.repoRoot);
  const rawGit = options.git ?? (await getGitInfo(options.repoRoot));
  const changedFiles = filterAgentFlightRuntimePaths(rawGit.changedFiles);
  const git = {
    ...rawGit,
    dirty: changedFiles.length > 0,
    changedFiles
  };
  const risk = analyzeRisk(git.changedFiles);
  const verification = buildVerificationSummary(session, {
    changedFilesCount: git.changedFiles.length,
    riskLevel: risk.level
  });

  const updatedSession = await appendSessionEvent(options.repoRoot, session, {
    type: "snapshot_created",
    timestamp: options.now ?? new Date(),
    title: "Snapshot created",
    ...(options.note ? { message: options.note } : {}),
    metadata: {
      git,
      risk,
      verification: {
        passed: verification.passed,
        failed: verification.failed,
        readiness: verification.readiness,
        gaps: verification.gaps,
        missingCommands: verification.missingCommands
      }
    }
  });
  const event = updatedSession.events?.at(-1);

  if (!event) {
    throw new Error("Snapshot event was not recorded.");
  }

  return {
    output: `Snapshot recorded

${options.note ? `Note: ${options.note}\n` : ""}Changed files: ${git.changedFiles.length}
Risk: ${risk.level}
Verification: ${verification.passed} passed, ${verification.failed} failed
`,
    event
  };
}
