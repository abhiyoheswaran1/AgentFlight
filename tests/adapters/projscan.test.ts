import { describe, expect, it } from "vitest";
import { inspectProjScan, runProjScanBaseline } from "../../src/adapters/projscan.js";
import type { CommandRunner } from "../../src/core/process.js";

describe("ProjScan adapter", () => {
  it("returns unavailable instead of throwing when projscan cannot run", async () => {
    const run: CommandRunner = async () => ({
      exitCode: 127,
      stdout: "",
      stderr: "command not found"
    });

    await expect(inspectProjScan({ run })).resolves.toMatchObject({
      available: false,
      warnings: [expect.stringContaining("command not found")]
    });
  });

  it("captures version and summary when projscan is available", async () => {
    const run: CommandRunner = async (_command, args) => {
      if (args.includes("--version")) return { exitCode: 0, stdout: "4.3.1\n", stderr: "" };
      return { exitCode: 0, stdout: "Usage: projscan [options] [command]\n", stderr: "" };
    };

    await expect(inspectProjScan({ run })).resolves.toMatchObject({
      available: true,
      version: "4.3.1",
      summary: expect.stringContaining("ProjScan available")
    });
  });

  it("prefers the repo-local binary before an older PATH binary", async () => {
    const commands: string[] = [];
    const run: CommandRunner = async (command, args) => {
      commands.push(command);
      if (command.includes("node_modules/.bin/projscan")) {
        if (args.includes("--version")) return { exitCode: 0, stdout: "4.3.1\n", stderr: "" };
        return { exitCode: 0, stdout: "Usage: projscan [options]\n", stderr: "" };
      }
      if (command === "projscan") {
        return { exitCode: 0, stdout: "0.9.2\n", stderr: "" };
      }
      return { exitCode: 1, stdout: "", stderr: "unexpected command" };
    };

    await expect(inspectProjScan({ cwd: "/repo", run })).resolves.toMatchObject({
      available: true,
      version: "4.3.1"
    });
    expect(commands[0]).toContain("node_modules/.bin/projscan");
    expect(commands).not.toContain("projscan");
  });

  it("uses npx latest before a stale PATH binary when the repo-local binary is unavailable", async () => {
    const commands: string[] = [];
    const run: CommandRunner = async (command, args) => {
      commands.push(command);
      if (command.includes("node_modules/.bin/projscan")) {
        return { exitCode: 127, stdout: "", stderr: "missing local binary" };
      }
      if (command === "npx" && args.includes("projscan@latest")) {
        if (args.includes("--version")) return { exitCode: 0, stdout: "4.3.1\n", stderr: "" };
        return { exitCode: 0, stdout: "Usage: projscan [options]\n", stderr: "" };
      }
      if (command === "projscan") {
        return { exitCode: 0, stdout: "0.9.2\n", stderr: "" };
      }
      return { exitCode: 1, stdout: "", stderr: "unexpected command" };
    };

    await expect(inspectProjScan({ cwd: "/repo", run })).resolves.toMatchObject({
      available: true,
      version: "4.3.1"
    });
    expect(commands).toContain("npx");
    expect(commands).not.toContain("projscan");
  });

  it("normalizes decorated version output", async () => {
    const run: CommandRunner = async (_command, args) => {
      if (args.includes("--version"))
        return { exitCode: 0, stdout: "projscan v4.3.1\n", stderr: "" };
      return { exitCode: 0, stdout: "Usage: projscan [options]\n", stderr: "" };
    };

    await expect(inspectProjScan({ run })).resolves.toMatchObject({
      available: true,
      version: "4.3.1"
    });
  });

  it("falls back to npx when a local projscan binary is unavailable", async () => {
    const run: CommandRunner = async (command, args) => {
      if (command === "projscan") {
        return { exitCode: 127, stdout: "", stderr: "command not found" };
      }
      if (command === "npx" && args.includes("projscan@latest") && args.includes("--version")) {
        return { exitCode: 0, stdout: "4.3.1\n", stderr: "" };
      }
      if (command === "npx" && args.includes("projscan@latest") && args.includes("--help")) {
        return { exitCode: 0, stdout: "Usage: projscan [options]\n", stderr: "" };
      }
      return { exitCode: 1, stdout: "", stderr: "unexpected command" };
    };

    await expect(inspectProjScan({ run })).resolves.toMatchObject({
      available: true,
      version: "4.3.1",
      summary: expect.stringContaining("ProjScan available")
    });
  });

  it("keeps the optional start baseline on a short timeout budget", async () => {
    let observedTimeout: number | undefined;
    const run: CommandRunner = async (_command, _args, options) => {
      observedTimeout = options?.timeoutMs;
      return { exitCode: 1, stdout: "", stderr: "timed out" };
    };

    await expect(runProjScanBaseline("/repo", run)).resolves.toMatchObject({
      available: true,
      warnings: [expect.stringContaining("timed out")]
    });
    expect(observedTimeout).toBeLessThanOrEqual(1_500);
  });
});
