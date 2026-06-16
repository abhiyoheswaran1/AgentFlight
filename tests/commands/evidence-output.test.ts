import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTempRepo } from "../helpers/temp.js";
import { initAgentFlight } from "../../src/core/config.js";
import { startSession } from "../../src/core/session.js";
import { runReplayCommand } from "../../src/commands/replay.js";
import { runReportCommand } from "../../src/commands/report.js";
import { runResumeCommand } from "../../src/commands/resume.js";
import { runSnapshotCommand } from "../../src/commands/snapshot.js";
import { runStatusCommand } from "../../src/commands/status.js";
import { runVerifyCommand } from "../../src/commands/verify.js";

describe("evidence-aware session outputs", () => {
  it("shows verification evidence and readiness in status", async () => {
    const command = `${process.execPath} -e "console.log('proof ok')"`;
    const repoRoot = await startedRepo([command]);
    await runVerifyCommand({
      repoRoot,
      commandArgs: [process.execPath, "-e", "console.log('proof ok')"],
      now: () => new Date("2026-06-13T12:00:00.000Z")
    });

    const status = await runStatusCommand({
      repoRoot,
      changedFiles: ["docs/development/verification.md"],
      now: new Date("2026-06-13T12:05:00.000Z")
    });

    expect(status.output).toContain("Changed areas:");
    expect(status.output).toContain("- docs: docs/development/verification.md");
    expect(status.output).toContain("Verification Evidence:");
    expect(status.output).toContain("1 passed, 0 failed");
    expect(status.output).toContain("Review first:");
    expect(status.output).toContain("docs/development/verification.md");
    expect(status.output).toContain("Readiness: Ready for review");
    expect(status.output).toContain("Proof gaps:");
    expect(status.output).toContain("- none");
  });

  it("shows the latest snapshot in status", async () => {
    const repoRoot = await startedRepo([]);
    await runSnapshotCommand({
      repoRoot,
      note: "Initial implementation completed",
      now: new Date("2026-06-13T12:00:00.000Z"),
      git: {
        branch: "main",
        commit: "abc123",
        dirty: true,
        changedFiles: ["docs/development/verification.md"]
      }
    });

    const status = await runStatusCommand({
      repoRoot,
      changedFiles: ["docs/development/verification.md"],
      now: new Date("2026-06-13T12:05:00.000Z")
    });

    expect(status.output).toContain("Latest snapshot:");
    expect(status.output).toContain("Initial implementation completed");
    expect(status.output).toContain("Risk: low");
  });

  it("marks failed verification as blocked in status", async () => {
    const repoRoot = await startedRepo([`${process.execPath} -e "process.exit(4)"`]);
    await runVerifyCommand({
      repoRoot,
      commandArgs: [process.execPath, "-e", "process.exit(4)"],
      now: () => new Date("2026-06-13T12:00:00.000Z")
    });

    const status = await runStatusCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"],
      now: new Date("2026-06-13T12:05:00.000Z")
    });

    expect(status.output).toContain("1 failed");
    expect(status.output).toContain("Readiness: Blocked by failed verification");
    expect(status.output).toContain("A verification command failed");
    expect(status.output).toContain("Fix the failed command, then rerun agentflight verify --");
  });

  it("includes verification evidence and recommendation in report and replay", async () => {
    const command = `${process.execPath} -e "console.log('proof ok')"`;
    const repoRoot = await startedRepo([command]);
    await runVerifyCommand({
      repoRoot,
      commandArgs: [process.execPath, "-e", "console.log('proof ok')"],
      now: () => new Date("2026-06-13T12:00:00.000Z")
    });
    await runSnapshotCommand({
      repoRoot,
      note: "Ready for report",
      now: new Date("2026-06-13T12:02:00.000Z"),
      git: {
        branch: "main",
        commit: "abc123",
        dirty: true,
        changedFiles: ["src/auth/reset.ts"]
      }
    });

    const report = await runReportCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"]
    });
    const markdown = await readFile(report.reportPath, "utf8");
    expect(markdown).toContain("Needs verification");
    expect(markdown).toContain(command);
    expect(markdown).toContain(".agentflight/evidence/");
    expect(markdown).toContain("## Timeline");
    expect(markdown).toContain("## Review First");
    expect(markdown).toContain("## Proof Gaps");
    expect(markdown).toContain("## Review Readiness");
    expect(markdown).toContain("Session started");
    expect(markdown).toContain("Snapshot created");
    expect(markdown).toContain("Ready for report");
    expect(markdown).toContain("Verification passed");
    expect(markdown).toContain("Report generated");
    expect(markdown).toContain("1. src/auth/reset.ts");
    expect(markdown).toContain("identity/session path");
    expect(markdown).toContain("Sensitive auth, payment, or security files changed");
    expect(markdown).not.toContain("Generate a report and");

    const replay = await runReplayCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"]
    });
    const html = await readFile(replay.replayPath, "utf8");
    expect(html).toContain("summary-grid");
    expect(html).toContain("timeline");
    expect(html).toContain("Ready for report");
    expect(html).toContain("Changed File Groups");
    expect(html).toContain("1 passed / 0 failed");
    expect(html).toContain("Needs verification");
    expect(html).toContain("Review Focus");
    expect(html).toContain("Proof Gaps");
    expect(html).toContain("Evidence files");
    expect(html).toContain("passed");
    expect(html).toContain("Generated by AgentFlight");
    expect(html).not.toContain("Generate a report and");
    expect(html).not.toMatch(/https?:\/\//);
  });

  it("uses handoff-focused next actions in resume when proof is complete", async () => {
    const command = `${process.execPath} -e "console.log('proof ok')"`;
    const repoRoot = await startedRepo([command]);
    await runVerifyCommand({
      repoRoot,
      commandArgs: [process.execPath, "-e", "console.log('proof ok')"],
      now: () => new Date("2026-06-13T12:00:00.000Z")
    });
    await runSnapshotCommand({
      repoRoot,
      note: "Ready to hand off",
      now: new Date("2026-06-13T12:02:00.000Z"),
      git: {
        branch: "main",
        commit: "abc123",
        dirty: true,
        changedFiles: ["docs/development/verification.md"]
      }
    });

    const resume = await runResumeCommand({
      repoRoot,
      changedFiles: ["docs/development/verification.md"]
    });

    expect(resume.output).toContain("Latest Snapshot");
    expect(resume.output).toContain("Ready to hand off");
    expect(resume.output).toContain("Verification State");
    expect(resume.output).toContain("1 passed, 0 failed");
    expect(resume.output).toContain("Review Focus");
    expect(resume.output).toContain("Use the generated report or replay");
    expect(resume.output).not.toContain("Generate a report and");
  });

  it("includes verification gaps and the exact next command in resume prompts", async () => {
    const repoRoot = await startedRepo(["npm test"]);

    const resume = await runResumeCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"]
    });

    expect(resume.output).toContain("Proof Gaps");
    expect(resume.output).toContain("Review Focus");
    expect(resume.output).toContain("npm test");
    expect(resume.output).toContain("Stay scoped to the current task.");
    expect(resume.output).toContain("Do not claim completion without proof.");
    expect(resume.output).toContain("Run relevant verification before declaring success.");
  });

  it("excludes AgentFlight runtime artifacts from status, report, replay, and resume changed files", async () => {
    const repoRoot = await startedRepo([]);
    const changedFiles = [
      ".agentflight/current/session.json",
      ".agentflight/evidence/af-test/verification-1.stdout.txt",
      ".agentflight/reports/af-test-proof.md",
      ".agentflight/sessions/af-test.json",
      ".agentflight/config.json",
      "src/auth/reset.ts"
    ];

    const status = await runStatusCommand({
      repoRoot,
      changedFiles
    });
    expect(status.output).toContain("Changed files:\n2");
    expect(status.output).toContain(".agentflight/config.json");
    expect(status.output).toContain("src/auth/reset.ts");
    expect(status.output).not.toContain(".agentflight/current/session.json");
    expect(status.output).not.toContain(".agentflight/evidence/");
    expect(status.output).not.toContain(".agentflight/reports/");
    expect(status.output).not.toContain(".agentflight/sessions/");

    const report = await runReportCommand({
      repoRoot,
      changedFiles
    });
    const markdown = await readFile(report.reportPath, "utf8");
    expect(markdown).toContain(".agentflight/config.json");
    expect(markdown).toContain("src/auth/reset.ts");
    expect(markdown).not.toContain(".agentflight/current/session.json");
    expect(markdown).not.toContain(".agentflight/evidence/");
    expect(markdown).not.toContain(".agentflight/reports/");
    expect(markdown).not.toContain(".agentflight/sessions/");

    const replay = await runReplayCommand({
      repoRoot,
      changedFiles
    });
    const html = await readFile(replay.replayPath, "utf8");
    expect(html).toContain(".agentflight/config.json");
    expect(html).toContain("src/auth/reset.ts");
    expect(html).not.toContain(".agentflight/current/session.json");
    expect(html).not.toContain(".agentflight/evidence/");
    expect(html).not.toContain(".agentflight/reports/");
    expect(html).not.toContain(".agentflight/sessions/");

    const resume = await runResumeCommand({
      repoRoot,
      changedFiles
    });
    expect(resume.output).toContain(".agentflight/config.json");
    expect(resume.output).toContain("src/auth/reset.ts");
    expect(resume.output).not.toContain(".agentflight/current/session.json");
    expect(resume.output).not.toContain(".agentflight/evidence/");
    expect(resume.output).not.toContain(".agentflight/reports/");
    expect(resume.output).not.toContain(".agentflight/sessions/");
  });

  it("applies configured generated-file filters in status, report, replay, resume, and snapshot", async () => {
    const repoRoot = await startedRepo([]);
    const configPath = join(repoRoot, ".agentflight", "config.json");
    const config = JSON.parse(await readFile(configPath, "utf8"));
    config.changedFileFilters = { ignore: [".projscan-memory/**"] };
    await writeFile(configPath, JSON.stringify(config, null, 2));
    const changedFiles = [".projscan-memory/memory.json", "src/auth/reset.ts"];

    const status = await runStatusCommand({ repoRoot, changedFiles });
    expect(status.output).toContain("Changed files:\n1");
    expect(status.output).toContain("src/auth/reset.ts");
    expect(status.output).not.toContain(".projscan-memory");

    const report = await runReportCommand({ repoRoot, changedFiles });
    await expect(readFile(report.reportPath, "utf8")).resolves.not.toContain(".projscan-memory");

    const replay = await runReplayCommand({ repoRoot, changedFiles });
    await expect(readFile(replay.replayPath, "utf8")).resolves.not.toContain(".projscan-memory");

    const resume = await runResumeCommand({ repoRoot, changedFiles });
    expect(resume.output).not.toContain(".projscan-memory");

    const snapshot = await runSnapshotCommand({
      repoRoot,
      git: {
        branch: "main",
        commit: "abc123",
        dirty: true,
        changedFiles
      }
    });
    expect(snapshot.output).toContain("Changed files: 1");
  });

  it("surfaces incomplete verification consistently and removes legacy report gap conflicts", async () => {
    const repoRoot = await startedRepo(["npm test"]);
    const currentSessionPath = join(repoRoot, ".agentflight", "current", "session.json");
    const session = JSON.parse(await readFile(currentSessionPath, "utf8"));
    session.events.push({
      id: "evt-incomplete-verification",
      type: "verification_started",
      timestamp: "2026-06-13T12:00:00.000Z",
      title: "Verification started",
      metadata: { command: "npm test" }
    });
    await writeFile(currentSessionPath, JSON.stringify(session, null, 2));

    const status = await runStatusCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"]
    });
    expect(status.output).toContain("Readiness: Needs verification");
    expect(status.output).toContain(
      "Verification was started but no completed result was recorded"
    );
    expect(status.output).toContain("agentflight verify -- npm test");

    const report = await runReportCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"]
    });
    const markdown = await readFile(report.reportPath, "utf8");
    expect(markdown).toContain("Verification was started but no completed result was recorded");
    expect(markdown).toContain("agentflight verify -- npm test");
    expect(markdown).not.toContain("Missing passing verification evidence for");

    const replay = await runReplayCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"]
    });
    await expect(readFile(replay.replayPath, "utf8")).resolves.toContain(
      "Verification was started but no completed result was recorded"
    );

    const resume = await runResumeCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"]
    });
    expect(resume.output).toContain(
      "Verification was started but no completed result was recorded"
    );
    expect(resume.output).toContain("agentflight verify -- npm test");
  });

  it("suggests a ProjScan memory ignore pattern without filtering it by default", async () => {
    const repoRoot = await startedRepo([]);
    const changedFiles = [".projscan-memory/memory.json", "README.md"];

    const status = await runStatusCommand({ repoRoot, changedFiles });
    expect(status.output).toContain(".projscan-memory/memory.json");
    expect(status.output).toContain(".projscan-memory/**");
    expect(status.output).toContain("changedFileFilters.ignore");

    const report = await runReportCommand({ repoRoot, changedFiles });
    const markdown = await readFile(report.reportPath, "utf8");
    expect(markdown).toContain(".projscan-memory/memory.json");
    expect(markdown).toContain(".projscan-memory/**");
    expect(markdown).toContain("changedFileFilters.ignore");

    const resume = await runResumeCommand({ repoRoot, changedFiles });
    expect(resume.output).toContain(".projscan-memory/memory.json");
    expect(resume.output).toContain(".projscan-memory/**");
    expect(resume.output).toContain("changedFileFilters.ignore");
  });

  it("keeps status, report, replay, and resume compatible with older session shapes", async () => {
    const repoRoot = await createTempRepo();
    await initAgentFlight({ repoRoot, now: new Date("2026-06-13T11:00:00.000Z") });

    for (const session of legacySessions(repoRoot)) {
      await writeFile(
        join(repoRoot, ".agentflight", "current", "session.json"),
        JSON.stringify(session, null, 2)
      );

      const status = await runStatusCommand({
        repoRoot,
        changedFiles: ["src/auth/reset.ts"]
      });
      expect(status.output).toContain(session.task.title);
      expect(status.output).toContain("Review first:");

      const report = await runReportCommand({
        repoRoot,
        changedFiles: ["src/auth/reset.ts"]
      });
      await expect(readFile(report.reportPath, "utf8")).resolves.toContain("## Review First");

      const replay = await runReplayCommand({
        repoRoot,
        changedFiles: ["src/auth/reset.ts"]
      });
      await expect(readFile(replay.replayPath, "utf8")).resolves.toContain("Review Focus");

      const resume = await runResumeCommand({
        repoRoot,
        changedFiles: ["src/auth/reset.ts"]
      });
      expect(resume.output).toContain("Review Focus");
    }
  });
});

async function startedRepo(verificationCommands: string[]): Promise<string> {
  const repoRoot = await createTempRepo();
  await initAgentFlight({ repoRoot, now: new Date("2026-06-13T11:00:00.000Z") });
  await startSession({
    repoRoot,
    task: "Capture verification",
    now: new Date("2026-06-13T11:30:00.000Z"),
    git: { branch: "main", commit: "abc123", dirty: false, changedFiles: [] },
    packageManager: "npm",
    verificationCommands,
    tools: {
      projscan: { available: true, warnings: [] },
      agentloopkit: { available: true, warnings: [] }
    }
  });
  return repoRoot;
}

function legacySessions(repoRoot: string): Array<{
  id: string;
  task: { title: string };
  [key: string]: unknown;
}> {
  const base = {
    startedAt: "2026-06-13T12:00:00.000Z",
    repoRoot,
    git: { branch: "main", commit: "abc123", dirty: true, changedFiles: ["src/auth/reset.ts"] },
    packageManager: "npm",
    verificationCommands: ["npm test"],
    tools: {
      projscan: { available: false, warnings: [] },
      agentloopkit: { available: false, warnings: [] }
    }
  };
  const passedRun = {
    command: "npm test",
    startedAt: "2026-06-13T12:01:00.000Z",
    finishedAt: "2026-06-13T12:01:05.000Z",
    durationMs: 5000,
    exitCode: 0,
    status: "passed",
    stdoutPath: ".agentflight/evidence/af-legacy/verification-1.stdout.txt",
    stderrPath: ".agentflight/evidence/af-legacy/verification-1.stderr.txt"
  };

  return [
    {
      ...base,
      id: "af-v0-1",
      task: { title: "v0.1 legacy session" }
    },
    {
      ...base,
      id: "af-v0-2",
      task: { title: "v0.2 legacy session" },
      verificationRuns: [passedRun]
    },
    {
      ...base,
      id: "af-v0-3",
      task: { title: "v0.3 legacy session" },
      verificationRuns: [passedRun],
      events: [
        {
          id: "evt-20260613-120000-session-started-001",
          type: "session_started",
          timestamp: "2026-06-13T12:00:00.000Z",
          title: "Session started"
        },
        {
          id: "evt-20260613-120100-snapshot-created-002",
          type: "snapshot_created",
          timestamp: "2026-06-13T12:01:00.000Z",
          title: "Snapshot created",
          message: "Legacy snapshot",
          metadata: {
            risk: { level: "high", changedFiles: 1 },
            review: {
              readiness: "ready_for_review",
              topFocusFiles: ["src/auth/reset.ts"],
              proofGapCount: 0
            }
          }
        }
      ]
    }
  ];
}
