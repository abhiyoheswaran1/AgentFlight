import { mkdir, readFile, writeFile } from "node:fs/promises";
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
import { inspectStartTools, runStartCommand } from "../../src/commands/start.js";
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
      now: new Date("2026-06-13T12:00:00.000Z"),
      tools: {
        projscan: { available: true, version: "4.5.0", warnings: [] },
        agentloopkit: { available: true, version: "0.35.2", warnings: [] }
      }
    });
    expect(init.output).toContain("AgentFlight initialized");
    expect(init.output).toContain("Created files:\n- .agentflight/config.json");
    expect(init.output).toContain("- .agentflight/.gitignore");
    expect(init.output).toContain("Skipped existing files:\n- none");
    expect(init.output).toContain("ProjScan: available 4.5.0");
    expect(init.output).toContain("AgentLoopKit: available 0.35.2");
    expect(init.output).toContain(".agentflight/config.json is project config");
    expect(init.output).toContain(".agentflight/sessions/, reports/, evidence/, current/");
    expect(init.output).toContain(".agentflight/.gitignore keeps runtime evidence out of git");
    expect(init.output).toContain(".projscan-memory/**");
    expect(init.output).toContain("changedFileFilters.ignore");
    expect(init.output).toContain(`Primary workflow:
agentflight start --task "Describe the work"
agentflight verify
agentflight handoff`);
    expect(init.output).not.toContain("agentflight verify -- npm run typecheck");
    expect(init.output).not.toContain("agentflight verify -- npm test");
    expect(init.output).toContain(`Supporting checks:
agentflight status
agentflight doctor`);
    expect(
      JSON.parse(await readFile(join(repoRoot, ".agentflight", "config.json"), "utf8")).verification
        .commands
    ).toEqual(["npm run typecheck", "npm run lint", "npm test", "npm run build"]);

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
    expect(start.output).toContain("AgentLoopKit: available 0.28.7 (active task linked)");
    expect(start.output).toContain("Handoff saved:\n.agentflight/current/handoff.md");
    expect(start.output).not.toContain(repoRoot);

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
    expect(report.output).not.toContain(repoRoot);
    expect(report.reportPath).toContain(repoRoot);
    await expect(readFile(report.reportPath, "utf8")).resolves.toContain(
      "# AgentFlight Proof Report"
    );

    const replay = await runReplayCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"]
    });
    expect(replay.output).toContain("Replay generated");
    expect(replay.output).not.toContain(repoRoot);
    expect(replay.replayPath).toContain(repoRoot);
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
    expect(handoff.output).not.toContain(repoRoot);
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
    expect(doctor.output).not.toContain(repoRoot);
  });

  it("lists skipped files on repeated init", async () => {
    const repoRoot = await createTempRepo();
    const tools = {
      projscan: { available: true, version: "4.5.0", warnings: [] },
      agentloopkit: { available: true, version: "0.35.2", warnings: [] }
    };

    await runInitCommand({
      repoRoot,
      now: new Date("2026-06-13T12:00:00.000Z"),
      tools
    });
    const second = await runInitCommand({
      repoRoot,
      now: new Date("2026-06-13T12:01:00.000Z"),
      tools
    });

    expect(second.output).toContain("Created files:\n- none");
    expect(second.output).toContain("Skipped existing files:\n- .agentflight/config.json");
    expect(second.output).toContain("- .agentflight/.gitignore");
  });

  it("uses a clear init verification placeholder when no proof command is detected", async () => {
    const repoRoot = await createTempRepo();
    await writeFile(
      join(repoRoot, "package.json"),
      JSON.stringify(
        {
          scripts: {
            dev: "vite"
          }
        },
        null,
        2
      )
    );

    const init = await runInitCommand({
      repoRoot,
      now: new Date("2026-06-13T12:00:00.000Z"),
      tools: {
        projscan: { available: false, warnings: ["ProjScan unavailable: command not found"] },
        agentloopkit: {
          available: false,
          warnings: ["AgentLoopKit unavailable: command not found"]
        }
      }
    });

    expect(init.output).toContain(`Primary workflow:
agentflight start --task "Describe the work"
agentflight verify -- <proof command>
agentflight handoff`);
    expect(init.output).not.toContain("agentflight verify -- npm test");
    expect(
      JSON.parse(await readFile(join(repoRoot, ".agentflight", "config.json"), "utf8")).verification
        .commands
    ).toEqual([]);
  });

  it("uses detected proof guidance for idempotent init when existing config commands are empty", async () => {
    const repoRoot = await createTempRepo();
    await writeFile(
      join(repoRoot, "package.json"),
      JSON.stringify(
        {
          scripts: {
            typecheck: "tsc --noEmit",
            test: "vitest run"
          }
        },
        null,
        2
      )
    );
    const tools = {
      projscan: { available: true, version: "4.5.0", warnings: [] },
      agentloopkit: { available: true, version: "0.35.2", warnings: [] }
    };

    await runInitCommand({
      repoRoot,
      now: new Date("2026-06-13T12:00:00.000Z"),
      tools
    });
    const configPath = join(repoRoot, ".agentflight", "config.json");
    const config = JSON.parse(await readFile(configPath, "utf8")) as {
      verification: { commands: string[] };
    };
    config.verification.commands = [];
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);

    const init = await runInitCommand({
      repoRoot,
      now: new Date("2026-06-13T12:01:00.000Z"),
      tools
    });

    expect(init.output).toContain(`Primary workflow:
agentflight start --task "Describe the work"
agentflight verify -- npm run typecheck
agentflight handoff`);
    expect(init.output).not.toContain("agentflight verify -- <proof command>");
    expect(JSON.parse(await readFile(configPath, "utf8")).verification.commands).toEqual([]);
  });

  it("doctors a healthy initialized repo before the first session as OK guidance", async () => {
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
    await runInitCommand({
      repoRoot,
      now: new Date("2026-06-13T12:00:00.000Z"),
      tools: {
        projscan: { available: true, version: "4.5.0", warnings: [] },
        agentloopkit: { available: true, version: "0.35.2", warnings: [] }
      }
    });

    const doctor = await runDoctorCommand({
      repoRoot,
      nodeVersion: "v20.11.0",
      npmVersion: "10.5.0",
      gitAvailable: true,
      packageManager: "npm",
      projscanAvailable: true,
      agentloopkitAvailable: true
    });

    expect(doctor.output).toContain("Overall: OK");
    expect(doctor.output).toContain("OK current session");
    expect(doctor.output).toContain("Run agentflight start --task");
  });

  it("warns when package proof scripts exist but verification config is empty", async () => {
    const repoRoot = await createTempRepo();
    await writeFile(
      join(repoRoot, "package.json"),
      JSON.stringify(
        {
          scripts: {
            test: "vitest run",
            typecheck: "tsc --noEmit"
          }
        },
        null,
        2
      )
    );
    await runInitCommand({
      repoRoot,
      now: new Date("2026-06-13T12:00:00.000Z")
    });

    const configPath = join(repoRoot, ".agentflight", "config.json");
    const config = JSON.parse(await readFile(configPath, "utf8")) as {
      verification: { commands: string[] };
    };
    config.verification.commands = [];
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);

    const doctor = await runDoctorCommand({
      repoRoot,
      nodeVersion: "v20.11.0",
      npmVersion: "10.5.0",
      gitAvailable: true,
      packageManager: "npm",
      projscanAvailable: true,
      agentloopkitAvailable: true
    });

    expect(doctor.output).toContain("Warning verification commands");
    expect(doctor.output).toContain(
      ".agentflight/config.json has no configured verification commands"
    );
    expect(doctor.output).toContain("agentflight verify -- npm run typecheck");
    expect(doctor.output).toContain("agentflight verify -- npm test");
    expect(doctor.output).not.toContain("agentflight verify -- <command>");
    expect(doctor.output).not.toContain(repoRoot);
  });

  it("guides first-run users when generated ProjScan memory is present", async () => {
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
    await runInitCommand({
      repoRoot,
      now: new Date("2026-06-13T12:00:00.000Z")
    });
    await mkdir(join(repoRoot, ".projscan-memory"), { recursive: true });
    await writeFile(join(repoRoot, ".projscan-memory", "memory.json"), "{}\n");

    const visible = await runDoctorCommand({
      repoRoot,
      nodeVersion: "v20.11.0",
      npmVersion: "10.5.0",
      gitAvailable: true,
      packageManager: "npm",
      projscanAvailable: true,
      agentloopkitAvailable: true
    });
    expect(visible.output).toContain("Warning generated tool state");
    expect(visible.output).toContain(".projscan-memory/memory.json is present");
    expect(visible.output).toContain('add ".projscan-memory/**"');
    expect(visible.output).toContain("changedFileFilters.ignore");

    const configPath = join(repoRoot, ".agentflight", "config.json");
    const config = JSON.parse(await readFile(configPath, "utf8")) as {
      changedFileFilters: { ignore: string[] };
    };
    config.changedFileFilters.ignore = [".projscan-memory/**"];
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);

    const filtered = await runDoctorCommand({
      repoRoot,
      nodeVersion: "v20.11.0",
      npmVersion: "10.5.0",
      gitAvailable: true,
      packageManager: "npm",
      projscanAvailable: true,
      agentloopkitAvailable: true
    });
    expect(filtered.output).toContain("OK generated tool state");
    expect(filtered.output).toContain(".projscan-memory/memory.json is filtered");
  });

  it("summarizes unavailable init tools with the same guidance as start/report surfaces", async () => {
    const repoRoot = await createTempRepo();

    const init = await runInitCommand({
      repoRoot,
      now: new Date("2026-06-13T12:00:00.000Z"),
      tools: {
        projscan: {
          available: false,
          warnings: ["ProjScan unavailable: command not found"]
        },
        agentloopkit: {
          available: false,
          warnings: ["AgentLoopKit unavailable: command not found"]
        }
      }
    });

    expect(init.output).toContain(
      "ProjScan: unavailable (ProjScan unavailable; run npx projscan@latest doctor for details.)"
    );
    expect(init.output).toContain(
      "AgentLoopKit: unavailable (AgentLoopKit unavailable; run npx agentloopkit@latest doctor for details.)"
    );
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

  it("shows concise tool warnings during start", async () => {
    const repoRoot = await createTempRepo();
    await runInitCommand({
      repoRoot,
      now: new Date("2026-06-13T12:00:00.000Z")
    });

    const start = await runStartCommand({
      repoRoot,
      task: "Inspect optional tooling",
      now: new Date("2026-06-13T12:10:00.000Z"),
      git: {
        branch: "main",
        commit: "abc123",
        dirty: false,
        changedFiles: []
      },
      packageManager: "npm",
      tools: {
        projscan: {
          available: true,
          version: "4.3.1",
          warnings: [
            "ProjScan baseline skipped: timed out while collecting a very long diagnostic that should stay out of the terminal"
          ]
        },
        agentloopkit: {
          available: true,
          version: "0.28.7",
          taskLinked: false,
          warnings: ["AgentLoopKit task link check failed: detailed status output"]
        }
      }
    });

    expect(start.output).toContain(
      "ProjScan: available 4.3.1 (ProjScan baseline skipped; run projscan start for details.)"
    );
    expect(start.output).toContain(
      "AgentLoopKit: available 0.28.7 (no active task linked; AgentLoopKit task link check needs attention; run agentloopkit status for details.)"
    );
    expect(start.output).not.toContain("very long diagnostic");
    expect(start.output).not.toContain("detailed status output");
    expect(start.output).not.toContain("task creation failed");
  });

  it("inspects start tooling without the heavy ProjScan baseline", async () => {
    const calls: string[] = [];

    const tools = await inspectStartTools("/repo", "Reuse active task", {
      inspectProjScan: async () => {
        calls.push("inspect-projscan");
        return {
          available: true,
          version: "4.5.0",
          summary: "ProjScan available for repo intelligence and risk analysis.",
          warnings: []
        };
      },
      inspectAgentLoopKit: async (options) => {
        calls.push(`inspect-agentloopkit:${String(options?.includeDoctor)}`);
        return {
          available: true,
          version: "0.35.2",
          summary: "AgentLoopKit available for task discipline.",
          warnings: []
        };
      },
      linkAgentLoopTask: async () => {
        calls.push("link-agentloop-task");
        return {
          available: true,
          taskLinked: true,
          summary: "Using active AgentLoopKit task.",
          warnings: []
        };
      }
    });

    expect(calls).toEqual([
      "inspect-projscan",
      "inspect-agentloopkit:false",
      "link-agentloop-task"
    ]);
    expect(tools.projscan).toMatchObject({
      available: true,
      version: "4.5.0",
      warnings: []
    });
    expect(tools.agentloopkit).toMatchObject({
      available: true,
      version: "0.35.2",
      taskLinked: true
    });
  });
});
