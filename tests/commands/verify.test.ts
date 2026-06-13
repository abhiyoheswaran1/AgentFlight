import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTempRepo } from "../helpers/temp.js";
import { initAgentFlight } from "../../src/core/config.js";
import { startSession } from "../../src/core/session.js";
import { runVerifyCommand } from "../../src/commands/verify.js";

describe("verify command", () => {
  it("records a successful explicit command in the current session", async () => {
    const repoRoot = await startedRepo();

    const result = await runVerifyCommand({
      repoRoot,
      commandArgs: [process.execPath, "-e", "console.log('ok')"],
      now: () => new Date("2026-06-13T12:00:00.000Z")
    });

    expect(result.exitCode).toBe(0);
    expect(result.output).toContain("passed");
    expect(result.output).toContain("Evidence saved:");
    expect(result.output).toContain(".agentflight/evidence/");
    expect(result.output).toContain("verification-1.stdout.txt");
    expect(result.output).toContain("verification-1.stderr.txt");

    const current = JSON.parse(
      await readFile(join(repoRoot, ".agentflight", "current", "session.json"), "utf8")
    );
    expect(current.verificationRuns).toHaveLength(1);
    expect(current.verificationRuns[0]).toMatchObject({
      status: "passed",
      exitCode: 0
    });
    expect(current.events.map((event: { type: string }) => event.type)).toEqual([
      "session_started",
      "verification_started",
      "verification_passed"
    ]);
  });

  it("records a failing explicit command and returns non-zero after persistence", async () => {
    const repoRoot = await startedRepo();

    const result = await runVerifyCommand({
      repoRoot,
      commandArgs: [process.execPath, "-e", "process.exit(4)"],
      now: () => new Date("2026-06-13T12:00:00.000Z")
    });

    expect(result.exitCode).toBe(1);
    expect(result.output).toContain("failed");
    expect(result.output).toContain("Evidence saved:");
    expect(result.output).toContain("Next action:");
    expect(result.output).toContain("agentflight verify --");

    const current = JSON.parse(
      await readFile(join(repoRoot, ".agentflight", "current", "session.json"), "utf8")
    );
    expect(current.verificationRuns[0]).toMatchObject({
      status: "failed",
      exitCode: 4
    });
    expect(current.events.map((event: { type: string }) => event.type)).toEqual([
      "session_started",
      "verification_started",
      "verification_failed"
    ]);
  });

  it("runs configured verification commands when no explicit command is provided", async () => {
    const repoRoot = await startedRepo();
    const configPath = join(repoRoot, ".agentflight", "config.json");
    const config = JSON.parse(await readFile(configPath, "utf8"));
    config.verification.commands = [`${process.execPath} -e "console.log('configured ok')"`];
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);

    const result = await runVerifyCommand({
      repoRoot,
      now: () => new Date("2026-06-13T12:00:00.000Z")
    });

    expect(result.exitCode).toBe(0);
    expect(result.output).toContain("configured ok");

    const current = JSON.parse(
      await readFile(join(repoRoot, ".agentflight", "current", "session.json"), "utf8")
    );
    expect(current.verificationRuns).toHaveLength(1);
  });
});

async function startedRepo(): Promise<string> {
  const repoRoot = await createTempRepo();
  await initAgentFlight({ repoRoot, now: new Date("2026-06-13T11:00:00.000Z") });
  await startSession({
    repoRoot,
    task: "Capture verification",
    now: new Date("2026-06-13T11:30:00.000Z"),
    git: { branch: "main", commit: "abc123", dirty: false, changedFiles: [] },
    packageManager: "npm",
    verificationCommands: ["npm test"],
    tools: {
      projscan: { available: true, warnings: [] },
      agentloopkit: { available: true, warnings: [] }
    }
  });
  return repoRoot;
}
