import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTempRepo } from "../helpers/temp.js";
import {
  createReviewPassport,
  renderReviewPassportMarkdown,
  writeReviewPassportArtifacts
} from "../../src/core/review-passport.js";
import type {
  AgentFlightResultV1,
  AgentFlightSession,
  ProjectReviewContractEvaluation,
  ReviewFocusItem,
  ReviewIntelligence,
  RiskAnalysis
} from "../../src/types/index.js";
import type { VerificationSummary } from "../../src/core/verification.js";

describe("review passport", () => {
  it("creates a source-free review passport with deterministic integrity metadata", () => {
    const passport = createReviewPassport({
      generatedAt: new Date("2026-06-27T21:00:00.000Z"),
      producerVersion: "0.15.0",
      session: sampleSession(),
      changedFiles: ["src/auth/reset.ts", "tests/auth/reset.test.ts"],
      risk: sampleRisk(),
      verification: sampleVerification(),
      review: sampleReview(),
      artifacts: sampleArtifacts(),
      baseframeResult: sampleBaseframeResult()
    });

    expect(passport).toMatchObject({
      schemaVersion: "1.0",
      kind: "agentflight-review-passport",
      producer: { name: "agentflight", version: "0.15.0" },
      session: {
        id: "af-20260627-210000-passport",
        task: "Implement password reset",
        branch: "main",
        commit: "abc123"
      },
      readiness: {
        state: "needs_verification",
        label: "Needs verification",
        nextAction: "Run npm run build."
      },
      baseframe: {
        taskId: "auth-password-reset-20260626-01",
        readiness: "needs_verification",
        resultPath: ".baseframe/evidence/auth-password-reset-20260626-01/agentflight-result.json"
      }
    });
    expect(passport.changedFiles).toEqual(["src/auth/reset.ts", "tests/auth/reset.test.ts"]);
    expect(passport.verification.runs).toEqual([
      {
        id: "verification-1",
        command: "npm run typecheck",
        status: "passed",
        exitCode: 0,
        startedAt: "2026-06-27T20:55:00.000Z",
        finishedAt: "2026-06-27T20:55:01.000Z",
        durationMs: 1000
      }
    ]);
    expect(passport.reviewFocus[0]).toMatchObject({
      path: "src/auth/reset.ts",
      reasons: ["identity/session path"],
      suggestedReviewerFocus: "Check token lifecycle."
    });
    expect(passport.integrity.hashAlgorithm).toBe("sha256");
    expect(passport.integrity.fingerprintHash).toMatch(/^[a-f0-9]{64}$/);
    expect(passport.integrity.inputs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "changed-files",
          sha256: expect.stringMatching(/^[a-f0-9]{64}$/)
        }),
        expect.objectContaining({
          kind: "verification",
          sha256: expect.stringMatching(/^[a-f0-9]{64}$/)
        }),
        expect.objectContaining({
          kind: "artifacts",
          sha256: expect.stringMatching(/^[a-f0-9]{64}$/)
        })
      ])
    );
    expect(JSON.stringify(passport)).not.toContain("source code");
  });

  it("renders Markdown centered on readiness and next action", () => {
    const passport = createReviewPassport({
      generatedAt: new Date("2026-06-27T21:00:00.000Z"),
      producerVersion: "0.15.0",
      session: sampleSession(),
      changedFiles: ["src/auth/reset.ts"],
      risk: sampleRisk(),
      verification: sampleVerification(),
      review: sampleReview(),
      artifacts: sampleArtifacts(),
      baseframeResult: sampleBaseframeResult()
    });

    const markdown = renderReviewPassportMarkdown(passport);

    expect(markdown).toContain("# AgentFlight Review Passport");
    expect(markdown).toContain("Readiness: Needs verification");
    expect(markdown).toContain("Next action: Run npm run build.");
    expect(markdown).toContain("## Verification");
    expect(markdown).toContain("- passed: npm run typecheck");
    expect(markdown).toContain("## Baseframe");
    expect(markdown).toContain("auth-password-reset-20260626-01");
    expect(markdown).toContain("Local only: no upload, no telemetry, no automatic PR comment.");
  });

  it("writes JSON and Markdown passport artifacts under reports", async () => {
    const repoRoot = await createTempRepo();
    const passport = createReviewPassport({
      generatedAt: new Date("2026-06-27T21:00:00.000Z"),
      producerVersion: "0.15.0",
      session: sampleSession(),
      changedFiles: ["src/auth/reset.ts"],
      risk: sampleRisk(),
      verification: sampleVerification(),
      review: sampleReview(),
      artifacts: sampleArtifacts()
    });

    const result = await writeReviewPassportArtifacts({ repoRoot, passport });

    expect(result.jsonPath).toBe(
      join(repoRoot, ".agentflight", "reports", "af-20260627-210000-passport-review-passport.json")
    );
    expect(result.markdownPath).toBe(
      join(repoRoot, ".agentflight", "reports", "af-20260627-210000-passport-review-passport.md")
    );
    await expect(readFile(result.jsonPath, "utf8")).resolves.toContain(
      '"kind": "agentflight-review-passport"'
    );
    await expect(readFile(result.markdownPath, "utf8")).resolves.toContain(
      "# AgentFlight Review Passport"
    );
  });
});

function sampleSession(): AgentFlightSession {
  return {
    id: "af-20260627-210000-passport",
    task: { title: "Implement password reset" },
    startedAt: "2026-06-27T20:30:00.000Z",
    repoRoot: "/workspace/agentflight",
    git: {
      branch: "main",
      commit: "abc123",
      dirty: true,
      changedFiles: ["src/auth/reset.ts"]
    },
    packageManager: "npm",
    verificationCommands: ["npm run typecheck", "npm test -- auth", "npm run build"],
    tools: {
      projscan: { available: true, version: "4.5.0", warnings: [] },
      agentloopkit: { available: true, version: "0.44.0", warnings: [] }
    }
  };
}

function sampleRisk(): RiskAnalysis {
  return {
    level: "high",
    changedFiles: 2,
    categories: [{ category: "auth", files: ["src/auth/reset.ts"] }],
    reasons: ["Authentication-sensitive files changed."]
  };
}

function sampleVerification(): VerificationSummary {
  return {
    passed: 1,
    failed: 0,
    unresolvedFailed: 0,
    resolvedFailed: 0,
    unresolvedFailedRuns: [],
    missingCommands: [],
    gaps: [],
    readiness: "Ready for review",
    nextAction: "Share the local handoff packet.",
    runs: [
      {
        id: "verification-1",
        command: "npm run typecheck",
        status: "passed",
        exitCode: 0,
        startedAt: "2026-06-27T20:55:00.000Z",
        finishedAt: "2026-06-27T20:55:01.000Z",
        durationMs: 1000,
        stdoutPath: ".agentflight/evidence/stdout.txt",
        stderrPath: ".agentflight/evidence/stderr.txt"
      }
    ]
  };
}

function sampleReview(): ReviewIntelligence {
  const projectReviewContract: ProjectReviewContractEvaluation = {
    enabled: true,
    requirements: [],
    summary: {
      total: 0,
      supported: 0,
      needsReview: 0,
      missing: 0,
      failed: 0,
      stale: 0,
      manualReview: 0,
      notRequired: 0,
      unknown: 0
    }
  };
  const focus: ReviewFocusItem[] = [
    {
      rank: 1,
      file: "src/auth/reset.ts",
      category: "auth",
      riskLevel: "high",
      score: 100,
      reasons: ["identity/session path"],
      suggestedReviewerFocus: "Check token lifecycle.",
      proofStatus: "current",
      relatedProofGapIds: []
    }
  ];

  return {
    focus,
    proofGaps: [
      {
        id: "missing-build",
        severity: "blocking",
        message: "Required verification gate is missing: npm run build",
        suggestedCommand: "npm run build",
        relatedFiles: []
      }
    ],
    readiness: {
      state: "needs_verification",
      label: "Needs verification",
      reason: "Required build proof is missing.",
      nextAction: "Run npm run build.",
      suggestedCommand: "npm run build",
      proofGaps: []
    },
    projectReviewContract,
    contract: {
      summary: {
        total: 0,
        supported: 0,
        needsReview: 0,
        unsupported: 0,
        failed: 0,
        stale: 0,
        notTestable: 0,
        unknown: 0
      },
      claims: []
    },
    calibration: {
      source: "local_session_history",
      state: "no_history",
      summary: "Not enough similar ready local handoffs yet.",
      scannedSessions: 0,
      similarReadySessions: 0,
      suggestions: []
    },
    proofFreshness: {
      state: "current",
      reason: "Verification proof matches the current changed-file state.",
      staleFiles: [],
      staleCategories: []
    },
    reviewReceipt: {
      state: "none",
      label: "No review receipt",
      summary: "No local review receipt recorded yet.",
      nextAction: "Record a receipt after local review.",
      staleFiles: []
    },
    trustDelta: {
      summary: "Trust changed because proof is stale or missing.",
      items: []
    },
    reviewQueue: [
      {
        rank: 1,
        action: "run_missing_proof",
        label: "Run missing proof",
        detail: "Required build proof is missing.",
        relatedFiles: [],
        suggestedCommand: "npm run build",
        relatedProofGapIds: ["missing-build"]
      }
    ],
    reviewRoutes: {
      summary: "1 reviewer route needs attention before trust.",
      items: []
    }
  };
}

function sampleArtifacts() {
  return [
    { kind: "handoff" as const, path: ".agentflight/reports/af-passport-handoff.md" },
    { kind: "report" as const, path: ".agentflight/reports/af-passport-proof.md" },
    { kind: "replay" as const, path: ".agentflight/reports/af-passport-replay.html" },
    { kind: "resume" as const, path: ".agentflight/reports/af-passport-resume.md" }
  ];
}

function sampleBaseframeResult(): AgentFlightResultV1 {
  return {
    schemaVersion: "1.0",
    kind: "agentflight-result",
    producer: { name: "agentflight", version: "0.15.0" },
    taskId: "auth-password-reset-20260626-01",
    generatedAt: "2026-06-27T21:00:00.000Z",
    source: {
      projscanAssessmentPath:
        ".baseframe/evidence/auth-password-reset-20260626-01/projscan-assessment.json",
      agentloopkitTaskPath:
        ".baseframe/evidence/auth-password-reset-20260626-01/agentloopkit-task.json"
    },
    readiness: "needs_verification",
    summary: "Readiness: needs_verification.",
    changedFiles: ["src/auth/reset.ts"],
    scopeDrift: [],
    verification: [{ command: "npm run typecheck", status: "passed", exitCode: 0 }],
    gates: [{ gateId: "build", command: "npm run build", status: "missing" }],
    proofGaps: [
      {
        severity: "blocking",
        message: "Required verification gate is missing: npm run build",
        suggestedCommand: "npm run build"
      }
    ],
    reviewFocus: [],
    artifacts: [
      { kind: "report", path: ".agentflight/reports/af-passport-proof.md" },
      { kind: "replay", path: ".agentflight/reports/af-passport-replay.html" },
      { kind: "resume", path: ".agentflight/reports/af-passport-resume.md" }
    ]
  };
}
