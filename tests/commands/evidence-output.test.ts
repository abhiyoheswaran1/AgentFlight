import { readFile } from "node:fs/promises";
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
      changedFiles: ["src/auth/reset.ts"],
      now: new Date("2026-06-13T12:05:00.000Z")
    });

    expect(status.output).toContain("Changed areas:");
    expect(status.output).toContain("- auth: src/auth/reset.ts");
    expect(status.output).toContain("Verification Evidence:");
    expect(status.output).toContain("1 passed, 0 failed");
    expect(status.output).toContain("Review readiness: Ready for review");
    expect(status.output).toContain("Proof missing:");
    expect(status.output).toContain("No configured verification gaps.");
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
    expect(status.output).toContain("Review readiness: Blocked");
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
    expect(markdown).toContain("Ready for review");
    expect(markdown).toContain(command);
    expect(markdown).toContain(".agentflight/evidence/");
    expect(markdown).toContain("## Timeline");
    expect(markdown).toContain("Session started");
    expect(markdown).toContain("Snapshot created");
    expect(markdown).toContain("Ready for report");
    expect(markdown).toContain("Verification passed");
    expect(markdown).toContain("Report generated");
    expect(markdown).toContain("- auth: src/auth/reset.ts");
    expect(markdown).toContain("Share this report with the reviewer");
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
    expect(html).toContain("Ready for review");
    expect(html).toContain("verification-card");
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
    expect(resume.output).toContain("Use the generated report or replay");
    expect(resume.output).not.toContain("Generate a report and");
  });

  it("includes verification gaps and the exact next command in resume prompts", async () => {
    const repoRoot = await startedRepo(["npm test"]);

    const resume = await runResumeCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"]
    });

    expect(resume.output).toContain("Verification Gaps");
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
