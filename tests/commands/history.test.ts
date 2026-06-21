import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runHistoryCommand } from "../../src/commands/history.js";
import { initAgentFlight } from "../../src/core/config.js";
import {
  addSessionEvent,
  appendVerificationRun,
  saveSession,
  startSession
} from "../../src/core/session.js";
import { createTempRepo } from "../helpers/temp.js";

describe("history command", () => {
  it("lists recent sessions newest first with current marker and local artifact paths", async () => {
    const repoRoot = await createTempRepo();
    await initAgentFlight({ repoRoot, now: new Date("2026-06-13T09:00:00.000Z") });

    const older = await startSession({
      repoRoot,
      task: "Older review",
      now: new Date("2026-06-13T10:00:00.000Z"),
      git: { branch: "main", commit: "older", dirty: false, changedFiles: [] },
      packageManager: "npm",
      tools: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });
    const newer = await startSession({
      repoRoot,
      task: "Newer review",
      now: new Date("2026-06-13T11:00:00.000Z"),
      git: { branch: "feature/history", commit: "newer", dirty: true, changedFiles: [] },
      packageManager: "npm",
      tools: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });

    const newerWithPassingProof = await appendVerificationRun(repoRoot, newer.session, {
      command: "npm test",
      status: "passed",
      exitCode: 0,
      startedAt: "2026-06-13T11:01:00.000Z",
      finishedAt: "2026-06-13T11:02:00.000Z",
      durationMs: 60_000,
      stdoutPath: ".agentflight/evidence/newer.stdout.txt",
      stderrPath: ".agentflight/evidence/newer.stderr.txt"
    });
    const newerWithFailedProof = await appendVerificationRun(repoRoot, newerWithPassingProof, {
      command: "npm run lint",
      status: "failed",
      exitCode: 1,
      startedAt: "2026-06-13T11:03:00.000Z",
      finishedAt: "2026-06-13T11:04:00.000Z",
      durationMs: 60_000,
      stdoutPath: ".agentflight/evidence/newer-lint.stdout.txt",
      stderrPath: ".agentflight/evidence/newer-lint.stderr.txt",
      outputExcerpt: "lint failed"
    });
    const newerWithProof = await appendVerificationRun(repoRoot, newerWithFailedProof, {
      command: "npm run lint",
      status: "passed",
      exitCode: 0,
      startedAt: "2026-06-13T11:04:30.000Z",
      finishedAt: "2026-06-13T11:05:00.000Z",
      durationMs: 30_000,
      stdoutPath: ".agentflight/evidence/newer-lint-fixed.stdout.txt",
      stderrPath: ".agentflight/evidence/newer-lint-fixed.stderr.txt"
    });
    await saveSession(
      repoRoot,
      addSessionEvent(newerWithProof, {
        type: "report_generated",
        timestamp: "2026-06-13T11:06:00.000Z",
        title: "Report generated",
        metadata: {
          path: `.agentflight/reports/${newer.session.id}-proof.md`,
          readiness: {
            state: "ready_for_review",
            label: "Ready for review",
            riskLevel: "medium",
            changedFiles: 1,
            verificationPassed: 2,
            verificationFailed: 1
          }
        }
      })
    );
    await mkdir(join(repoRoot, ".agentflight", "reports"), { recursive: true });
    await writeFile(
      join(repoRoot, ".agentflight", "reports", `${newer.session.id}-proof.md`),
      "# proof",
      "utf8"
    );
    await writeFile(
      join(repoRoot, ".agentflight", "reports", `${newer.session.id}-replay.html`),
      "<!doctype html>",
      "utf8"
    );
    await writeFile(
      join(repoRoot, ".agentflight", "reports", `${newer.session.id}-handoff.md`),
      "AgentFlight handoff",
      "utf8"
    );
    await writeFile(
      join(repoRoot, ".agentflight", "reports", `${newer.session.id}-resume.md`),
      "Continue this AgentFlight-recorded coding session safely.",
      "utf8"
    );

    const history = await runHistoryCommand({ repoRoot, limit: 5 });

    expect(history.output).toContain("AgentFlight history");
    expect(history.output.indexOf("Newer review")).toBeLessThan(
      history.output.indexOf("Older review")
    );
    expect(history.output).toContain("[current]");
    expect(history.output).toContain("feature/history");
    expect(history.output).toContain("Verification: 2 passed, 1 failed (0 unresolved, 1 resolved)");
    expect(history.output).toContain(
      "Recorded readiness: Ready for review (risk medium, 1 changed file)"
    );
    expect(history.output).toContain(
      `Handoff: .agentflight/reports/${newer.session.id}-handoff.md`
    );
    expect(history.output).toContain(`Resume: .agentflight/reports/${newer.session.id}-resume.md`);
    expect(history.output).toContain("Recorded readiness: not recorded");
    expect(history.output).toContain(`Report: .agentflight/reports/${newer.session.id}-proof.md`);
    expect(history.output).toContain(
      `Replay: .agentflight/reports/${newer.session.id}-replay.html`
    );
    expect(history.output).toContain(`Report: missing`);
    expect(history.output).toContain(`Handoff: missing`);
    expect(history.output).toContain(`Replay: missing`);
    expect(history.output).toContain(`Resume: missing`);
    expect(history.output).toContain("Open first: none yet");
    expect(history.output).not.toContain(repoRoot);
    expect(history.output).toContain(older.session.id);
  });

  it("recommends which existing artifact to open first", async () => {
    const repoRoot = await createTempRepo();
    await initAgentFlight({ repoRoot, now: new Date("2026-06-13T09:00:00.000Z") });

    const unknown = await startSession({
      repoRoot,
      task: "Unknown readiness",
      now: new Date("2026-06-13T10:00:00.000Z"),
      git: { branch: "main", commit: "unknown", dirty: false, changedFiles: [] },
      packageManager: "npm",
      tools: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });
    const blocked = await startSession({
      repoRoot,
      task: "Blocked readiness",
      now: new Date("2026-06-13T11:00:00.000Z"),
      git: { branch: "main", commit: "blocked", dirty: false, changedFiles: [] },
      packageManager: "npm",
      tools: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });
    const ready = await startSession({
      repoRoot,
      task: "Ready readiness",
      now: new Date("2026-06-13T12:00:00.000Z"),
      git: { branch: "main", commit: "ready", dirty: false, changedFiles: [] },
      packageManager: "npm",
      tools: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });

    await writeReportReviewSummary(repoRoot, blocked.session.id, {
      state: "blocked_by_failed_verification",
      label: "Blocked by failed verification"
    });
    await writeReportReviewSummary(repoRoot, ready.session.id, {
      state: "ready_for_review",
      label: "Ready for review"
    });
    await writeArtifact(repoRoot, unknown.session.id, "handoff.md", "AgentFlight handoff");
    await writeArtifact(repoRoot, blocked.session.id, "proof.md", "# proof");
    await writeArtifact(repoRoot, ready.session.id, "proof.md", "# proof");
    await writeArtifact(repoRoot, ready.session.id, "replay.html", "<!doctype html>");

    const history = await runHistoryCommand({ repoRoot, limit: 5 });

    expect(history.output).toContain("Ready readiness");
    expect(history.output).toContain("Open first: replay");
    expect(history.output).toContain("Blocked readiness");
    expect(history.output).toContain("Open first: report");
    expect(history.output).toContain("Unknown readiness");
    expect(history.output).toContain("Open first: handoff");
  });

  it("summarizes malformed session files without crashing", async () => {
    const repoRoot = await createTempRepo();
    await initAgentFlight({ repoRoot, now: new Date("2026-06-13T09:00:00.000Z") });
    await writeFile(join(repoRoot, ".agentflight", "sessions", "broken.json"), "{", "utf8");

    const history = await runHistoryCommand({ repoRoot });

    expect(history.output).toContain("No AgentFlight sessions recorded yet.");
    expect(history.output).toContain("Skipped: 1 malformed session file.");
  });

  it("handles empty local history", async () => {
    const repoRoot = await createTempRepo();
    await initAgentFlight({ repoRoot, now: new Date("2026-06-13T09:00:00.000Z") });

    const history = await runHistoryCommand({ repoRoot });

    expect(history.output).toContain("No AgentFlight sessions recorded yet.");
    expect(history.output).toContain("Run agentflight start --task");
  });

  it("rejects invalid history limits", async () => {
    const repoRoot = await createTempRepo();
    await initAgentFlight({ repoRoot, now: new Date("2026-06-13T09:00:00.000Z") });

    for (const limit of [Number.NaN, 0, -1, 1.5]) {
      await expect(runHistoryCommand({ repoRoot, limit })).rejects.toThrow(
        "History limit must be a positive integer."
      );
    }
  });
});

async function writeReportReviewSummary(
  repoRoot: string,
  sessionId: string,
  readiness: { state: string; label: string }
): Promise<void> {
  const sessionPath = join(repoRoot, ".agentflight", "sessions", `${sessionId}.json`);
  const session = JSON.parse(await readFile(sessionPath, "utf8"));

  await saveSession(
    repoRoot,
    addSessionEvent(session, {
      type: "report_generated",
      timestamp: "2026-06-13T12:30:00.000Z",
      title: "Report generated",
      metadata: {
        path: `.agentflight/reports/${sessionId}-proof.md`,
        readiness: {
          state: readiness.state,
          label: readiness.label,
          riskLevel: "medium",
          changedFiles: 1,
          verificationPassed: 1,
          verificationFailed: readiness.state === "ready_for_review" ? 0 : 1
        }
      }
    })
  );
}

async function writeArtifact(
  repoRoot: string,
  sessionId: string,
  suffix: "handoff.md" | "proof.md" | "replay.html",
  content: string
): Promise<void> {
  await mkdir(join(repoRoot, ".agentflight", "reports"), { recursive: true });
  await writeFile(
    join(repoRoot, ".agentflight", "reports", `${sessionId}-${suffix}`),
    content,
    "utf8"
  );
}
