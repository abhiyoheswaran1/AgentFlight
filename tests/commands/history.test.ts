import { mkdir, writeFile } from "node:fs/promises";
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
    const newerWithProof = await appendVerificationRun(repoRoot, newerWithPassingProof, {
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
    await saveSession(
      repoRoot,
      addSessionEvent(newerWithProof, {
        type: "report_generated",
        timestamp: "2026-06-13T11:05:00.000Z",
        title: "Report generated",
        metadata: {
          path: `.agentflight/reports/${newer.session.id}-proof.md`,
          readiness: {
            state: "blocked_by_failed_verification",
            label: "Blocked by failed verification",
            riskLevel: "high",
            changedFiles: 1,
            verificationPassed: 1,
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

    const history = await runHistoryCommand({ repoRoot, limit: 5 });

    expect(history.output).toContain("AgentFlight history");
    expect(history.output.indexOf("Newer review")).toBeLessThan(
      history.output.indexOf("Older review")
    );
    expect(history.output).toContain("[current]");
    expect(history.output).toContain("feature/history");
    expect(history.output).toContain("Verification: 1 passed, 1 failed");
    expect(history.output).toContain(
      "Readiness: Blocked by failed verification (risk high, 1 changed file)"
    );
    expect(history.output).toContain("Readiness: not recorded");
    expect(history.output).toContain(`Report: .agentflight/reports/${newer.session.id}-proof.md`);
    expect(history.output).toContain(
      `Replay: .agentflight/reports/${newer.session.id}-replay.html`
    );
    expect(history.output).toContain(`Report: missing`);
    expect(history.output).toContain(`Replay: missing`);
    expect(history.output).not.toContain(repoRoot);
    expect(history.output).toContain(older.session.id);
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
