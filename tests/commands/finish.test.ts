import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { createCli } from "../../src/cli.js";
import { runFinishCommand } from "../../src/commands/finish.js";
import { runInitCommand } from "../../src/commands/init.js";
import { runStartCommand } from "../../src/commands/start.js";
import { runVerifyCommand } from "../../src/commands/verify.js";
import { runCommand } from "../../src/core/process.js";
import type { ReviewPassportV1 } from "../../src/types/index.js";
import { createTempRepo } from "../helpers/temp.js";

const taskId = "auth-password-reset-20260626-01";

describe("finish command", () => {
  it("writes a Review Passport and review artifacts for a standalone session", async () => {
    const repoRoot = await createStartedRepo("Update docs");

    const finish = await runFinishCommand({
      repoRoot,
      changedFiles: ["README.md"],
      now: new Date("2026-06-27T21:30:00.000Z"),
      producerVersion: "0.15.0"
    });

    expect(finish.output).toContain("AgentFlight finish");
    expect(finish.output).toContain("Readiness:");
    expect(finish.output.match(/^Next action:/gm)).toHaveLength(1);
    expect(finish.output).toContain(
      "Share the Review Passport and handoff packet for scoped review."
    );
    expect(finish.output).not.toContain(
      "Run agentflight handoff to generate the local review packet."
    );
    expect(finish.output).toContain("Review Passport:");
    expect(finish.output).toContain(".agentflight/reports/");
    expect(finish.output).toContain(
      "Local only: no upload, no telemetry, no automatic PR comment."
    );
    expect(finish.passportPath).toContain("-review-passport.json");
    expect(finish.exitCode).toBe(0);

    const passport = JSON.parse(await readFile(finish.passportPath, "utf8")) as ReviewPassportV1;
    expect(passport.kind).toBe("agentflight-review-passport");
    expect(passport.producer.version).toBe("0.15.0");
    expect(passport.session.task).toBe("Update docs");
    expect(passport.changedFiles).toEqual(["README.md"]);
    expect(passport.artifacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "passport-json" }),
        expect.objectContaining({ kind: "passport-markdown" }),
        expect.objectContaining({ kind: "handoff" }),
        expect.objectContaining({ kind: "report" }),
        expect.objectContaining({ kind: "replay" }),
        expect.objectContaining({ kind: "resume" })
      ])
    );
    await expect(readFile(finish.passportMarkdownPath, "utf8")).resolves.toContain(
      "# AgentFlight Review Passport"
    );
    await expect(
      readFile(join(repoRoot, ".agentflight", "current", "handoff.md"), "utf8")
    ).resolves.toContain("AgentFlight handoff");
  });

  it("finalizes Baseframe evidence and links it from the Review Passport", async () => {
    const repoRoot = await createStartedBaseframeRepo();
    await runVerifyCommand({
      repoRoot,
      commandArgs: ["npm", "run", "typecheck"],
      now: clock("2026-06-27T21:10:00.000Z"),
      commandRunner: async () => ({ stdout: "ok\n", stderr: "", exitCode: 0 })
    });

    const finish = await runFinishCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts", "docs/password-reset.md"],
      now: new Date("2026-06-27T21:30:00.000Z"),
      producerVersion: "0.15.0"
    });

    expect(finish.output).toContain("Baseframe result:");
    expect(finish.output).toContain(`.baseframe/evidence/${taskId}/agentflight-result.json`);
    expect(finish.output).toContain("agentloopkit check-gates");
    expect(finish.exitCode).toBe(1);

    const resultPath = join(repoRoot, ".baseframe", "evidence", taskId, "agentflight-result.json");
    await expect(readFile(resultPath, "utf8")).resolves.toContain('"kind": "agentflight-result"');
    const passport = JSON.parse(await readFile(finish.passportPath, "utf8")) as ReviewPassportV1;
    expect(passport.baseframe).toMatchObject({
      taskId,
      readiness: "needs_verification",
      resultPath: `.baseframe/evidence/${taskId}/agentflight-result.json`
    });
    expect(passport.artifacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "baseframe-result",
          path: `.baseframe/evidence/${taskId}/agentflight-result.json`
        })
      ])
    );
    const manifest = JSON.parse(
      await readFile(join(repoRoot, ".baseframe", "agent-workflow.json"), "utf8")
    );
    expect(manifest.agentflight).toMatchObject({
      status: "completed",
      resultPath: `.baseframe/evidence/${taskId}/agentflight-result.json`
    });
  });

  it("keeps generated Baseframe output out of scope drift during finish", async () => {
    const repoRoot = await createStartedGitBaseframeRepo();
    await writeFile(join(repoRoot, "src", "auth", "reset.ts"), "export const reset = false;\n");
    await writeFile(join(repoRoot, "docs", "password-reset.md"), "changed docs\n");
    await writeFile(
      join(repoRoot, "package.json"),
      `${JSON.stringify({ scripts: { typecheck: "echo ok" }, private: true }, null, 2)}\n`
    );

    await runVerifyCommand({
      repoRoot,
      commandArgs: ["npm", "run", "typecheck"],
      now: clock("2026-06-27T21:10:00.000Z"),
      commandRunner: async () => ({ stdout: "ok\n", stderr: "", exitCode: 0 })
    });

    const finish = await runFinishCommand({
      repoRoot,
      now: new Date("2026-06-27T21:30:00.000Z"),
      producerVersion: "0.15.0"
    });

    expect(finish.exitCode).toBe(1);
    const result = JSON.parse(
      await readFile(
        join(repoRoot, ".baseframe", "evidence", taskId, "agentflight-result.json"),
        "utf8"
      )
    );
    expect(result.changedFiles).toEqual([
      "docs/password-reset.md",
      "package.json",
      "src/auth/reset.ts"
    ]);
    expect(result.scopeDrift).toEqual([
      { path: "docs/password-reset.md", reason: "outside-allowed-scope" },
      { path: "package.json", reason: "inside-excluded-scope" }
    ]);
    expect(result.artifacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "report" }),
        expect.objectContaining({ kind: "replay" }),
        expect.objectContaining({ kind: "resume" })
      ])
    );
    const passport = JSON.parse(await readFile(finish.passportPath, "utf8")) as ReviewPassportV1;
    expect(passport.changedFiles).toEqual(result.changedFiles);
    expect(passport.baseframe?.scopeDrift).toEqual(result.scopeDrift);
  }, 20_000);

  it("exposes finish in CLI help", () => {
    expect(createCli().helpInformation()).toContain(
      "finish                         Generate the local Review Passport"
    );
  });
});

async function createStartedRepo(task: string): Promise<string> {
  const repoRoot = await createTempRepo();
  await runInitCommand({
    repoRoot,
    now: new Date("2026-06-27T21:00:00.000Z"),
    tools: {
      projscan: { available: true, warnings: [] },
      agentloopkit: { available: true, warnings: [] }
    }
  });
  await runStartCommand({
    repoRoot,
    task,
    now: new Date("2026-06-27T21:05:00.000Z"),
    git: { branch: "main", commit: "abc123", dirty: true, changedFiles: ["README.md"] },
    packageManager: "npm",
    tools: {
      projscan: { available: true, warnings: [] },
      agentloopkit: { available: true, warnings: [] }
    }
  });
  return repoRoot;
}

async function createStartedBaseframeRepo(): Promise<string> {
  const repoRoot = await createTempRepo();
  await runInitCommand({
    repoRoot,
    now: new Date("2026-06-27T21:00:00.000Z"),
    tools: {
      projscan: { available: true, warnings: [] },
      agentloopkit: { available: true, warnings: [] }
    }
  });
  await copyFixture(
    "tests/fixtures/baseframe/agentloopkit-task.json",
    join(repoRoot, ".baseframe", "evidence", taskId, "agentloopkit-task.json")
  );
  await copyFixture(
    "tests/fixtures/baseframe/projscan-assessment.json",
    join(repoRoot, ".baseframe", "evidence", taskId, "projscan-assessment.json")
  );
  await writeFile(
    join(repoRoot, ".baseframe", "agent-workflow.json"),
    `${JSON.stringify(
      {
        projscan: { status: "completed" },
        agentloopkit: { status: "active" }
      },
      null,
      2
    )}\n`
  );
  await runStartCommand({
    repoRoot,
    fromTask: `.baseframe/evidence/${taskId}/agentloopkit-task.json`,
    now: new Date("2026-06-27T21:05:00.000Z"),
    git: { branch: "main", commit: "abc123", dirty: true, changedFiles: ["src/auth/reset.ts"] },
    packageManager: "npm",
    tools: {
      projscan: { available: true, version: "4.5.0", warnings: [] },
      agentloopkit: { available: true, version: "0.44.0", warnings: [] }
    }
  });
  return repoRoot;
}

async function createStartedGitBaseframeRepo(): Promise<string> {
  const repoRoot = await createTempRepo();
  await runInitCommand({
    repoRoot,
    now: new Date("2026-06-27T21:00:00.000Z"),
    tools: {
      projscan: { available: true, warnings: [] },
      agentloopkit: { available: true, warnings: [] }
    }
  });
  await copyFixture(
    "tests/fixtures/baseframe/agentloopkit-task.json",
    join(repoRoot, ".baseframe", "evidence", taskId, "agentloopkit-task.json")
  );
  await copyFixture(
    "tests/fixtures/baseframe/projscan-assessment.json",
    join(repoRoot, ".baseframe", "evidence", taskId, "projscan-assessment.json")
  );
  await writeFile(
    join(repoRoot, ".baseframe", "agent-workflow.json"),
    `${JSON.stringify(
      {
        projscan: { status: "completed" },
        agentloopkit: { status: "active" }
      },
      null,
      2
    )}\n`
  );
  await mkdir(join(repoRoot, "src", "auth"), { recursive: true });
  await mkdir(join(repoRoot, "docs"), { recursive: true });
  await writeFile(join(repoRoot, "src", "auth", "reset.ts"), "export const reset = true;\n");
  await writeFile(join(repoRoot, "docs", "password-reset.md"), "initial docs\n");
  await writeFile(
    join(repoRoot, "package.json"),
    `${JSON.stringify({ scripts: { typecheck: "echo ok" } }, null, 2)}\n`
  );
  await initializeGitRepo(repoRoot);
  await runStartCommand({
    repoRoot,
    fromTask: `.baseframe/evidence/${taskId}/agentloopkit-task.json`,
    now: new Date("2026-06-27T21:05:00.000Z"),
    packageManager: "npm",
    tools: {
      projscan: { available: true, version: "4.5.0", warnings: [] },
      agentloopkit: { available: true, version: "0.44.0", warnings: [] }
    }
  });
  return repoRoot;
}

async function initializeGitRepo(repoRoot: string): Promise<void> {
  await runGit(repoRoot, ["init"]);
  await runGit(repoRoot, ["config", "user.email", "agentflight@example.invalid"]);
  await runGit(repoRoot, ["config", "user.name", "AgentFlight Test"]);
  await runGit(repoRoot, ["add", "."]);
  await runGit(repoRoot, ["commit", "-m", "Initial test state"]);
}

async function runGit(repoRoot: string, args: string[]): Promise<void> {
  const result = await runCommand("git", args, { cwd: repoRoot, timeoutMs: 10_000 });
  if (result.exitCode !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  }
}

async function copyFixture(from: string, to: string): Promise<void> {
  await mkdir(dirname(to), { recursive: true });
  await writeFile(to, await readFile(from, "utf8"));
}

function clock(iso: string): () => Date {
  return () => new Date(iso);
}
