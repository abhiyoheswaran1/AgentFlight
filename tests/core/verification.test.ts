import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createTempRepo } from "../helpers/temp.js";
import {
  buildOutputExcerpt,
  detectVerificationCommands,
  parseCommandLine,
  runVerificationCommand
} from "../../src/core/verification.js";
import type { AgentFlightSession } from "../../src/types/index.js";

describe("verification command detection", () => {
  it("prefers typecheck, lint, test, and build scripts when present", () => {
    expect(
      detectVerificationCommands({
        scripts: {
          test: "vitest run",
          build: "tsc -p tsconfig.build.json",
          typecheck: "tsc --noEmit",
          lint: "eslint .",
          dev: "tsx src/cli.ts"
        }
      })
    ).toEqual(["npm run typecheck", "npm run lint", "npm test", "npm run build"]);
  });

  it("returns an empty list when no proof scripts exist", () => {
    expect(detectVerificationCommands({ scripts: { dev: "tsx src/cli.ts" } })).toEqual([]);
  });

  it("parses configured verification command strings without using a shell", () => {
    expect(parseCommandLine('npm run test -- --reporter="dot"')).toEqual([
      "npm",
      "run",
      "test",
      "--",
      "--reporter=dot"
    ]);
  });

  it("captures stdout, stderr, timing, and passed status for a successful command", async () => {
    const repoRoot = await createTempRepo();
    const session = testSession(repoRoot);

    const run = await runVerificationCommand({
      repoRoot,
      session,
      commandArgs: [process.execPath, "-e", "console.log('proof ok'); console.error('proof err')"],
      now: () => new Date("2026-06-13T12:00:00.000Z")
    });

    expect(run).toMatchObject({
      command: `${process.execPath} -e "console.log('proof ok'); console.error('proof err')"`,
      exitCode: 0,
      status: "passed",
      durationMs: 0,
      stdoutPath: ".agentflight/evidence/af-test/verification-1.stdout.txt",
      stderrPath: ".agentflight/evidence/af-test/verification-1.stderr.txt"
    });
    await expect(readFile(join(repoRoot, run.stdoutPath), "utf8")).resolves.toContain("proof ok");
    await expect(readFile(join(repoRoot, run.stderrPath), "utf8")).resolves.toContain("proof err");
  });

  it("records failed status and exit code without throwing for a failing command", async () => {
    const repoRoot = await createTempRepo();
    const session = testSession(repoRoot);

    const run = await runVerificationCommand({
      repoRoot,
      session,
      commandArgs: [process.execPath, "-e", "console.error('nope'); process.exit(7)"],
      now: () => new Date("2026-06-13T12:00:00.000Z")
    });

    expect(run).toMatchObject({
      exitCode: 7,
      status: "failed",
      stdoutPath: ".agentflight/evidence/af-test/verification-1.stdout.txt",
      stderrPath: ".agentflight/evidence/af-test/verification-1.stderr.txt"
    });
    await expect(readFile(join(repoRoot, run.stderrPath), "utf8")).resolves.toContain("nope");
    expect(run.outputExcerpt).toContain("nope");
  });
});

describe("buildOutputExcerpt", () => {
  it("prefers stderr when it has content", () => {
    expect(buildOutputExcerpt("compiled ok", "Error: boom")).toBe("Error: boom");
  });

  it("falls back to stdout when stderr is empty (test runners report there)", () => {
    expect(buildOutputExcerpt("2 failed | 39 passed", "  \n ")).toBe("2 failed | 39 passed");
  });

  it("returns undefined when there is no output", () => {
    expect(buildOutputExcerpt("", "")).toBeUndefined();
    expect(buildOutputExcerpt("   \n\n", "")).toBeUndefined();
  });

  it("keeps only the last N lines", () => {
    const input = Array.from({ length: 30 }, (_, i) => `line ${i + 1}`).join("\n");
    const excerpt = buildOutputExcerpt(input, "", { maxLines: 3 });
    expect(excerpt).toBe("line 28\nline 29\nline 30");
  });

  it("truncates very long single lines", () => {
    const excerpt = buildOutputExcerpt("x".repeat(500), "", { maxLineLength: 10 });
    expect(excerpt).toBe(`${"x".repeat(10)}…`);
  });
});

function testSession(repoRoot: string): AgentFlightSession {
  return {
    id: "af-test",
    task: { title: "Test session" },
    startedAt: "2026-06-13T11:00:00.000Z",
    repoRoot,
    git: { branch: "main", commit: "abc123", dirty: false, changedFiles: [] },
    packageManager: "npm",
    verificationCommands: ["npm test"],
    verificationRuns: [],
    tools: {
      projscan: { available: false, warnings: [] },
      agentloopkit: { available: false, warnings: [] }
    }
  };
}
