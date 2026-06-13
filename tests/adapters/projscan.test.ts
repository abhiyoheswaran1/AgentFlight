import { describe, expect, it } from "vitest";
import { inspectProjScan } from "../../src/adapters/projscan.js";
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
});
