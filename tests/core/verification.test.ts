import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createTempRepo } from "../helpers/temp.js";
import {
  buildOutputExcerpt,
  buildVerificationSummary,
  detectVerificationCommands,
  parseCommandLine,
  runVerificationCommand
} from "../../src/core/verification.js";
import type { AgentFlightSession, VerificationRun } from "../../src/types/index.js";

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

  it("rejects unsafe session ids before reserving verification evidence paths", async () => {
    const repoRoot = await createTempRepo();
    const session = { ...testSession(repoRoot), id: "../../../tmp/agentflight-core-poc" };
    let ranCommand = false;

    await expect(
      runVerificationCommand({
        repoRoot,
        session,
        commandArgs: ["node", "-e", "console.log('unsafe')"],
        commandRunner: async () => {
          ranCommand = true;
          return { exitCode: 0, stdout: "unsafe\n", stderr: "" };
        }
      })
    ).rejects.toThrow("Unsafe AgentFlight session id");
    expect(ranCommand).toBe(false);
  });

  it("strips terminal controls from display excerpts while preserving raw evidence", async () => {
    const repoRoot = await createTempRepo();
    const session = testSession(repoRoot);
    const rawStderr = "\u001b]52;c;SGVsbG8=\u0007\u001b[2JVISIBLE_FAILURE\u202E\n";

    const run = await runVerificationCommand({
      repoRoot,
      session,
      commandArgs: ["node", "-e", "process.exit(1)"],
      commandRunner: async () => ({
        exitCode: 1,
        stdout: "",
        stderr: rawStderr
      })
    });

    expect(run.outputExcerpt).toBe("VISIBLE_FAILURE");
    await expect(readFile(join(repoRoot, run.stderrPath), "utf8")).resolves.toBe(rawStderr);
  });
});

describe("buildVerificationSummary", () => {
  it("treats an earlier failed command as resolved when the same command later passes", () => {
    const session = testSession("/repo", {
      verificationCommands: ["npm test"],
      verificationRuns: [
        verificationRun("npm test", "failed", "2026-06-13T12:00:00.000Z"),
        verificationRun("npm test", "passed", "2026-06-13T12:03:00.000Z")
      ]
    });

    const summary = buildVerificationSummary(session, {
      changedFilesCount: 1,
      riskLevel: "medium"
    });

    expect(summary).toMatchObject({
      passed: 1,
      failed: 1,
      unresolvedFailed: 0,
      resolvedFailed: 1,
      readiness: "Ready for review"
    });
    expect(summary.unresolvedFailedRuns).toEqual([]);
    expect(summary.gaps).not.toContain(
      "A verification command failed and must be fixed or rerun successfully."
    );
  });

  it("keeps a command unresolved when its latest run is failed", () => {
    const session = testSession("/repo", {
      verificationCommands: ["npm test"],
      verificationRuns: [
        verificationRun("npm test", "passed", "2026-06-13T12:00:00.000Z"),
        verificationRun("npm test", "failed", "2026-06-13T12:03:00.000Z")
      ]
    });

    const summary = buildVerificationSummary(session, {
      changedFilesCount: 1,
      riskLevel: "medium"
    });

    expect(summary).toMatchObject({
      passed: 1,
      failed: 1,
      unresolvedFailed: 1,
      resolvedFailed: 0,
      readiness: "Blocked"
    });
    expect(summary.unresolvedFailedRuns).toHaveLength(1);
    expect(summary.gaps).toContain(
      "A verification command failed and must be fixed or rerun successfully."
    );
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

  it("strips terminal control and bidi characters from display excerpts", () => {
    expect(buildOutputExcerpt("", "\u001b]52;c;SGVsbG8=\u0007\u001b[2JFAILED\u202E")).toBe(
      "FAILED"
    );
  });
});

function testSession(
  repoRoot: string,
  options: {
    verificationCommands?: string[] | undefined;
    verificationRuns?: VerificationRun[] | undefined;
  } = {}
): AgentFlightSession {
  return {
    id: "af-test",
    task: { title: "Test session" },
    startedAt: "2026-06-13T11:00:00.000Z",
    repoRoot,
    git: { branch: "main", commit: "abc123", dirty: false, changedFiles: [] },
    packageManager: "npm",
    verificationCommands: options.verificationCommands ?? ["npm test"],
    verificationRuns: options.verificationRuns ?? [],
    tools: {
      projscan: { available: false, warnings: [] },
      agentloopkit: { available: false, warnings: [] }
    }
  };
}

function verificationRun(
  command: string,
  status: "passed" | "failed",
  startedAt: string
): VerificationRun {
  const run: VerificationRun = {
    command,
    startedAt,
    finishedAt: startedAt,
    durationMs: 100,
    exitCode: status === "passed" ? 0 : 1,
    status,
    stdoutPath: ".agentflight/evidence/af-test/verification.stdout.txt",
    stderrPath: ".agentflight/evidence/af-test/verification.stderr.txt"
  };
  if (status === "failed") run.outputExcerpt = "failure excerpt";
  return run;
}
