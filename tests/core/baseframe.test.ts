import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTempRepo } from "../helpers/temp.js";
import {
  createAgentFlightResult,
  detectScopeDrift,
  matchVerificationGates,
  loadBaseframeIntegrationContext,
  updateBaseframeWorkflowManifest
} from "../../src/core/baseframe.js";
import { buildSessionRecord } from "../../src/core/session.js";
import type {
  AgentFlightSession,
  AgentLoopKitTaskContractV1,
  ProjScanAssessmentV1,
  VerificationRun
} from "../../src/types/index.js";

const taskId = "auth-password-reset-20260626-01";

describe("Baseframe integration contracts", () => {
  it("loads valid AgentLoopKit and ProjScan contracts into session context", async () => {
    const repoRoot = await createBaseframeFixtureRepo();

    const context = await loadBaseframeIntegrationContext({
      repoRoot,
      taskPath: `.baseframe/evidence/${taskId}/agentloopkit-task.json`
    });

    expect(context).toEqual({
      schemaVersion: "1.0",
      taskId,
      projscanAssessmentPath: `.baseframe/evidence/${taskId}/projscan-assessment.json`,
      agentloopkitTaskPath: `.baseframe/evidence/${taskId}/agentloopkit-task.json`,
      expectedScope: {
        allowedPaths: ["src/auth/**", "tests/auth/**"],
        excludedPaths: ["package.json", "package-lock.json"]
      },
      requiredVerification: [
        {
          id: "typecheck",
          command: "npm run typecheck",
          reason: "TypeScript must compile.",
          required: true
        },
        {
          id: "auth-tests",
          command: "npm test -- auth",
          reason: "Authentication tests must pass.",
          required: true
        },
        {
          id: "build",
          command: "npm run build",
          reason: "Package build must succeed.",
          required: true
        }
      ],
      importedReviewFocus: [
        {
          path: "src/auth/reset.ts",
          priority: "high",
          reasons: ["authentication-sensitive change", "token lifecycle"],
          source: "projscan"
        },
        {
          path: "src/auth/reset.ts",
          priority: "high",
          reasons: ["acceptance-critical implementation file"],
          source: "agentloopkit"
        }
      ]
    });
  });

  it("fails clearly when task IDs conflict", async () => {
    const repoRoot = await createBaseframeFixtureRepo({
      assessment: { taskId: "different-task" }
    });

    await expect(
      loadBaseframeIntegrationContext({
        repoRoot,
        taskPath: `.baseframe/evidence/${taskId}/agentloopkit-task.json`
      })
    ).rejects.toThrow(
      'Baseframe task ID mismatch: AgentLoopKit "auth-password-reset-20260626-01" does not match ProjScan "different-task".'
    );
  });

  it("rejects malformed schemas and unsafe local paths", async () => {
    const repoRoot = await createBaseframeFixtureRepo({
      task: { schemaVersion: "2.0" } as unknown as Partial<AgentLoopKitTaskContractV1>
    });

    await expect(
      loadBaseframeIntegrationContext({
        repoRoot,
        taskPath: `.baseframe/evidence/${taskId}/agentloopkit-task.json`
      })
    ).rejects.toThrow('Invalid AgentLoopKit task contract: expected schemaVersion "1.0".');

    await expect(
      loadBaseframeIntegrationContext({
        repoRoot,
        taskPath: "../outside/agentloopkit-task.json"
      })
    ).rejects.toThrow("Unsafe Baseframe path");
  });

  it("detects allowed, outside-scope, excluded, unclassified, and runtime-filtered paths deterministically", () => {
    expect(
      detectScopeDrift({
        changedFiles: [
          "src/auth/reset.ts",
          "src/payments/card.ts",
          "package.json",
          ".agentflight/current/session.json",
          ".agentflight/config.json"
        ],
        allowedPaths: ["src/auth/**"],
        excludedPaths: ["package.json"]
      })
    ).toEqual([
      {
        path: ".agentflight/config.json",
        reason: "outside-allowed-scope",
        severity: "warning"
      },
      {
        path: "package.json",
        reason: "inside-excluded-scope",
        severity: "blocking"
      },
      {
        path: "src/payments/card.ts",
        reason: "outside-allowed-scope",
        severity: "warning"
      }
    ]);

    expect(
      detectScopeDrift({
        changedFiles: ["README.md"],
        allowedPaths: [],
        excludedPaths: []
      })
    ).toEqual([{ path: "README.md", reason: "unclassified", severity: "warning" }]);
  });

  it("matches verification gates exactly or by normalized whitespace only", () => {
    const runs: VerificationRun[] = [
      verificationRun("run-1", "npm    run typecheck", "passed"),
      verificationRun("run-2", "npm test -- auth", "failed"),
      verificationRun("run-3", "npm test -- auth", "passed"),
      verificationRun("run-4", "npm run lint", "failed")
    ];

    expect(
      matchVerificationGates({
        gates: [
          gate("typecheck", "npm run typecheck"),
          gate("auth-tests", "npm test -- auth"),
          gate("build", "npm run build"),
          gate("lint", "npm run lint"),
          gate("unit", "npm test -- unit", false)
        ],
        runs,
        events: [
          {
            id: "evt-1",
            type: "verification_started",
            timestamp: "2026-06-26T10:10:00.000Z",
            title: "Verification started",
            metadata: { command: "npm run build" }
          }
        ]
      })
    ).toEqual([
      {
        gateId: "typecheck",
        command: "npm run typecheck",
        status: "passed",
        matchingVerificationRunId: "run-1"
      },
      {
        gateId: "auth-tests",
        command: "npm test -- auth",
        status: "passed",
        matchingVerificationRunId: "run-3"
      },
      {
        gateId: "build",
        command: "npm run build",
        status: "incomplete"
      },
      {
        gateId: "lint",
        command: "npm run lint",
        status: "failed",
        matchingVerificationRunId: "run-4"
      },
      {
        gateId: "unit",
        command: "npm test -- unit",
        status: "skipped"
      }
    ]);
  });

  it("computes unified readiness and writes AgentFlight result artifacts", async () => {
    const repoRoot = await createBaseframeFixtureRepo();
    const context = await loadBaseframeIntegrationContext({
      repoRoot,
      taskPath: `.baseframe/evidence/${taskId}/agentloopkit-task.json`
    });
    const session = buildBaseframeSession(repoRoot, context);

    const result = await createAgentFlightResult({
      repoRoot,
      session,
      changedFiles: ["src/auth/reset.ts", "package.json", "src/payments/card.ts"],
      now: new Date("2026-06-26T11:00:00.000Z"),
      artifacts: [
        { kind: "report", path: ".agentflight/reports/af-proof.md" },
        { kind: "replay", path: ".agentflight/reports/af-replay.html" },
        { kind: "resume", path: ".agentflight/reports/af-resume.md" }
      ]
    });

    expect(result).toMatchObject({
      schemaVersion: "1.0",
      kind: "agentflight-result",
      taskId,
      readiness: "blocked_by_failed_verification",
      source: {
        projscanAssessmentPath: `.baseframe/evidence/${taskId}/projscan-assessment.json`,
        agentloopkitTaskPath: `.baseframe/evidence/${taskId}/agentloopkit-task.json`
      },
      changedFiles: ["package.json", "src/auth/reset.ts", "src/payments/card.ts"]
    });
    expect(result.scopeDrift).toEqual([
      { path: "package.json", reason: "inside-excluded-scope" },
      { path: "src/payments/card.ts", reason: "outside-allowed-scope" }
    ]);
    expect(result.gates).toEqual([
      {
        gateId: "typecheck",
        command: "npm run typecheck",
        status: "passed",
        verificationRunId: "run-1"
      },
      {
        gateId: "auth-tests",
        command: "npm test -- auth",
        status: "failed",
        verificationRunId: "run-2"
      },
      { gateId: "build", command: "npm run build", status: "missing" }
    ]);
    expect(result.proofGaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "warning",
          message: 'Acceptance criterion "Reset tokens expire safely." is still pending.'
        }),
        expect.objectContaining({
          severity: "blocking",
          message: "Required verification gate failed: npm test -- auth"
        }),
        expect.objectContaining({
          severity: "blocking",
          message: "Excluded path changed: package.json"
        })
      ])
    );
    expect(result.reviewFocus[0]).toMatchObject({
      path: "src/auth/reset.ts",
      priority: "high",
      sources: ["projscan", "agentloopkit", "agentflight"]
    });

    const artifact = JSON.parse(
      await readFile(
        join(repoRoot, ".baseframe", "evidence", taskId, "agentflight-result.json"),
        "utf8"
      )
    );
    expect(artifact.kind).toBe("agentflight-result");
    expect(artifact.taskId).toBe(taskId);
  });

  it("blocks readiness when ProjScan reports a blocking finding", async () => {
    const repoRoot = await createBaseframeFixtureRepo({
      assessment: {
        verdict: "block",
        summary: "Blocking repository assessment.",
        risks: [
          {
            id: "risk-blocking-auth",
            severity: "blocking",
            category: "auth",
            message: "Reset token handling is unsafe.",
            files: ["src/auth/reset.ts"]
          }
        ]
      },
      task: {
        acceptanceCriteria: [
          {
            id: "ac-reset-email",
            text: "Users can request a password reset email.",
            status: "satisfied"
          }
        ]
      }
    });
    const context = await loadBaseframeIntegrationContext({
      repoRoot,
      taskPath: `.baseframe/evidence/${taskId}/agentloopkit-task.json`
    });
    const session = {
      ...buildBaseframeSession(repoRoot, context),
      verificationRuns: [
        verificationRun("run-1", "npm run typecheck", "passed"),
        verificationRun("run-2", "npm test -- auth", "passed"),
        verificationRun("run-3", "npm run build", "passed")
      ]
    };

    const result = await createAgentFlightResult({
      repoRoot,
      session,
      changedFiles: ["src/auth/reset.ts"],
      now: new Date("2026-06-26T11:30:00.000Z")
    });

    expect(result.readiness).toBe("not_ready_for_review");
    expect(result.proofGaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "blocking",
          message: "ProjScan blocked this task: Blocking repository assessment."
        }),
        expect.objectContaining({
          severity: "blocking",
          message: "ProjScan blocking finding risk-blocking-auth: Reset token handling is unsafe."
        })
      ])
    );
  });

  it("updates the workflow manifest while preserving other suite sections", async () => {
    const repoRoot = await createTempRepo();
    const manifestPath = join(repoRoot, ".baseframe", "agent-workflow.json");
    await mkdir(dirname(manifestPath), { recursive: true });
    await writeFile(
      manifestPath,
      `${JSON.stringify(
        {
          projscan: { status: "completed", assessmentPath: ".baseframe/evidence/t/projscan.json" },
          agentloopkit: { status: "active", taskPath: ".baseframe/evidence/t/task.json" }
        },
        null,
        2
      )}\n`
    );

    await updateBaseframeWorkflowManifest({
      repoRoot,
      taskId,
      resultPath: `.baseframe/evidence/${taskId}/agentflight-result.json`,
      version: "0.13.0"
    });

    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    expect(manifest.projscan.status).toBe("completed");
    expect(manifest.agentloopkit.status).toBe("active");
    expect(manifest.agentflight).toEqual({
      status: "completed",
      resultPath: `.baseframe/evidence/${taskId}/agentflight-result.json`,
      version: "0.13.0"
    });
  });
});

async function createBaseframeFixtureRepo(overrides: ContractOverrides = {}): Promise<string> {
  const repoRoot = await createTempRepo();
  const evidenceDir = join(repoRoot, ".baseframe", "evidence", taskId);
  await mkdir(evidenceDir, { recursive: true });
  const assessment = {
    ...JSON.parse(await readFile("tests/fixtures/baseframe/projscan-assessment.json", "utf8")),
    ...(overrides.assessment ?? {})
  } as ProjScanAssessmentV1;
  const task = {
    ...JSON.parse(await readFile("tests/fixtures/baseframe/agentloopkit-task.json", "utf8")),
    ...(overrides.task ?? {})
  } as AgentLoopKitTaskContractV1;
  await writeFile(
    join(evidenceDir, "projscan-assessment.json"),
    `${JSON.stringify(assessment, null, 2)}\n`
  );
  await writeFile(
    join(evidenceDir, "agentloopkit-task.json"),
    `${JSON.stringify(task, null, 2)}\n`
  );
  return repoRoot;
}

interface ContractOverrides {
  assessment?: Partial<ProjScanAssessmentV1>;
  task?: Partial<AgentLoopKitTaskContractV1>;
}

function buildBaseframeSession(
  repoRoot: string,
  baseframeIntegration: NonNullable<AgentFlightSession["baseframeIntegration"]>
): AgentFlightSession {
  return {
    ...buildSessionRecord({
      repoRoot,
      task: "Implement password reset",
      now: new Date("2026-06-26T10:00:00.000Z"),
      git: { branch: "main", commit: "abc123", dirty: true, changedFiles: [] },
      packageManager: "npm",
      verificationCommands: ["npm run typecheck", "npm test -- auth", "npm run build"],
      tools: {
        projscan: { available: true, version: "4.5.0", warnings: [] },
        agentloopkit: { available: true, version: "0.35.2", warnings: [] }
      }
    }),
    baseframeIntegration,
    verificationRuns: [
      verificationRun("run-1", "npm run typecheck", "passed"),
      verificationRun("run-2", "npm test -- auth", "failed")
    ]
  };
}

function gate(id: string, command: string, required = true) {
  return { id, command, reason: `${id} reason`, required };
}

function verificationRun(
  id: string,
  command: string,
  status: "passed" | "failed"
): VerificationRun {
  const index = Number(id.replace("run-", "")) || 1;
  return {
    id,
    command,
    startedAt: `2026-06-26T10:0${index}:00.000Z`,
    finishedAt: `2026-06-26T10:0${index}:01.000Z`,
    durationMs: 1000,
    exitCode: status === "passed" ? 0 : 1,
    status,
    stdoutPath: `.agentflight/evidence/af-test/verification-${index}.stdout.txt`,
    stderrPath: `.agentflight/evidence/af-test/verification-${index}.stderr.txt`
  } as VerificationRun;
}
