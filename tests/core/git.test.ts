import { describe, expect, it } from "vitest";
import { getGitInfo, listChangedFiles, parseGitStatusFiles } from "../../src/core/git.js";
import type { CommandRunner } from "../../src/core/process.js";

describe("git status parsing", () => {
  it("preserves filenames from porcelain status output", () => {
    expect(parseGitStatusFiles("?? README.md\n M src/cli.ts\nR  old.ts -> new.ts\n")).toEqual([
      "README.md",
      "src/cli.ts",
      "new.ts"
    ]);
  });

  it("filters AgentFlight runtime paths from changed files while keeping config and user files", async () => {
    const run: CommandRunner = async () => ({
      exitCode: 0,
      stdout: [
        "?? .agentflight/current/session.json",
        "?? .agentflight/evidence/af-test/verification-1.stdout.txt",
        "?? .agentflight/reports/af-test-proof.md",
        "?? .agentflight/sessions/af-test.json",
        "?? .agentflight/config.json",
        " M src/auth/reset.ts"
      ].join("\n"),
      stderr: ""
    });

    await expect(listChangedFiles("/repo", run)).resolves.toEqual([
      ".agentflight/config.json",
      "src/auth/reset.ts"
    ]);
  });

  it("treats a repo with only AgentFlight runtime artifacts as clean for session analysis", async () => {
    const run: CommandRunner = async (command, args) => {
      if (args.includes("branch")) {
        return { exitCode: 0, stdout: "main\n", stderr: "" };
      }
      if (args.includes("rev-parse")) {
        return { exitCode: 0, stdout: "abc123\n", stderr: "" };
      }
      return {
        exitCode: 0,
        stdout: [
          "?? .agentflight/current/session.json",
          "?? .agentflight/evidence/af-test/verification-1.stdout.txt",
          "?? .agentflight/reports/af-test-proof.md",
          "?? .agentflight/sessions/af-test.json"
        ].join("\n"),
        stderr: ""
      };
    };

    await expect(getGitInfo("/repo", run)).resolves.toMatchObject({
      branch: "main",
      commit: "abc123",
      dirty: false,
      changedFiles: []
    });
  });
});
