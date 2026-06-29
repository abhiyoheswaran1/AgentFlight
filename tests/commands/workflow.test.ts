import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTempRepo } from "../helpers/temp.js";
import { runDoctorCommand } from "../../src/commands/doctor.js";
import { runGuardCommand } from "../../src/commands/guard.js";
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
    expect(start.output).toContain(`Suggested proof:
agentflight verify
Configured commands:
- npm run typecheck
- npm run lint
- npm test
- npm run build`);
    expect(start.output).not.toContain(`Suggested proof:
npm run typecheck`);
    expect(start.output).toContain("Handoff saved:\n.agentflight/current/handoff.md");
    expect(start.output).not.toContain("\n\n\nDetected:");
    expect(start.output).not.toContain(repoRoot);

    const status = await runStatusCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"],
      now: new Date("2026-06-13T12:20:00.000Z")
    });
    expect(status.output).toContain("Risk: high");
    expect(status.output).toContain("Trust delta:");
    expect(status.output).toContain("Trust changed because proof is stale or missing.");
    expect(status.output).toContain("Review queue:");
    expect(status.output).toContain("Run missing proof");
    expect(status.output).toContain("Review routing:");
    expect(status.output).toContain("Verification - blocked");
    expect(status.output).toContain("Next action");

    const statusJson = await runStatusCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"],
      now: new Date("2026-06-13T12:20:00.000Z"),
      format: "json"
    });
    const parsedStatus = JSON.parse(statusJson.output);
    expect(parsedStatus.review.trustDelta.summary).toBe(
      "Trust changed because proof is stale or missing."
    );
    expect(parsedStatus.review.reviewQueue[0]).toMatchObject({
      action: "run_missing_proof",
      suggestedCommand: "npm test"
    });
    expect(parsedStatus.review.reviewRoutes.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "verification",
          status: "blocked",
          suggestedCommand: "npm test"
        }),
        expect.objectContaining({
          role: "security",
          status: "blocked",
          relatedFiles: ["src/auth/reset.ts"]
        })
      ])
    );

    const guard = await runGuardCommand({
      repoRoot,
      once: true,
      changedFiles: ["src/auth/reset.ts"],
      now: new Date("2026-06-13T12:21:00.000Z")
    });
    expect(guard.output).toContain("AgentFlight guard");
    expect(guard.output).toContain("Trust state:");
    expect(guard.output).toContain("Finish targets:");
    expect(guard.output).toContain("Next action:");
    expect(guard.output).not.toContain(repoRoot);

    const report = await runReportCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"]
    });
    expect(report.output).toContain(".agentflight/reports/");
    expect(report.output).not.toContain(repoRoot);
    expect(report.reportPath).toContain(repoRoot);
    const reportMarkdown = await readFile(report.reportPath, "utf8");
    expect(reportMarkdown).toContain("# AgentFlight Proof Report");
    expect(reportMarkdown).toContain("## Review Routing");

    const replay = await runReplayCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"]
    });
    expect(replay.output).toContain("Replay generated");
    expect(replay.output).not.toContain(repoRoot);
    expect(replay.replayPath).toContain(repoRoot);
    const replayHtml = await readFile(replay.replayPath, "utf8");
    expect(replayHtml).toContain("<!doctype html>");
    expect(replayHtml).toContain('id="review-routes"');

    const resume = await runResumeCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"]
    });
    expect(resume.output).toContain("Continue this AgentFlight-recorded coding session safely.");
    expect(resume.output).toContain("## Review Routing");
    await expect(
      readFile(join(repoRoot, ".agentflight", "current", "resume-prompt.md"), "utf8")
    ).resolves.toContain("Do not start unrelated work.");

    const handoff = await runHandoffCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"]
    });
    expect(handoff.output).toContain("AgentFlight handoff");
    expect(handoff.output).toContain("Trust delta:");
    expect(handoff.output).toContain("Review queue:");
    expect(handoff.output).toContain("Review routing:");
    expect(handoff.output).toContain("Verification - blocked");
    expect(handoff.output).toContain("Run missing proof");
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

  it("records a local review receipt from handoff and marks it stale after later changes", async () => {
    const repoRoot = await createTempRepo();
    await runInitCommand({
      repoRoot,
      now: new Date("2026-06-13T12:00:00.000Z"),
      tools: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });
    await runStartCommand({
      repoRoot,
      task: "Update docs",
      now: new Date("2026-06-13T12:10:00.000Z"),
      git: {
        branch: "main",
        commit: "abc123",
        dirty: true,
        changedFiles: ["README.md"]
      },
      packageManager: "npm",
      tools: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });

    const accepted = await runHandoffCommand({
      repoRoot,
      changedFiles: ["README.md"],
      now: new Date("2026-06-13T12:20:00.000Z"),
      accept: true
    });

    expect(accepted.exitCode).toBe(0);
    expect(accepted.output).toContain("Review receipt:");
    expect(accepted.output).toContain("Review receipt current");
    const session = JSON.parse(
      await readFile(join(repoRoot, ".agentflight", "current", "session.json"), "utf8")
    );
    expect(session.reviewReceipts).toHaveLength(1);
    expect(session.reviewReceipts[0]).toMatchObject({
      decision: "accepted",
      snapshot: {
        changedFiles: ["README.md"],
        readinessState: "ready_for_review"
      }
    });

    const currentStatus = await runStatusCommand({
      repoRoot,
      changedFiles: ["README.md"],
      now: new Date("2026-06-13T12:21:00.000Z")
    });
    expect(currentStatus.output).toContain("Review receipt current");

    const staleStatus = await runStatusCommand({
      repoRoot,
      changedFiles: ["README.md", "docs/new-guide.md"],
      now: new Date("2026-06-13T12:22:00.000Z"),
      format: "json"
    });
    const parsed = JSON.parse(staleStatus.output);
    expect(parsed.review.reviewReceipt).toMatchObject({
      state: "stale",
      staleFiles: ["docs/new-guide.md"]
    });
    expect(parsed.review.trustDelta.items[0]).toMatchObject({
      kind: "stale_receipt",
      relatedFiles: ["docs/new-guide.md"]
    });
    expect(parsed.review.reviewQueue[0]).toMatchObject({
      action: "refresh_review_receipt",
      label: "Refresh stale review receipt"
    });
  });

  it("explains when handoff accept cannot record a receipt", async () => {
    const repoRoot = await createTempRepo();
    await runInitCommand({
      repoRoot,
      now: new Date("2026-06-13T12:00:00.000Z"),
      tools: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });
    await runStartCommand({
      repoRoot,
      task: "Update auth flow",
      now: new Date("2026-06-13T12:10:00.000Z"),
      git: {
        branch: "main",
        commit: "abc123",
        dirty: true,
        changedFiles: ["src/auth/session.ts"]
      },
      packageManager: "npm",
      tools: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });

    const handoff = await runHandoffCommand({
      repoRoot,
      changedFiles: ["src/auth/session.ts"],
      now: new Date("2026-06-13T12:20:00.000Z"),
      accept: true
    });

    expect(handoff.exitCode).toBe(1);
    expect(handoff.output).toContain("Review receipt not recorded:");
    expect(handoff.output).toContain("current readiness is Needs verification");
    const session = JSON.parse(
      await readFile(join(repoRoot, ".agentflight", "current", "session.json"), "utf8")
    );
    expect(session.reviewReceipts ?? []).toEqual([]);
  });

  it("keeps full long suggested proof commands recoverable in status and handoff", async () => {
    const repoRoot = await createTempRepo();
    await mkdir(join(repoRoot, "src", "auth"), { recursive: true });
    await writeFile(join(repoRoot, "src", "auth", "session.ts"), "export const touched = true;\n");
    await runInitCommand({
      repoRoot,
      now: new Date("2026-06-13T12:00:00.000Z"),
      tools: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });
    const longCommand =
      'npm test -- --runInBand --grep auth-session-boundary --reporter verbose --maxWorkers=1 --testNamePattern "updates sessions safely"';
    const configPath = join(repoRoot, ".agentflight", "config.json");
    const config = JSON.parse(await readFile(configPath, "utf8")) as {
      verification: { commands: string[] };
    };
    config.verification.commands = [longCommand];
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
    await runStartCommand({
      repoRoot,
      task: "Update auth session boundary",
      now: new Date("2026-06-13T12:10:00.000Z"),
      git: {
        branch: "main",
        commit: "abc123",
        dirty: true,
        changedFiles: ["src/auth/session.ts"]
      },
      packageManager: "npm",
      tools: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });

    const status = await runStatusCommand({
      repoRoot,
      changedFiles: ["src/auth/session.ts"],
      now: new Date("2026-06-13T12:20:00.000Z")
    });
    const handoff = await runHandoffCommand({
      repoRoot,
      changedFiles: ["src/auth/session.ts"],
      now: new Date("2026-06-13T12:21:00.000Z")
    });

    for (const output of [status.output, handoff.output]) {
      expect(output).toContain("Full suggested commands:");
      expect(output).toContain(`agentflight verify -- ${longCommand}`);
    }
  });

  it("escapes raw HTML in handoff Markdown text fields", async () => {
    const repoRoot = await createTempRepo();
    await runInitCommand({
      repoRoot,
      now: new Date("2026-06-13T12:00:00.000Z"),
      tools: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });
    await runStartCommand({
      repoRoot,
      task: "Review <img src=x onerror=alert(1)> safely\n## fake task heading",
      now: new Date("2026-06-13T12:10:00.000Z"),
      git: {
        branch: "feature/<unsafe>",
        commit: "abc123",
        dirty: true,
        changedFiles: ["docs/<guide>.md"]
      },
      packageManager: "npm",
      tools: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });

    const handoff = await runHandoffCommand({
      repoRoot,
      changedFiles: ["docs/<guide>.md"],
      now: new Date("2026-06-13T12:20:00.000Z")
    });

    expect(handoff.output).toContain(
      "Review &lt;img src=x onerror=alert(1)&gt; safely ## fake task heading"
    );
    expect(handoff.output).toContain("docs/&lt;guide&gt;.md");
    expect(handoff.output).not.toContain("<img src=x onerror=alert(1)>");
    expect(handoff.output).not.toContain("\n## fake task heading");
    expect(handoff.output).not.toContain("docs/<guide>.md");
    await expect(readFile(handoff.handoffPath, "utf8")).resolves.toContain(
      "Review &lt;img src=x onerror=alert(1)&gt; safely"
    );
  });

  it("keeps text and JSON status next action aligned after handoff exists", async () => {
    const repoRoot = await createTempRepo();
    await runInitCommand({
      repoRoot,
      now: new Date("2026-06-13T12:00:00.000Z"),
      tools: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });
    await runStartCommand({
      repoRoot,
      task: "Update docs handoff",
      now: new Date("2026-06-13T12:10:00.000Z"),
      git: {
        branch: "main",
        commit: "abc123",
        dirty: true,
        changedFiles: ["README.md"]
      },
      packageManager: "npm",
      tools: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });
    await runHandoffCommand({
      repoRoot,
      changedFiles: ["README.md"],
      now: new Date("2026-06-13T12:20:00.000Z")
    });

    const textStatus = await runStatusCommand({
      repoRoot,
      changedFiles: ["README.md"],
      now: new Date("2026-06-13T12:21:00.000Z")
    });
    const jsonStatus = await runStatusCommand({
      repoRoot,
      changedFiles: ["README.md"],
      now: new Date("2026-06-13T12:21:00.000Z"),
      format: "json"
    });
    const parsed = JSON.parse(jsonStatus.output);

    expect(parsed.nextAction).toContain("Open first: handoff .agentflight/reports/");
    expect(textStatus.output).toContain(`Next action:\n${parsed.nextAction}`);
  });

  it("explains generated files when start --yes initializes AgentFlight", async () => {
    const repoRoot = await createTempRepo();
    await writeFile(
      join(repoRoot, "package.json"),
      JSON.stringify(
        {
          scripts: {
            test: "vitest run"
          }
        },
        null,
        2
      )
    );

    const start = await runStartCommand({
      repoRoot,
      task: "First run through start yes",
      yes: true,
      now: new Date("2026-06-13T12:05:00.000Z"),
      git: {
        branch: "main",
        commit: "abc123",
        dirty: false,
        changedFiles: []
      },
      packageManager: "npm",
      tools: {
        projscan: { available: true, version: "4.5.0", warnings: [] },
        agentloopkit: { available: true, version: "0.35.2", warnings: [] }
      }
    });

    expect(start.output).toContain("Initialized:");
    expect(start.output).toContain("- .agentflight/config.json");
    expect(start.output).toContain("- .agentflight/.gitignore");
    expect(start.output).toContain(".agentflight/config.json is project config");
    expect(start.output).toContain("local runtime evidence");
    expect(start.output).toContain("excluded from AgentFlight changed-file analysis");
    expect(start.output).not.toContain(repoRoot);
    expect(
      JSON.parse(await readFile(join(repoRoot, ".agentflight", "config.json"), "utf8")).verification
        .commands
    ).toEqual(["npm test"]);
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

    const start = await runStartCommand({
      repoRoot,
      task: "Use detected fallback proof",
      now: new Date("2026-06-13T12:02:00.000Z"),
      git: {
        branch: "main",
        commit: "abc123",
        dirty: false,
        changedFiles: []
      },
      packageManager: "npm",
      tools
    });
    expect(start.output).toContain(`Suggested proof:
npm run typecheck
npm test`);
    expect(start.output).not.toContain("Configured commands:");
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
      now: new Date("2026-06-13T12:00:00.000Z"),
      tools: {
        projscan: { available: true, version: "4.3.1", warnings: [] },
        agentloopkit: { available: true, version: "0.28.7", warnings: [] }
      }
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
    expect(doctor.output).toContain("Suggested fix:\n  Try one of:");
    expect(doctor.output).toContain("  - agentflight verify -- npm run typecheck");
    expect(doctor.output).toContain("  - agentflight verify -- npm test");
    expect(doctor.output).toContain("agentflight verify -- npm run typecheck");
    expect(doctor.output).toContain("agentflight verify -- npm test");
    expect(doctor.output).not.toContain("Try one of: agentflight verify");
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
      now: new Date("2026-06-13T12:00:00.000Z"),
      tools: {
        projscan: { available: true, version: "4.3.1", warnings: [] },
        agentloopkit: { available: true, version: "0.28.7", warnings: [] }
      }
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
      now: new Date("2026-06-13T12:00:00.000Z"),
      tools: {
        projscan: { available: true, version: "4.3.1", warnings: [] },
        agentloopkit: { available: true, version: "0.28.7", warnings: [] }
      }
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
      now: new Date("2026-06-13T12:00:00.000Z"),
      tools: {
        projscan: { available: true, version: "4.3.1", warnings: [] },
        agentloopkit: { available: true, version: "0.28.7", warnings: [] }
      }
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
      inspectProjScan: async (options) => {
        calls.push(`inspect-projscan:${String(options?.includeHelp)}`);
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
      "inspect-projscan:false",
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
