import { describe, expect, it } from "vitest";
import { inspectAgentLoopKit } from "../../src/adapters/agentloopkit.js";
import type { CommandRunner } from "../../src/core/process.js";

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
});
