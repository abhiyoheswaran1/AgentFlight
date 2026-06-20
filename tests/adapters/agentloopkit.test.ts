import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { inspectAgentLoopKit, linkAgentLoopTask } from "../../src/adapters/agentloopkit.js";
import type { CommandRunner } from "../../src/core/process.js";
import { createTempRepo } from "../helpers/temp.js";

describe("AgentLoopKit adapter", () => {
  it("returns unavailable instead of throwing when agentloopkit cannot run", async () => {
    const run: CommandRunner = async () => ({
      exitCode: 127,
      stdout: "",
      stderr: "command not found"
    });

    await expect(inspectAgentLoopKit({ run })).resolves.toMatchObject({
      available: false,
      warnings: [expect.stringContaining("command not found")]
    });
  });

  it("captures version and doctor summary when agentloopkit is available", async () => {
    const run: CommandRunner = async (_command, args) => {
      if (args.includes("--version")) return { exitCode: 0, stdout: "0.28.7\n", stderr: "" };
      if (args.includes("doctor"))
        return { exitCode: 0, stdout: "Overall status: `pass`\n", stderr: "" };
      return { exitCode: 0, stdout: "Usage: agentloop [options] [command]\n", stderr: "" };
    };

    await expect(inspectAgentLoopKit({ run })).resolves.toMatchObject({
      available: true,
      version: "0.28.7",
      summary: expect.stringContaining("Overall status")
    });
  });

  it("can inspect availability without running doctor", async () => {
    const calls: string[] = [];
    const run: CommandRunner = async (_command, args) => {
      calls.push(args.join(" "));
      if (args.includes("--version")) return { exitCode: 0, stdout: "0.28.7\n", stderr: "" };
      if (args.includes("doctor")) return { exitCode: 0, stdout: "unexpected doctor", stderr: "" };
      return { exitCode: 1, stdout: "", stderr: "unexpected command" };
    };

    await expect(inspectAgentLoopKit({ run, includeDoctor: false })).resolves.toMatchObject({
      available: true,
      version: "0.28.7",
      summary: "AgentLoopKit available for task discipline.",
      warnings: []
    });
    expect(calls.some((call) => call.includes("--version"))).toBe(true);
    expect(calls.some((call) => call.includes("doctor"))).toBe(false);
  });

  it("prefers the repo-local binary before an older PATH binary", async () => {
    const commands: string[] = [];
    const run: CommandRunner = async (command, args) => {
      commands.push(command);
      if (command.includes("node_modules/.bin/agentloopkit")) {
        if (args.includes("--version")) return { exitCode: 0, stdout: "0.28.7\n", stderr: "" };
        if (args.includes("doctor"))
          return { exitCode: 0, stdout: "Overall status: `pass`\n", stderr: "" };
      }
      if (command === "agentloopkit") {
        return { exitCode: 0, stdout: "0.10.0\n", stderr: "" };
      }
      return { exitCode: 1, stdout: "", stderr: "unexpected command" };
    };

    await expect(inspectAgentLoopKit({ cwd: "/repo", run })).resolves.toMatchObject({
      available: true,
      version: "0.28.7"
    });
    expect(commands[0]).toContain("node_modules/.bin/agentloopkit");
    expect(commands).not.toContain("agentloopkit");
  });

  it("uses npx latest before a stale PATH binary when the repo-local binary is unavailable", async () => {
    const commands: string[] = [];
    const run: CommandRunner = async (command, args) => {
      commands.push(command);
      if (command.includes("node_modules/.bin/agentloopkit")) {
        return { exitCode: 127, stdout: "", stderr: "missing local binary" };
      }
      if (command === "npx" && args.includes("agentloopkit@latest")) {
        if (args.includes("--version")) return { exitCode: 0, stdout: "0.28.7\n", stderr: "" };
        if (args.includes("doctor"))
          return { exitCode: 0, stdout: "Overall status: `pass`\n", stderr: "" };
      }
      if (command === "agentloopkit") {
        return { exitCode: 0, stdout: "0.10.0\n", stderr: "" };
      }
      return { exitCode: 1, stdout: "", stderr: "unexpected command" };
    };

    await expect(inspectAgentLoopKit({ cwd: "/repo", run })).resolves.toMatchObject({
      available: true,
      version: "0.28.7"
    });
    expect(commands).toContain("npx");
    expect(commands).not.toContain("agentloopkit");
  });

  it("falls back to npx when a local agentloopkit binary is unavailable", async () => {
    const run: CommandRunner = async (command, args) => {
      if (command === "agentloopkit") {
        return { exitCode: 127, stdout: "", stderr: "command not found" };
      }
      if (command === "npx" && args.includes("agentloopkit@latest") && args.includes("--version")) {
        return { exitCode: 0, stdout: "0.28.7\n", stderr: "" };
      }
      if (command === "npx" && args.includes("agentloopkit@latest") && args.includes("doctor")) {
        return { exitCode: 0, stdout: "Overall status: `pass`\n", stderr: "" };
      }
      return { exitCode: 1, stdout: "", stderr: "unexpected command" };
    };

    await expect(inspectAgentLoopKit({ run })).resolves.toMatchObject({
      available: true,
      version: "0.28.7",
      summary: expect.stringContaining("Overall status")
    });
  });

  it("reuses an active task instead of creating a duplicate", async () => {
    const repoRoot = await createTempRepo("agentflight-agentloop-active-");
    await mkdir(join(repoRoot, ".agentloop"), { recursive: true });
    await writeFile(
      join(repoRoot, ".agentloop", "state.json"),
      JSON.stringify({
        version: 1,
        activeTaskPath: ".agentloop/tasks/reuse.md"
      })
    );

    await expect(linkAgentLoopTask(repoRoot)).resolves.toMatchObject({
      available: true,
      taskLinked: true,
      summary: expect.stringContaining(".agentloop/tasks/reuse.md")
    });
  });

  it("reuses the active task state file without running AgentLoopKit status", async () => {
    const repoRoot = await createTempRepo("agentflight-agentloop-state-");
    await mkdir(join(repoRoot, ".agentloop"), { recursive: true });
    await writeFile(
      join(repoRoot, ".agentloop", "state.json"),
      JSON.stringify({
        version: 1,
        activeTaskPath: ".agentloop/tasks/active.md"
      })
    );

    await expect(linkAgentLoopTask(repoRoot)).resolves.toMatchObject({
      available: true,
      taskLinked: true,
      summary: expect.stringContaining(".agentloop/tasks/active.md")
    });
  });

  it("does not link a task when no active task state exists", async () => {
    const repoRoot = await createTempRepo("agentflight-agentloop-no-state-");

    await expect(linkAgentLoopTask(repoRoot)).resolves.toMatchObject({
      available: true,
      taskLinked: false,
      summary: expect.stringContaining("No active AgentLoopKit task linked")
    });
  });

  it("does not link a task when active task state is empty", async () => {
    const repoRoot = await createTempRepo("agentflight-agentloop-empty-state-");
    await mkdir(join(repoRoot, ".agentloop"), { recursive: true });
    await writeFile(
      join(repoRoot, ".agentloop", "state.json"),
      JSON.stringify({
        version: 1,
        activeTaskPath: ""
      })
    );

    await expect(linkAgentLoopTask(repoRoot)).resolves.toMatchObject({
      available: true,
      taskLinked: false,
      summary: expect.stringContaining("No active AgentLoopKit task linked")
    });
  });

  it("does not link a task when the active task state is malformed", async () => {
    const repoRoot = await createTempRepo("agentflight-agentloop-bad-state-");
    await mkdir(join(repoRoot, ".agentloop"), { recursive: true });
    await writeFile(join(repoRoot, ".agentloop", "state.json"), "{");

    await expect(linkAgentLoopTask(repoRoot)).resolves.toMatchObject({
      available: true,
      taskLinked: false,
      summary: expect.stringContaining("No active AgentLoopKit task linked")
    });
  });
});
