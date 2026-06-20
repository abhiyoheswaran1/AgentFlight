import { describe, expect, it } from "vitest";
import { normalizeCliVersion, runToolWithFallback } from "../../src/adapters/tool-runner.js";
import type { CommandRunner } from "../../src/core/process.js";

describe("tool adapter runner", () => {
  it("prefers repo-local binaries, then npx latest, then PATH", async () => {
    const commands: string[] = [];
    const run: CommandRunner = async (command, args) => {
      commands.push(`${command} ${args.join(" ")}`);
      if (command.includes("node_modules/.bin/example")) {
        return { exitCode: 127, stdout: "", stderr: "missing local binary" };
      }
      if (command === "npx") {
        return { exitCode: 1, stdout: "", stderr: "npx failed" };
      }
      if (command === "example") {
        return { exitCode: 0, stdout: "ok", stderr: "" };
      }
      return { exitCode: 1, stdout: "", stderr: "unexpected command" };
    };

    await expect(
      runToolWithFallback({
        run,
        localCommand: "example",
        packageName: "example@latest",
        args: ["--version"],
        cwd: "/repo"
      })
    ).resolves.toMatchObject({
      exitCode: 0,
      stdout: "ok"
    });

    expect(commands).toEqual([
      "/repo/node_modules/.bin/example --version",
      "npx --yes example@latest --version",
      "example --version"
    ]);
  });

  it("summarizes every failed fallback in the returned stderr", async () => {
    const run: CommandRunner = async (command) => {
      if (command.includes("node_modules/.bin/example")) {
        return { exitCode: 127, stdout: "", stderr: "missing local binary" };
      }
      if (command === "npx") {
        return { exitCode: 1, stdout: "npx stdout", stderr: "" };
      }
      return { exitCode: 127, stdout: "", stderr: "path missing" };
    };

    const result = await runToolWithFallback({
      run,
      localCommand: "example",
      packageName: "example@latest",
      args: ["--help"],
      cwd: "/repo"
    });

    expect(result).toMatchObject({
      exitCode: 127,
      stderr: expect.stringContaining("missing local binary")
    });
    expect(result.stderr).toContain("npx fallback failed: npx stdout");
    expect(result.stderr).toContain("PATH command failed: path missing");
  });

  it("normalizes decorated CLI version output", () => {
    expect(normalizeCliVersion("example v1.2.3\n")).toBe("1.2.3");
    expect(normalizeCliVersion("1.2.3-beta.1\n")).toBe("1.2.3-beta.1");
    expect(normalizeCliVersion("custom build")).toBe("custom build");
  });
});
