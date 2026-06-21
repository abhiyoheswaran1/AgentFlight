import { filterChangedFiles } from "../core/changed-files.js";
import { loadConfig } from "../core/config.js";
import { getGitInfo } from "../core/git.js";
import { buildProofSnapshot } from "../core/proof-snapshot.js";
import { analyzeRisk } from "../core/risk.js";
import { buildReviewIntelligence } from "../core/review-intelligence.js";
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
  const now = options.now ?? new Date();
  const config = await loadConfig(options.repoRoot);
  const rawGit = options.git ?? (await getGitInfo(options.repoRoot));
  const changedFiles = filterChangedFiles(rawGit.changedFiles, {
    ignore: config?.changedFileFilters?.ignore
  });
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
  const currentProofSnapshot = await buildProofSnapshot({
    repoRoot: options.repoRoot,
    changedFiles: git.changedFiles,
    capturedAt: now.toISOString(),
    gitCommit: session.git.commit ?? null
  });
  const review = buildReviewIntelligence({
    changedFiles: git.changedFiles,
    risk,
    session,
    currentProofSnapshot
  });

  const updatedSession = await appendSessionEvent(options.repoRoot, session, {
    type: "snapshot_created",
    timestamp: now,
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
      },
      review: {
        readiness: review.readiness.state,
        topFocusFiles: review.focus.slice(0, 3).map((item) => item.file),
        proofGapCount: review.proofGaps.length
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
