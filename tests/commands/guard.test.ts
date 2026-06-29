import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { createCli } from "../../src/cli.js";
import { runGuardCommand } from "../../src/commands/guard.js";
import { runInitCommand } from "../../src/commands/init.js";
import { runStartCommand } from "../../src/commands/start.js";
import { runVerifyCommand } from "../../src/commands/verify.js";
import { runCommand } from "../../src/core/process.js";
import { createTempRepo } from "../helpers/temp.js";

const taskId = "auth-password-reset-20260626-01";

describe("guard command", () => {
  it("prints a one-shot local trust view for a standalone session", async () => {
    const repoRoot = await createStartedRepo("Reset auth");
    await runVerifyCommand({
      repoRoot,
      commandArgs: ["npm", "test", "--", "auth"],
      now: clock("2026-06-28T12:10:00.000Z"),
      commandRunner: async () => ({
        stdout: "",
        stderr: "FAIL tests/auth/reset.test.ts\n",
        exitCode: 1
      })
    });

    const guard = await runGuardCommand({
      repoRoot,
      once: true,
      changedFiles: ["src/auth/reset.ts"],
      now: new Date("2026-06-28T12:20:00.000Z")
    });

    expect(guard.exitCode).toBe(1);
    expect(guard.output).toContain("AgentFlight guard");
    expect(guard.output).toContain("Trust state:\nBlocked by failed verification");
    expect(guard.output).toContain("Changed files:\n1");
    expect(guard.output).toContain("Verification:\n0 passed, 1 failed");
    expect(guard.output).toContain("Finish targets:");
    expect(guard.output).toContain("- Review Passport JSON: .agentflight/reports/");
    expect(guard.output).toContain("Trust signals:");
    expect(guard.output).toContain("Suggested proof: agentflight verify -- npm test -- auth");
    expect(guard.output.match(/^Next action:/gm)).toHaveLength(1);
    expect(guard.output).toContain("Local only: no upload, no telemetry, no automatic PR comment.");
    expect(guard.output).not.toContain(repoRoot);
  });

  it("returns structured JSON for one-shot guard output", async () => {
    const repoRoot = await createStartedRepo("Docs polish");
    const guard = await runGuardCommand({
      repoRoot,
      once: true,
      format: "json",
      changedFiles: ["README.md"],
      now: new Date("2026-06-28T12:20:00.000Z")
    });

    const parsed = JSON.parse(guard.output);
    expect(guard.exitCode).toBe(0);
    expect(parsed).toMatchObject({
      schemaVersion: "1.0",
      kind: "agentflight-guard-summary",
      taskTitle: "Docs polish",
      changedFiles: { count: 1 },
      localOnly: true
    });
    expect(parsed.signals[0]).toMatchObject({
      source: "agentflight",
      category: "readiness"
    });
  });

  it("includes Baseframe scope drift and gate signals", async () => {
    const repoRoot = await createStartedBaseframeRepo();
    await runVerifyCommand({
      repoRoot,
      commandArgs: ["npm", "run", "typecheck"],
      now: clock("2026-06-28T12:10:00.000Z"),
      commandRunner: async () => ({ stdout: "ok\n", stderr: "", exitCode: 0 })
    });

    const guard = await runGuardCommand({
      repoRoot,
      once: true,
      changedFiles: ["src/auth/reset.ts", "package.json", "docs/password-reset.md"],
      now: new Date("2026-06-28T12:20:00.000Z")
    });

    expect(guard.exitCode).toBe(1);
    expect(guard.output).toContain("Baseframe:");
    expect(guard.output).toContain(`task ${taskId}`);
    expect(guard.output).toContain("scope drift 2");
    expect(guard.output).toContain("package.json changed inside excluded Baseframe scope.");
    expect(guard.output).toContain("Baseframe gate auth-tests is missing: npm test -- auth");
    expect(guard.output).toContain("Baseframe gate build is missing: npm run build");
    expect(guard.output).toContain(
      `- Baseframe result: .baseframe/evidence/${taskId}/agentflight-result.json`
    );
  }, 60_000);

  it("works for older sessions without Baseframe integration context", async () => {
    const repoRoot = await createStartedRepo("Update docs");
    const guard = await runGuardCommand({
      repoRoot,
      once: true,
      changedFiles: ["README.md"],
      now: new Date("2026-06-28T12:20:00.000Z")
    });

    expect(guard.output).toContain("AgentFlight guard");
    expect(guard.output).not.toContain("Baseframe:");
    expect(guard.output).toContain("No blocking guard signals detected.");
  });

  it("exposes guard in CLI help", () => {
    expect(createCli().helpInformation()).toContain(
      "guard [options]                Watch local trust state while an agent works."
    );
  });
});

async function createStartedRepo(task: string): Promise<string> {
  const repoRoot = await createTempRepo();
  await runInitCommand({
    repoRoot,
    now: new Date("2026-06-28T12:00:00.000Z"),
    tools: {
      projscan: { available: true, warnings: [] },
      agentloopkit: { available: true, warnings: [] }
    }
  });
  await runStartCommand({
    repoRoot,
    task,
    now: new Date("2026-06-28T12:05:00.000Z"),
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
    now: new Date("2026-06-28T12:00:00.000Z"),
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
    now: new Date("2026-06-28T12:05:00.000Z"),
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
  const result = await runCommand("git", args, { cwd: repoRoot, timeoutMs: 30_000 });
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
