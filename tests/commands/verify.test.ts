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

    const current = JSON.parse(
      await readFile(join(repoRoot, ".agentflight", "current", "session.json"), "utf8")
    );
    expect(current.verificationRuns).toHaveLength(1);
    expect(current.verificationRuns[0]).toMatchObject({
      status: "passed",
      exitCode: 0
    });
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

    const current = JSON.parse(
      await readFile(join(repoRoot, ".agentflight", "current", "session.json"), "utf8")
    );
    expect(current.verificationRuns[0]).toMatchObject({
      status: "failed",
      exitCode: 4
    });
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
