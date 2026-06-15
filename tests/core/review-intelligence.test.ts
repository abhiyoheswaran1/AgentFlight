import { describe, expect, it } from "vitest";
import { analyzeRisk } from "../../src/core/risk.js";
import {
  buildReviewIntelligence,
  classifyVerificationProofKind
} from "../../src/core/review-intelligence.js";
import type { AgentFlightSession, VerificationRun } from "../../src/types/index.js";

describe("review intelligence", () => {
  it("ranks auth files above docs and tests and explains missing proof", () => {
    const changedFiles = ["docs/usage.md", "tests/auth.test.ts", "src/auth/session.ts"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session: testSession({
        verificationCommands: ["npm test"],
        verificationRuns: []
      })
    });

    expect(review.focus[0]).toMatchObject({
      rank: 1,
      file: "src/auth/session.ts",
      category: "auth",
      proofStatus: "missing"
    });
    expect(review.focus[0]?.reasons).toContain("identity/session path");
    expect(review.focus[0]?.reasons).toContain("no passing test evidence");
    expect(review.proofGaps).toContainEqual(
      expect.objectContaining({
        id: "missing-auth-test-proof",
        severity: "blocking",
        suggestedCommand: "npm test",
        relatedFiles: ["src/auth/session.ts"]
      })
    );
    expect(review.readiness).toMatchObject({
      state: "needs_verification",
      label: "Needs verification",
      suggestedCommand: "npm test"
    });
  });

  it("marks failed verification as blocking review readiness", () => {
    const failedRun = verificationRun("npm test", "failed");
    const changedFiles = ["src/api/users.ts"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session: testSession({
        verificationCommands: ["npm test"],
        verificationRuns: [failedRun]
      })
    });

    expect(review.readiness).toMatchObject({
      state: "blocked_by_failed_verification",
      label: "Blocked by failed verification",
      suggestedCommand: "npm test"
    });
    expect(review.proofGaps[0]).toMatchObject({
      id: "failed-verification",
      severity: "blocking",
      suggestedCommand: "npm test"
    });
    expect(review.focus[0]?.proofStatus).toBe("failed");
  });

  it("marks incomplete verification events as proof gaps and blocks readiness", () => {
    const changedFiles = ["src/auth/session.ts"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session: testSession({
        verificationCommands: ["npm test"],
        verificationRuns: [],
        events: [
          event("session_started", "Session started", "2026-06-14T12:00:00.000Z"),
          event("verification_started", "Verification started", "2026-06-14T12:01:00.000Z", {
            command: "npm test"
          })
        ]
      })
    });

    expect(review.proofGaps).toContainEqual(
      expect.objectContaining({
        id: "incomplete-verification",
        severity: "blocking",
        suggestedCommand: "npm test"
      })
    );
    expect(review.readiness).toMatchObject({
      state: "needs_verification",
      label: "Needs verification",
      suggestedCommand: "npm test"
    });
    expect(review.readiness.reason).toContain("started but no completed result was recorded");
    expect(review.readiness.nextAction).toContain("agentflight verify -- npm test");
  });

  it("does not mark a started verification as incomplete after a later successful run", () => {
    const changedFiles = ["src/auth/session.ts"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session: testSession({
        verificationCommands: ["npm test"],
        verificationRuns: [verificationRun("npm test", "passed")],
        events: [
          event("session_started", "Session started", "2026-06-14T12:00:00.000Z"),
          event("verification_started", "Verification started", "2026-06-14T12:01:00.000Z", {
            command: "npm test"
          })
        ]
      })
    });

    expect(review.proofGaps.map((gap) => gap.id)).not.toContain("incomplete-verification");
    expect(review.readiness.state).toBe("ready_for_review");
  });

  it("treats docs-only changes without proof as ready for review", () => {
    const changedFiles = ["docs/roadmap/index.md"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session: testSession({
        verificationCommands: [],
        verificationRuns: []
      })
    });

    expect(review.proofGaps).toEqual([]);
    expect(review.focus[0]).toMatchObject({
      file: "docs/roadmap/index.md",
      proofStatus: "not_required"
    });
    expect(review.readiness).toMatchObject({
      state: "ready_for_review",
      label: "Ready for review"
    });
  });

  it("classifies AgentFlight config as project config without high risk scoring", () => {
    const changedFiles = [".agentflight/config.json", "README.md"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session: testSession({
        verificationCommands: [],
        verificationRuns: []
      })
    });

    const configFocus = review.focus.find((item) => item.file === ".agentflight/config.json");
    expect(configFocus).toMatchObject({
      category: "agentflight/config",
      riskLevel: "medium",
      proofStatus: "not_required"
    });
    expect(configFocus?.reasons).toContain("AgentFlight project config");
    expect(configFocus?.suggestedReviewerFocus).toContain("AgentFlight session defaults");
    expect(review.proofGaps.map((gap) => gap.id)).not.toContain("missing-config-proof");
  });

  it("suggests a configurable ProjScan memory filter without hiding it by default", () => {
    const changedFiles = [".projscan-memory/memory.json", "README.md"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session: testSession({
        verificationCommands: [],
        verificationRuns: []
      })
    });

    expect(review.proofGaps).toContainEqual(
      expect.objectContaining({
        id: "suggest-projscan-memory-filter",
        severity: "info",
        relatedFiles: [".projscan-memory/memory.json"]
      })
    );
    expect(review.proofGaps[0]?.message).toContain(".projscan-memory/**");
    expect(review.proofGaps[0]?.message).toContain("changedFileFilters.ignore");
    expect(review.readiness.state).toBe("ready_for_review");
  });

  it("requires build proof for frontend changes and suggests the configured build command", () => {
    const changedFiles = ["src/components/LoginForm.tsx"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session: testSession({
        verificationCommands: ["npm run build"],
        verificationRuns: []
      })
    });

    expect(review.proofGaps).toContainEqual(
      expect.objectContaining({
        id: "missing-frontend-build-proof",
        severity: "warning",
        suggestedCommand: "npm run build"
      })
    );
    expect(review.readiness).toMatchObject({
      state: "needs_verification",
      suggestedCommand: "npm run build"
    });
  });

  it("flags package and config changes with targeted proof gaps", () => {
    const changedFiles = ["package.json", ".github/workflows/release.yml"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session: testSession({
        verificationCommands: ["npm run typecheck", "npm run build"],
        verificationRuns: []
      })
    });

    expect(review.focus.map((item) => item.file)).toEqual([
      ".github/workflows/release.yml",
      "package.json"
    ]);
    expect(review.proofGaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "missing-config-proof",
          severity: "warning",
          suggestedCommand: "npm run typecheck",
          relatedFiles: [".github/workflows/release.yml"]
        }),
        expect.objectContaining({
          id: "missing-dependency-proof",
          severity: "warning",
          suggestedCommand: "npm run typecheck",
          relatedFiles: ["package.json"]
        })
      ])
    );
    expect(review.readiness).toMatchObject({
      state: "needs_verification",
      suggestedCommand: "npm run typecheck"
    });
  });

  it("uses passing verification evidence to mark high-risk files as covered", () => {
    const changedFiles = ["src/auth/session.ts"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session: testSession({
        verificationCommands: ["npm test"],
        verificationRuns: [verificationRun("npm test", "passed")]
      })
    });

    expect(review.proofGaps).toEqual([]);
    expect(review.focus[0]).toMatchObject({
      file: "src/auth/session.ts",
      proofStatus: "covered"
    });
    expect(review.readiness).toMatchObject({
      state: "ready_for_review",
      label: "Ready for review"
    });
  });

  it("handles old sessions without verification runs", () => {
    const changedFiles = ["src/api/users.ts"];
    const session = testSession({
      verificationCommands: ["npm test"]
    });
    delete session.verificationRuns;

    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session
    });

    expect(review.readiness.state).toBe("needs_verification");
    expect(review.proofGaps[0]?.suggestedCommand).toBe("npm test");
  });

  it("classifies verification commands into proof kinds", () => {
    expect(classifyVerificationProofKind("npm test")).toBe("test");
    expect(classifyVerificationProofKind("npm run build")).toBe("build");
    expect(classifyVerificationProofKind("npm run typecheck")).toBe("typecheck");
    expect(classifyVerificationProofKind("eslint .")).toBe("lint");
    expect(classifyVerificationProofKind("npm ci")).toBe("install");
    expect(classifyVerificationProofKind("node scripts/custom-check.js")).toBe("unknown");
  });
});

function testSession(options: {
  verificationCommands: string[];
  verificationRuns?: VerificationRun[] | undefined;
  events?: AgentFlightSession["events"] | undefined;
}): AgentFlightSession {
  return {
    id: "af-test",
    task: { title: "Review intelligence" },
    startedAt: "2026-06-14T12:00:00.000Z",
    repoRoot: "/repo",
    git: { branch: "main", commit: "abc123", dirty: false, changedFiles: [] },
    packageManager: "npm",
    verificationCommands: options.verificationCommands,
    verificationRuns: options.verificationRuns ?? [],
    events: options.events ?? [],
    tools: {
      projscan: { available: false, warnings: [] },
      agentloopkit: { available: false, warnings: [] }
    }
  };
}

function event(
  type: NonNullable<AgentFlightSession["events"]>[number]["type"],
  title: string,
  timestamp: string,
  metadata?: Record<string, unknown>
): NonNullable<AgentFlightSession["events"]>[number] {
  return {
    id: `evt-${type}-${timestamp}`,
    type,
    timestamp,
    title,
    ...(metadata ? { metadata } : {})
  };
}

function verificationRun(command: string, status: "passed" | "failed"): VerificationRun {
  return {
    command,
    startedAt: "2026-06-14T12:01:00.000Z",
    finishedAt: "2026-06-14T12:01:05.000Z",
    durationMs: 5000,
    exitCode: status === "passed" ? 0 : 1,
    status,
    stdoutPath: ".agentflight/evidence/af-test/verification-1.stdout.txt",
    stderrPath: ".agentflight/evidence/af-test/verification-1.stderr.txt"
  };
}
