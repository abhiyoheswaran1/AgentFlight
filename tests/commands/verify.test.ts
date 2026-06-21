import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTempRepo } from "../helpers/temp.js";
import { initAgentFlight } from "../../src/core/config.js";
import { startSession } from "../../src/core/session.js";
import { runVerifyCommand } from "../../src/commands/verify.js";
import type { CommandRunner } from "../../src/core/process.js";

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

  it("prints the stderr-preferred failure excerpt while preserving raw evidence", async () => {
    const repoRoot = await startedRepo();
    const commandRunner: CommandRunner = async () => ({
      exitCode: 42,
      stdout: "STDOUT_NOISE: this should stay in evidence only\nSTDOUT_NOISE: second line\n",
      stderr: "STDERR_SIGNAL: useful failure line\nHTML_ESCAPE_CHECK: <script>alert(1)</script>\n"
    });

    const result = await runVerifyCommand({
      repoRoot,
      commandArgs: ["node", "-e", "process.exit(42)"],
      now: () => new Date("2026-06-13T12:00:00.000Z"),
      commandRunner
    });

    expect(result.exitCode).toBe(1);
    expect(result.output).toContain("STDERR_SIGNAL: useful failure line");
    expect(result.output).toContain("HTML_ESCAPE_CHECK: <script>alert(1)</script>");
    expect(result.output).not.toContain("STDOUT_NOISE");

    const current = JSON.parse(
      await readFile(join(repoRoot, ".agentflight", "current", "session.json"), "utf8")
    );
    const run = current.verificationRuns[0];
    await expect(readFile(join(repoRoot, run.stdoutPath), "utf8")).resolves.toBe(
      "STDOUT_NOISE: this should stay in evidence only\nSTDOUT_NOISE: second line\n"
    );
    await expect(readFile(join(repoRoot, run.stderrPath), "utf8")).resolves.toBe(
      "STDERR_SIGNAL: useful failure line\nHTML_ESCAPE_CHECK: <script>alert(1)</script>\n"
    );
  });

  it("falls back to stdout for terminal excerpts when stderr is empty", async () => {
    const repoRoot = await startedRepo();
    const commandRunner: CommandRunner = async () => ({
      exitCode: 1,
      stdout: "STDOUT_SIGNAL: test runner failure\n",
      stderr: ""
    });

    const result = await runVerifyCommand({
      repoRoot,
      commandArgs: ["npm", "test"],
      now: () => new Date("2026-06-13T12:00:00.000Z"),
      commandRunner
    });

    expect(result.exitCode).toBe(1);
    expect(result.output).toContain("STDOUT_SIGNAL: test runner failure");
  });

  it("keeps terminal failure excerpts capped", async () => {
    const repoRoot = await startedRepo();
    const stderr = Array.from(
      { length: 20 },
      (_, index) => `stderr line ${String(index + 1).padStart(2, "0")}`
    ).join("\n");
    const commandRunner: CommandRunner = async () => ({
      exitCode: 1,
      stdout: "",
      stderr
    });

    const result = await runVerifyCommand({
      repoRoot,
      commandArgs: ["npm", "test"],
      now: () => new Date("2026-06-13T12:00:00.000Z"),
      commandRunner
    });

    expect(result.output).not.toContain("stderr line 01");
    expect(result.output).toContain("stderr line 07");
    expect(result.output).toContain("stderr line 20");
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

  it("runs commands from a named verification profile", async () => {
    const repoRoot = await startedRepo();
    const configPath = join(repoRoot, ".agentflight", "config.json");
    const config = JSON.parse(await readFile(configPath, "utf8"));
    config.verification.profiles = {
      quick: [`${process.execPath} -e "console.log('profile ok')"`]
    };
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);

    const result = await runVerifyCommand({
      repoRoot,
      profile: "quick",
      now: () => new Date("2026-06-13T12:00:00.000Z")
    });

    expect(result.exitCode).toBe(0);
    expect(result.output).toContain("Profile: quick");
    expect(result.output).toContain("profile ok");

    const current = JSON.parse(
      await readFile(join(repoRoot, ".agentflight", "current", "session.json"), "utf8")
    );
    expect(current.verificationRuns).toHaveLength(1);
    expect(current.verificationRuns[0].command).toContain("profile ok");
  });

  it("returns a helpful error for unknown, empty, or malformed verification profiles", async () => {
    const repoRoot = await startedRepo();
    const configPath = join(repoRoot, ".agentflight", "config.json");
    const config = JSON.parse(await readFile(configPath, "utf8"));
    config.verification.profiles = {
      empty: [],
      malformed: "npm test"
    };
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);

    await expect(runVerifyCommand({ repoRoot, profile: "missing" })).resolves.toMatchObject({
      exitCode: 1,
      runs: []
    });
    await expect(runVerifyCommand({ repoRoot, profile: "empty" })).resolves.toMatchObject({
      exitCode: 1,
      runs: []
    });
    const malformed = await runVerifyCommand({ repoRoot, profile: "malformed" });
    const emptyName = await runVerifyCommand({ repoRoot, profile: "   " });

    expect(malformed.exitCode).toBe(1);
    expect(malformed.output).toContain("Verification profile malformed is invalid");
    expect(emptyName.exitCode).toBe(1);
    expect(emptyName.output).toContain("Verification profile name cannot be empty");

    const current = JSON.parse(
      await readFile(join(repoRoot, ".agentflight", "current", "session.json"), "utf8")
    );
    expect(current.verificationRuns).toEqual([]);
  });

  it("does not combine a named profile with an explicit verification command", async () => {
    const repoRoot = await startedRepo();

    const result = await runVerifyCommand({
      repoRoot,
      profile: "quick",
      commandArgs: [process.execPath, "-e", "console.log('should not run')"]
    });

    expect(result.exitCode).toBe(1);
    expect(result.runs).toEqual([]);
    expect(result.output).toContain(
      "Cannot combine --profile with an explicit verification command"
    );
  });

  it("emits heartbeat messages for long-running verification without adding them to evidence", async () => {
    const repoRoot = await startedRepo();
    const heartbeatMessages: string[] = [];
    const commandRunner: CommandRunner = async () => {
      await new Promise((resolve) => setTimeout(resolve, 25));
      return {
        exitCode: 0,
        stdout: "command stdout\n",
        stderr: ""
      };
    };

    const result = await runVerifyCommand({
      repoRoot,
      commandArgs: ["npm", "test"],
      now: () => new Date("2026-06-13T12:00:00.000Z"),
      commandRunner,
      heartbeatIntervalMs: 5,
      onHeartbeat: (message) => heartbeatMessages.push(message)
    });

    expect(result.exitCode).toBe(0);
    expect(heartbeatMessages.length).toBeGreaterThan(0);
    expect(heartbeatMessages[0]).toContain("AgentFlight verify still running after");

    const current = JSON.parse(
      await readFile(join(repoRoot, ".agentflight", "current", "session.json"), "utf8")
    );
    const stdoutPath = join(repoRoot, current.verificationRuns[0].stdoutPath);
    await expect(readFile(stdoutPath, "utf8")).resolves.toBe("command stdout\n");
  });

  it("keeps concurrent verification evidence paths distinct", async () => {
    const repoRoot = await startedRepo();
    let startedCommands = 0;
    let resolveBothCommandsStarted: (() => void) | undefined;
    let releaseCommands: (() => void) | undefined;
    const bothCommandsStarted = new Promise<void>((resolve) => {
      resolveBothCommandsStarted = resolve;
    });
    const releasePromise = new Promise<void>((resolve) => {
      releaseCommands = resolve;
    });

    const commandRunner: CommandRunner = async (command) => {
      startedCommands += 1;
      if (startedCommands === 2) resolveBothCommandsStarted?.();
      await releasePromise;
      return {
        exitCode: 0,
        stdout: `${command} stdout\n`,
        stderr: ""
      };
    };

    const first = runVerifyCommand({
      repoRoot,
      commandArgs: ["first-check"],
      now: () => new Date("2026-06-13T12:00:00.000Z"),
      commandRunner
    });
    const second = runVerifyCommand({
      repoRoot,
      commandArgs: ["second-check"],
      now: () => new Date("2026-06-13T12:00:01.000Z"),
      commandRunner
    });

    await bothCommandsStarted;
    releaseCommands?.();
    const results = await Promise.all([first, second]);
    const runs = results.flatMap((result) => result.runs);
    const stdoutPaths = runs.map((run) => run.stdoutPath);

    expect(new Set(stdoutPaths).size).toBe(2);

    const current = JSON.parse(
      await readFile(join(repoRoot, ".agentflight", "current", "session.json"), "utf8")
    );
    expect(current.verificationRuns).toHaveLength(2);
    const stdoutByCommand = Object.fromEntries(
      await Promise.all(
        current.verificationRuns.map(async (run: { command: string; stdoutPath: string }) => [
          run.command,
          await readFile(join(repoRoot, run.stdoutPath), "utf8")
        ])
      )
    );
    expect(stdoutByCommand["first-check"]).toBe("first-check stdout\n");
    expect(stdoutByCommand["second-check"]).toBe("second-check stdout\n");
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
