import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTempRepo } from "../helpers/temp.js";
import { runDoctorCommand } from "../../src/commands/doctor.js";
import { runHandoffCommand } from "../../src/commands/handoff.js";
import { runInitCommand } from "../../src/commands/init.js";
import { runReplayCommand } from "../../src/commands/replay.js";
import { runReportCommand } from "../../src/commands/report.js";
import { runResumeCommand } from "../../src/commands/resume.js";
import { runSnapshotCommand } from "../../src/commands/snapshot.js";
import { runStartCommand } from "../../src/commands/start.js";
import { runStatusCommand } from "../../src/commands/status.js";

describe("AgentFlight command workflow", () => {
  it("initialises, starts, reports, replays, resumes, and doctors a local session", async () => {
    const repoRoot = await createTempRepo();
    await writeFile(
      join(repoRoot, "package.json"),
      JSON.stringify(
        {
          scripts: {
            test: "vitest run",
            build: "tsc -p tsconfig.build.json",
            typecheck: "tsc --noEmit",
            lint: "eslint ."
          }
        },
        null,
        2
      )
    );

    const init = await runInitCommand({
      repoRoot,
      now: new Date("2026-06-13T12:00:00.000Z")
    });
    expect(init.output).toContain("AgentFlight initialized");
    expect(init.output).toContain(".agentflight/config.json is project config");
    expect(init.output).toContain(".agentflight/sessions/, reports/, evidence/, current/");
    expect(init.output).toContain(".projscan-memory/**");
    expect(init.output).toContain("changedFileFilters.ignore");

    const start = await runStartCommand({
      repoRoot,
      task: "Add password reset flow",
      now: new Date("2026-06-13T12:10:00.000Z"),
      git: {
        branch: "main",
        commit: "abc123",
        dirty: true,
        changedFiles: ["src/auth/reset.ts"]
      },
      packageManager: "npm",
      tools: {
        projscan: { available: true, version: "4.3.1", warnings: [] },
        agentloopkit: { available: true, version: "0.28.7", taskLinked: true, warnings: [] }
      }
    });
    expect(start.output).toContain("AgentFlight started");
    expect(start.output).toContain("ProjScan: available");

    const status = await runStatusCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"],
      now: new Date("2026-06-13T12:20:00.000Z")
    });
    expect(status.output).toContain("Risk: high");
    expect(status.output).toContain("Next action");

    const report = await runReportCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"]
    });
    expect(report.output).toContain(".agentflight/reports/");
    await expect(readFile(report.reportPath, "utf8")).resolves.toContain(
      "# AgentFlight Proof Report"
    );

    const replay = await runReplayCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"]
    });
    expect(replay.output).toContain("Replay generated");
    await expect(readFile(replay.replayPath, "utf8")).resolves.toContain("<!doctype html>");

    const resume = await runResumeCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"]
    });
    expect(resume.output).toContain("Continue this AgentFlight-recorded coding session safely.");
    await expect(
      readFile(join(repoRoot, ".agentflight", "current", "resume-prompt.md"), "utf8")
    ).resolves.toContain("Do not start unrelated work.");

    const handoff = await runHandoffCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"]
    });
    expect(handoff.output).toContain("AgentFlight handoff");
    expect(handoff.output).toContain("Artifacts:");
    expect(handoff.output).toContain(
      "Local only: no upload, no telemetry, no automatic PR comment."
    );
    await expect(
      readFile(join(repoRoot, ".agentflight", "current", "handoff.md"), "utf8")
    ).resolves.toContain("AgentFlight handoff");

    const doctor = await runDoctorCommand({
      repoRoot,
      nodeVersion: "v20.11.0",
      npmVersion: "10.5.0",
      gitAvailable: true,
      packageManager: "npm",
      projscanAvailable: true,
      agentloopkitAvailable: true
    });
    expect(doctor.output).toContain("AgentFlight Doctor");
    expect(doctor.output).toContain("OK");
  });

  it("uses a helpful error when a command requires an active session", async () => {
    const repoRoot = await createTempRepo();
    await runInitCommand({
      repoRoot,
      now: new Date("2026-06-13T12:00:00.000Z")
    });

    await expect(runStatusCommand({ repoRoot })).rejects.toThrow(
      "No active AgentFlight session. Run agentflight start --task"
    );
    await expect(runSnapshotCommand({ repoRoot })).rejects.toThrow(
      "No active AgentFlight session. Run agentflight start --task"
    );
  });
});
