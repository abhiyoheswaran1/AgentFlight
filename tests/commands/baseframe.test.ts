import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTempRepo } from "../helpers/temp.js";
import { runFinalizeCommand } from "../../src/commands/finalize.js";
import { runInitCommand } from "../../src/commands/init.js";
import { runReportCommand } from "../../src/commands/report.js";
import { runReplayCommand } from "../../src/commands/replay.js";
import { runResumeCommand } from "../../src/commands/resume.js";
import { runStartCommand } from "../../src/commands/start.js";
import { runStatusCommand } from "../../src/commands/status.js";
import { runVerifyCommand } from "../../src/commands/verify.js";
import type {
  AgentFlightSession,
  AgentLoopKitTaskContractV1,
  ProjScanAssessmentV1
} from "../../src/types/index.js";

const taskId = "auth-password-reset-20260626-01";

describe("Baseframe command workflow", () => {
  it("starts from an AgentLoopKit task contract and persists integration context", async () => {
    const repoRoot = await createBaseframeCommandRepo();

    const start = await runStartCommand({
      repoRoot,
      fromTask: `.baseframe/evidence/${taskId}/agentloopkit-task.json`,
      now: new Date("2026-06-26T10:00:00.000Z"),
      git: { branch: "main", commit: "abc123", dirty: false, changedFiles: [] },
      packageManager: "npm",
      tools: {
        projscan: { available: true, version: "4.5.0", warnings: [] },
        agentloopkit: { available: true, version: "0.35.2", warnings: [] }
      }
    });

    expect(start.output).toContain("AgentFlight started");
    expect(start.output).toContain("Task:\nImplement password reset");
    expect(start.output).toContain("Baseframe task:");
    expect(start.output).toContain(taskId);
    expect(start.output).toContain("agentflight verify -- npm run build");

    const session = JSON.parse(
      await readFile(join(repoRoot, ".agentflight", "current", "session.json"), "utf8")
    ) as AgentFlightSession;
    expect(session.baseframeIntegration).toMatchObject({
      schemaVersion: "1.0",
      taskId,
      expectedScope: {
        allowedPaths: ["src/auth/**", "tests/auth/**"],
        excludedPaths: ["package.json", "package-lock.json"]
      }
    });
    expect(session.verificationCommands).toEqual([
      "npm run typecheck",
      "npm test -- auth",
      "npm run build"
    ]);
  });

  it("preserves older start sessions without integration context", async () => {
    const repoRoot = await createBaseframeCommandRepo();

    await runStartCommand({
      repoRoot,
      task: "Standalone AgentFlight task",
      now: new Date("2026-06-26T10:00:00.000Z"),
      git: { branch: "main", commit: "abc123", dirty: false, changedFiles: [] },
      packageManager: "npm",
      tools: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });

    const status = await runStatusCommand({
      repoRoot,
      changedFiles: ["README.md"],
      now: new Date("2026-06-26T10:05:00.000Z")
    });
    expect(status.output).toContain("AgentFlight status");
    expect(status.output).not.toContain("Repository Assessment");
  });

  it("refreshes Baseframe result after report generation and shows renderer sections", async () => {
    const repoRoot = await createStartedBaseframeRepo();

    const report = await runReportCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts", "src/payments/card.ts"],
      now: new Date("2026-06-26T10:30:00.000Z")
    });
    const reportMarkdown = await readFile(report.reportPath, "utf8");
    expect(reportMarkdown).toContain("## Repository Assessment");
    expect(reportMarkdown).toContain("## Task Contract");
    expect(reportMarkdown).toContain("## Scope Adherence");
    expect(reportMarkdown).toContain("## Verification Gates");
    expect(reportMarkdown).toContain("## Review Focus");
    expect(reportMarkdown).toContain("## Proof Gaps");
    expect(reportMarkdown).toContain("## Readiness");
    expect(reportMarkdown).toContain("## Next Action");
    await expect(
      readFile(join(repoRoot, ".baseframe", "evidence", taskId, "agentflight-result.json"), "utf8")
    ).resolves.toContain('"kind": "agentflight-result"');

    const replay = await runReplayCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts", "src/payments/card.ts"],
      now: new Date("2026-06-26T10:31:00.000Z")
    });
    const replayHtml = await readFile(replay.replayPath, "utf8");
    expect(replayHtml).toContain("Repository Assessment");
    expect(replayHtml).toContain("Verification Gates");
    expect(replayHtml).toContain("Scope Adherence");

    const resume = await runResumeCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts", "src/payments/card.ts"],
      now: new Date("2026-06-26T10:32:00.000Z")
    });
    expect(resume.output).toContain("## Repository Assessment");
    expect(resume.output).toContain("## Verification Gates");
    expect(resume.output).toContain("## Next Action");
  });

  it("finalizes the Baseframe result, writes workflow manifest, and prints AgentLoopKit reconciliation", async () => {
    const repoRoot = await createStartedBaseframeRepo();
    await runVerifyCommand({
      repoRoot,
      commandArgs: ["npm", "run", "typecheck"],
      now: clock("2026-06-26T10:10:00.000Z"),
      commandRunner: async () => ({ stdout: "ok\n", stderr: "", exitCode: 0 })
    });
    await runVerifyCommand({
      repoRoot,
      commandArgs: ["npm", "test", "--", "auth"],
      now: clock("2026-06-26T10:11:00.000Z"),
      commandRunner: async () => ({ stdout: "fail\n", stderr: "", exitCode: 1 })
    });

    const finalize = await runFinalizeCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts", "src/payments/card.ts", "package.json"],
      now: new Date("2026-06-26T10:40:00.000Z")
    });

    expect(finalize.output).toContain("AgentFlight result written:");
    expect(finalize.output).toContain(`.baseframe/evidence/${taskId}/agentflight-result.json`);
    expect(finalize.output).toContain("agentloopkit check-gates");
    expect(finalize.output).toContain(`--task ${taskId}`);
    expect(finalize.output).toContain(
      `--from-agentflight .baseframe/evidence/${taskId}/agentflight-result.json`
    );

    const result = JSON.parse(
      await readFile(
        join(repoRoot, ".baseframe", "evidence", taskId, "agentflight-result.json"),
        "utf8"
      )
    );
    expect(result.readiness).toBe("blocked_by_failed_verification");
    expect(result.gates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ gateId: "typecheck", status: "passed" }),
        expect.objectContaining({ gateId: "auth-tests", status: "failed" }),
        expect.objectContaining({ gateId: "build", status: "missing" })
      ])
    );
    expect(result.scopeDrift).toEqual(
      expect.arrayContaining([
        { path: "package.json", reason: "inside-excluded-scope" },
        { path: "src/payments/card.ts", reason: "outside-allowed-scope" }
      ])
    );

    const manifest = JSON.parse(
      await readFile(join(repoRoot, ".baseframe", "agent-workflow.json"), "utf8")
    );
    expect(manifest.projscan.status).toBe("completed");
    expect(manifest.agentloopkit.status).toBe("active");
    expect(manifest.agentflight).toMatchObject({
      status: "completed",
      resultPath: `.baseframe/evidence/${taskId}/agentflight-result.json`
    });
  });

  it("runs an end-to-end Baseframe fixture flow without runtime dependencies on sibling packages", async () => {
    const repoRoot = await createStartedBaseframeRepo();
    await writeFile(join(repoRoot, "src-auth-reset.marker"), "changed\n");

    await runVerifyCommand({
      repoRoot,
      commandArgs: ["npm", "run", "typecheck"],
      now: clock("2026-06-26T11:10:00.000Z"),
      commandRunner: async () => ({ stdout: "typecheck ok\n", stderr: "", exitCode: 0 })
    });
    await runVerifyCommand({
      repoRoot,
      commandArgs: ["npm", "test", "--", "auth"],
      now: clock("2026-06-26T11:11:00.000Z"),
      commandRunner: async () => ({ stdout: "auth failed\n", stderr: "", exitCode: 1 })
    });

    await runFinalizeCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts", "docs/password-reset.md"],
      now: new Date("2026-06-26T11:20:00.000Z")
    });

    const result = JSON.parse(
      await readFile(
        join(repoRoot, ".baseframe", "evidence", taskId, "agentflight-result.json"),
        "utf8"
      )
    );
    expect(result.schemaVersion).toBe("1.0");
    expect(result.kind).toBe("agentflight-result");
    expect(result.producer.name).toBe("agentflight");
    expect(result.taskId).toBe(taskId);
    expect(result.changedFiles).toEqual(["docs/password-reset.md", "src/auth/reset.ts"]);
    expect(result.scopeDrift).toEqual([
      { path: "docs/password-reset.md", reason: "outside-allowed-scope" }
    ]);
    expect(result.gates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ gateId: "typecheck", status: "passed" }),
        expect.objectContaining({ gateId: "auth-tests", status: "failed" }),
        expect.objectContaining({ gateId: "build", status: "missing" })
      ])
    );
    expect(result.reviewFocus).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "src/auth/reset.ts",
          sources: ["projscan", "agentloopkit", "agentflight"]
        })
      ])
    );
  });
});

async function createStartedBaseframeRepo(): Promise<string> {
  const repoRoot = await createBaseframeCommandRepo();
  await runStartCommand({
    repoRoot,
    fromTask: `.baseframe/evidence/${taskId}/agentloopkit-task.json`,
    now: new Date("2026-06-26T10:00:00.000Z"),
    git: { branch: "main", commit: "abc123", dirty: false, changedFiles: [] },
    packageManager: "npm",
    tools: {
      projscan: { available: true, version: "4.5.0", warnings: [] },
      agentloopkit: { available: true, version: "0.35.2", warnings: [] }
    }
  });
  return repoRoot;
}

async function createBaseframeCommandRepo(): Promise<string> {
  const repoRoot = await createTempRepo();
  await runInitCommand({
    repoRoot,
    now: new Date("2026-06-26T09:00:00.000Z"),
    tools: {
      projscan: { available: true, version: "4.5.0", warnings: [] },
      agentloopkit: { available: true, version: "0.35.2", warnings: [] }
    }
  });
  await writeBaseframeFixtures(repoRoot);
  await writeWorkflowManifest(repoRoot);
  return repoRoot;
}

async function writeBaseframeFixtures(repoRoot: string): Promise<void> {
  const evidenceDir = join(repoRoot, ".baseframe", "evidence", taskId);
  await mkdir(evidenceDir, { recursive: true });
  const assessment = JSON.parse(
    await readFile("tests/fixtures/baseframe/projscan-assessment.json", "utf8")
  ) as ProjScanAssessmentV1;
  const task = JSON.parse(
    await readFile("tests/fixtures/baseframe/agentloopkit-task.json", "utf8")
  ) as AgentLoopKitTaskContractV1;
  await writeFile(
    join(evidenceDir, "projscan-assessment.json"),
    `${JSON.stringify(assessment, null, 2)}\n`
  );
  await writeFile(
    join(evidenceDir, "agentloopkit-task.json"),
    `${JSON.stringify(task, null, 2)}\n`
  );
}

async function writeWorkflowManifest(repoRoot: string): Promise<void> {
  const manifestPath = join(repoRoot, ".baseframe", "agent-workflow.json");
  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(
    manifestPath,
    `${JSON.stringify(
      {
        projscan: {
          status: "completed",
          assessmentPath: `.baseframe/evidence/${taskId}/projscan-assessment.json`
        },
        agentloopkit: {
          status: "active",
          taskPath: `.baseframe/evidence/${taskId}/agentloopkit-task.json`
        }
      },
      null,
      2
    )}\n`
  );
}

function clock(iso: string): () => Date {
  let current = Date.parse(iso);
  return () => {
    const next = new Date(current);
    current += 1000;
    return next;
  };
}
