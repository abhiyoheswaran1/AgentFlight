import { describe, expect, it } from "vitest";
import { analyzeRisk } from "../../src/core/risk.js";
import {
  buildReviewIntelligence,
  classifyVerificationProofKind
} from "../../src/core/review-intelligence.js";
import type { AgentFlightSession, ProofSnapshot, VerificationRun } from "../../src/types/index.js";

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
    expect(review.contract).toMatchObject({
      summary: {
        failed: 4,
        supported: 0
      }
    });
  });

  it("does not block readiness when the same failed verification later passes", () => {
    const changedFiles = ["src/api/users.ts"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session: testSession({
        verificationCommands: ["npm test"],
        verificationRuns: [
          verificationRun("npm test", "failed"),
          verificationRun("npm test", "passed")
        ]
      })
    });

    expect(review.proofGaps.map((gap) => gap.id)).not.toContain("failed-verification");
    expect(review.readiness).toMatchObject({
      state: "ready_for_review",
      label: "Ready for review"
    });
    expect(review.focus[0]).toMatchObject({
      proofStatus: "covered"
    });
  });

  it("treats a passed configured verify script as proof for source and test changes", () => {
    const changedFiles = ["src/api/users.ts", "tests/api/users.test.ts"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session: testSession({
        verificationCommands: ["npm run verify"],
        verificationRuns: [verificationRun("npm run verify", "passed")]
      })
    });

    expect(review.proofGaps).toEqual([]);
    expect(review.readiness.state).toBe("ready_for_review");
    expect(review.focus.map((item) => item.proofStatus)).toEqual(["covered", "covered"]);
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
    expect(review.readiness.reason).toContain(
      "Verification is still running or did not record a completed result: npm test"
    );
    expect(review.readiness.nextAction).toContain(
      "Wait for the command to finish; if no result appears, rerun agentflight verify -- npm test"
    );
  });

  it.each(["agentflight replay", "node dist/cli.js replay"])(
    "does not promote incomplete artifact command %s as proof guidance",
    (command) => {
      const changedFiles = ["src/core/review-intelligence.ts"];
      const review = buildReviewIntelligence({
        changedFiles,
        risk: analyzeRisk(changedFiles),
        session: testSession({
          verificationCommands: ["npm test"],
          verificationRuns: [],
          events: [
            event("session_started", "Session started", "2026-06-14T12:00:00.000Z"),
            event("verification_started", "Verification started", "2026-06-14T12:01:00.000Z", {
              command
            })
          ]
        })
      });

      expect(review.proofGaps.map((gap) => gap.id)).not.toContain("incomplete-verification");
      expect(review.proofGaps).toContainEqual(
        expect.objectContaining({
          id: "missing-source-proof",
          suggestedCommand: "npm test"
        })
      );
      expect(review.readiness).toMatchObject({
        state: "needs_verification",
        suggestedCommand: "npm test"
      });
      expect(review.readiness.nextAction).toBe("Run agentflight verify -- npm test");
    }
  );

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
      label: "Ready for review",
      nextAction: "Run agentflight handoff to generate the local review packet."
    });
  });

  it("classifies AgentFlight config files as project config without high risk scoring", () => {
    const changedFiles = [".agentflight/config.json", ".agentflight/.gitignore", "README.md"];
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
    expect(review.focus.find((item) => item.file === ".agentflight/.gitignore")).toMatchObject({
      category: "agentflight/config",
      riskLevel: "medium",
      proofStatus: "not_required"
    });
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

  it("keeps generated ProjScan memory below real first-run review targets", () => {
    const changedFiles = [".projscan-memory/memory.json", ".agentflight/config.json", "README.md"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session: testSession({
        verificationCommands: [],
        verificationRuns: []
      })
    });

    expect(review.focus.map((item) => item.file)).toEqual([
      ".agentflight/config.json",
      "README.md",
      ".projscan-memory/memory.json"
    ]);
    expect(review.focus.find((item) => item.file === ".projscan-memory/memory.json")).toMatchObject(
      {
        category: "unknown",
        proofStatus: "not_required",
        suggestedReviewerFocus:
          "Review only if generated ProjScan memory is meant to be tracked; otherwise add .projscan-memory/** to changedFileFilters.ignore."
      }
    );
    expect(
      review.focus.find((item) => item.file === ".projscan-memory/memory.json")?.reasons
    ).toContain("generated tool state");
  });

  it("keeps generated AgentFlight gitignore below first-run review targets", () => {
    const changedFiles = [
      ".agentflight/.gitignore",
      ".agentflight/config.json",
      "README.md",
      ".projscan-memory/memory.json"
    ];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session: testSession({
        verificationCommands: [],
        verificationRuns: []
      })
    });

    expect(review.focus.map((item) => item.file)).toEqual([
      ".agentflight/config.json",
      "README.md",
      ".agentflight/.gitignore",
      ".projscan-memory/memory.json"
    ]);
    expect(review.focus.find((item) => item.file === ".agentflight/.gitignore")).toMatchObject({
      category: "agentflight/config",
      proofStatus: "not_required",
      suggestedReviewerFocus:
        "Check that AgentFlight runtime evidence stays ignored while config.json remains visible."
    });
    expect(review.focus.find((item) => item.file === ".agentflight/.gitignore")?.reasons).toContain(
      "generated AgentFlight helper"
    );
  });

  it("does not let ProjScan risk hints make generated memory outrank real first-run files", () => {
    const changedFiles = [".projscan-memory/memory.json", ".agentflight/config.json", "README.md"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session: testSession({
        verificationCommands: [],
        verificationRuns: []
      }),
      projscanHints: [
        {
          file: ".projscan-memory/memory.json",
          riskScore: 100,
          reason: "unknown generated file"
        }
      ]
    });

    expect(review.focus.map((item) => item.file)).toEqual([
      ".agentflight/config.json",
      "README.md",
      ".projscan-memory/memory.json"
    ]);
    expect(review.focus.find((item) => item.file === ".projscan-memory/memory.json")).toMatchObject(
      {
        proofStatus: "not_required",
        relatedProofGapIds: ["suggest-projscan-memory-filter"]
      }
    );
    expect(
      review.focus.find((item) => item.file === ".projscan-memory/memory.json")?.reasons
    ).toEqual(["generated tool state"]);
    expect(review.proofGaps.map((gap) => gap.id)).toContain("suggest-projscan-memory-filter");
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

  it("uses source-specific guidance and proof gaps for first-party source changes", () => {
    const changedFiles = ["src/core/review-intelligence.ts"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session: testSession({
        verificationCommands: ["npm run typecheck", "npm test"],
        verificationRuns: []
      })
    });

    expect(review.focus[0]).toMatchObject({
      file: "src/core/review-intelligence.ts",
      category: "source",
      riskLevel: "medium",
      proofStatus: "missing",
      suggestedCommand: "npm test"
    });
    expect(review.focus[0]?.reasons).toContain("source code");
    expect(review.focus[0]?.suggestedReviewerFocus).toContain("core behavior");
    expect(review.proofGaps).toContainEqual(
      expect.objectContaining({
        id: "missing-source-proof",
        severity: "warning",
        suggestedCommand: "npm test",
        relatedFiles: ["src/core/review-intelligence.ts"]
      })
    );
  });

  it("falls back to typecheck for source proof gaps when no test command is configured", () => {
    const changedFiles = ["src/core/review-intelligence.ts"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session: testSession({
        verificationCommands: ["npm run typecheck", "npm run build"],
        verificationRuns: []
      })
    });

    expect(review.proofGaps).toContainEqual(
      expect.objectContaining({
        id: "missing-source-proof",
        suggestedCommand: "npm run typecheck"
      })
    );
    expect(review.readiness).toMatchObject({
      state: "needs_verification",
      suggestedCommand: "npm run typecheck"
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
          suggestedCommand: "npm run build",
          relatedFiles: ["package.json"]
        })
      ])
    );
    expect(review.readiness).toMatchObject({
      state: "needs_verification",
      suggestedCommand: "npm run build"
    });
  });

  it("keeps deterministic fallback ranking when ProjScan hints are absent", () => {
    const changedFiles = ["README.md", "src/components/LoginForm.tsx"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session: testSession({
        verificationCommands: [],
        verificationRuns: [verificationRun("npm run build", "passed")]
      })
    });

    expect(review.focus.map((item) => item.file)).toEqual([
      "src/components/LoginForm.tsx",
      "README.md"
    ]);
    expect(review.focus.flatMap((item) => item.reasons)).not.toContain(
      "ProjScan: public launch messaging changed"
    );
  });

  it("uses ProjScan hints to raise review priority and explain the signal", () => {
    const changedFiles = ["README.md", "src/components/LoginForm.tsx"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session: testSession({
        verificationCommands: [],
        verificationRuns: [verificationRun("npm run build", "passed")]
      }),
      projscanHints: [
        {
          file: "README.md",
          riskScore: 95,
          reason: "public launch messaging changed"
        }
      ]
    });

    expect(review.focus[0]).toMatchObject({
      file: "README.md",
      category: "docs"
    });
    expect(review.focus[0]?.score).toBeGreaterThan(review.focus[1]?.score ?? 0);
    expect(review.focus[0]?.reasons).toContain("ProjScan: public launch messaging changed");
  });

  it("ignores unmatched or malformed ProjScan hints safely", () => {
    const changedFiles = ["README.md", "src/components/LoginForm.tsx"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session: testSession({
        verificationCommands: [],
        verificationRuns: [verificationRun("npm run build", "passed")]
      }),
      projscanHints: [
        { file: "docs/missing.md", riskScore: 100, reason: "not in changed files" },
        { file: "", riskScore: 100, reason: "empty path" },
        { file: "README.md", riskScore: Number.NaN, reason: "" }
      ]
    });

    expect(review.focus.map((item) => item.file)).toEqual([
      "src/components/LoginForm.tsx",
      "README.md"
    ]);
    expect(review.focus.flatMap((item) => item.reasons).join("\n")).not.toContain("ProjScan:");
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

  it("adds repo calibration guidance without blocking otherwise ready proof", () => {
    const changedFiles = ["src/auth/session.ts"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session: testSession({
        verificationCommands: ["npm test", "npm run e2e:auth"],
        verificationRuns: [verificationRun("npm test", "passed")]
      }),
      historicalSessions: [
        historicalReadySession({
          id: "af-auth-1",
          changedFiles: ["src/auth/session.ts"],
          commands: ["npm test", "npm run e2e:auth"]
        }),
        historicalReadySession({
          id: "af-auth-2",
          changedFiles: ["src/auth/password.ts"],
          commands: ["npm test", "npm run e2e:auth"]
        })
      ]
    });

    expect(review.proofGaps).toEqual([]);
    expect(review.readiness.state).toBe("ready_for_review");
    expect(review.calibration).toMatchObject({
      state: "under_proven",
      similarReadySessions: 2,
      suggestions: [
        {
          category: "auth",
          suggestedCommand: "npm run e2e:auth",
          currentProof: ["npm test"],
          historicalProof: ["npm run e2e:auth", "npm test"]
        }
      ]
    });
  });

  it("evaluates project review contract requirements for matching change types", () => {
    const changedFiles = ["src/auth/session.ts"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      projectReviewContract: {
        enabled: true,
        rules: [
          {
            id: "auth-contract",
            label: "Auth/session contract",
            categories: ["auth"],
            requiredProof: ["test"],
            manualReview: ["Review auth flow, session lifetime, and permission boundaries."],
            severity: "blocking"
          }
        ]
      },
      session: testSession({
        verificationCommands: ["npm test"],
        verificationRuns: []
      })
    });

    expect(review.projectReviewContract).toMatchObject({
      enabled: true,
      requirements: [
        {
          id: "auth-contract",
          label: "Auth/session contract",
          status: "missing",
          proofStatus: "missing",
          requiredProof: ["test"],
          manualReview: ["Review auth flow, session lifetime, and permission boundaries."],
          relatedFiles: ["src/auth/session.ts"],
          matchedCategories: [{ category: "auth", files: ["src/auth/session.ts"] }],
          matchReason: "Matched auth changes: src/auth/session.ts",
          proofReason: "No passing test proof recorded.",
          remainingReview: [
            "Run agentflight verify -- npm test.",
            "Review auth flow, session lifetime, and permission boundaries."
          ],
          suggestedCommand: "npm test",
          relatedProofGapIds: ["auth-contract"]
        }
      ],
      summary: {
        total: 1,
        missing: 1,
        manualReview: 1
      }
    });
    expect(review.proofGaps).toContainEqual(
      expect.objectContaining({
        id: "auth-contract",
        severity: "blocking",
        suggestedCommand: "npm test",
        relatedFiles: ["src/auth/session.ts"]
      })
    );
  });

  it("handles project review contract evaluation when legacy sessions omit verification commands", () => {
    const changedFiles = ["src/auth/session.ts"];
    const session = testSession({
      verificationCommands: ["npm test"],
      verificationRuns: []
    });
    delete (session as Partial<AgentFlightSession>).verificationCommands;

    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      projectReviewContract: {
        enabled: true,
        rules: [
          {
            id: "auth-contract",
            label: "Auth/session contract",
            categories: ["auth"],
            requiredProof: ["test"],
            severity: "blocking"
          }
        ]
      },
      session
    });

    expect(review.projectReviewContract?.requirements[0]).toMatchObject({
      id: "auth-contract",
      status: "missing",
      proofStatus: "missing",
      matchReason: "Matched auth changes: src/auth/session.ts",
      proofReason: "No passing test proof recorded."
    });
    expect(review.projectReviewContract?.requirements[0]?.suggestedCommand).toBeUndefined();
    expect(review.proofGaps[0]).toMatchObject({
      id: "auth-contract",
      severity: "blocking"
    });
    expect(review.proofGaps[0]?.suggestedCommand).toBeUndefined();
  });

  it("summarizes broad matched-category reasons while keeping related files", () => {
    const changedFiles = ["src/core/a.ts", "src/core/b.ts", "src/core/c.ts", "src/core/d.ts"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      projectReviewContract: {
        enabled: true,
        rules: [
          {
            id: "source-contract",
            label: "Source contract",
            categories: ["source"],
            requiredProof: ["test"],
            severity: "warning"
          }
        ]
      },
      session: testSession({
        verificationCommands: ["npm test"],
        verificationRuns: []
      })
    });

    expect(review.projectReviewContract?.requirements[0]).toMatchObject({
      matchReason: "Matched source changes: 4 files",
      relatedFiles: changedFiles
    });
  });

  it("marks project review contract proof current while keeping manual review visible", () => {
    const changedFiles = ["src/auth/session.ts"];
    const currentProofSnapshot = proofSnapshot({ "src/auth/session.ts": "fresh" });
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      currentProofSnapshot,
      projectReviewContract: {
        enabled: true,
        rules: [
          {
            id: "auth-contract",
            label: "Auth/session contract",
            categories: ["auth"],
            requiredProof: ["test"],
            manualReview: ["Review auth flow, session lifetime, and permission boundaries."],
            severity: "blocking"
          }
        ]
      },
      session: testSession({
        verificationCommands: ["npm test"],
        verificationRuns: [
          verificationRun("npm test", "passed", {
            proofSnapshot: currentProofSnapshot
          })
        ]
      })
    });

    expect(review.proofGaps).toEqual([]);
    expect(review.projectReviewContract?.requirements[0]).toMatchObject({
      status: "needs_review",
      proofStatus: "current",
      manualReview: ["Review auth flow, session lifetime, and permission boundaries."],
      satisfiedProof: {
        kind: "test",
        command: "npm test"
      },
      proofReason: "Satisfied by current test proof: npm test",
      remainingReview: ["Review auth flow, session lifetime, and permission boundaries."]
    });
    expect(review.readiness.state).toBe("ready_for_review");
  });

  it("marks project review contract proof stale when matching proof snapshots are stale", () => {
    const changedFiles = ["src/auth/session.ts"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      currentProofSnapshot: proofSnapshot({ "src/auth/session.ts": "new" }),
      projectReviewContract: {
        enabled: true,
        rules: [
          {
            id: "auth-contract",
            label: "Auth/session contract",
            categories: ["auth"],
            requiredProof: ["test"],
            severity: "blocking"
          }
        ]
      },
      session: testSession({
        verificationCommands: ["npm test"],
        verificationRuns: [
          verificationRun("npm test", "passed", {
            proofSnapshot: proofSnapshot({ "src/auth/session.ts": "old" })
          })
        ]
      })
    });

    expect(review.projectReviewContract?.requirements[0]).toMatchObject({
      status: "stale",
      proofStatus: "stale",
      satisfiedProof: {
        kind: "test",
        command: "npm test"
      },
      proofReason: "Test proof is stale; files changed after proof was captured.",
      relatedProofGapIds: ["stale-verification-proof"]
    });
  });

  it("does not mark project review contract proof failed after a later matching pass", () => {
    const changedFiles = ["src/auth/session.ts"];
    const currentProofSnapshot = proofSnapshot({ "src/auth/session.ts": "fresh" });
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      currentProofSnapshot,
      projectReviewContract: {
        enabled: true,
        rules: [
          {
            id: "auth-contract",
            label: "Auth/session contract",
            categories: ["auth"],
            requiredProof: ["test"],
            severity: "blocking"
          }
        ]
      },
      session: testSession({
        verificationCommands: ["npm test"],
        verificationRuns: [
          verificationRun("npm test", "failed"),
          verificationRun("npm test", "passed", {
            proofSnapshot: currentProofSnapshot
          })
        ]
      })
    });

    expect(review.proofGaps.map((gap) => gap.id)).not.toContain("failed-verification");
    expect(review.projectReviewContract?.requirements[0]).toMatchObject({
      status: "supported",
      proofStatus: "current",
      satisfiedProof: {
        kind: "test",
        command: "npm test"
      }
    });
    expect(review.readiness.state).toBe("ready_for_review");
  });

  it("leaves project review contract disabled when config disables it", () => {
    const changedFiles = ["src/auth/session.ts"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      projectReviewContract: {
        enabled: false,
        rules: [
          {
            id: "auth-contract",
            label: "Auth/session contract",
            categories: ["auth"],
            requiredProof: ["test"]
          }
        ]
      },
      session: testSession({
        verificationCommands: ["npm test"],
        verificationRuns: []
      })
    });

    expect(review.projectReviewContract).toMatchObject({
      enabled: false,
      requirements: [],
      summary: {
        total: 0
      }
    });
  });

  it("marks matching proof snapshots as current", () => {
    const changedFiles = ["src/auth/session.ts"];
    const currentProofSnapshot = proofSnapshot({ "src/auth/session.ts": "fresh" });
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      currentProofSnapshot,
      session: testSession({
        verificationCommands: ["npm test"],
        verificationRuns: [
          verificationRun("npm test", "passed", {
            proofSnapshot: currentProofSnapshot
          })
        ]
      })
    });

    expect(review.proofGaps).toEqual([]);
    expect(review.focus[0]).toMatchObject({
      file: "src/auth/session.ts",
      proofStatus: "current"
    });
    expect(review.focus[0]?.reasons).toContain("proof current");
    expect(review.contract).toMatchObject({
      summary: {
        supported: 3,
        stale: 0,
        unsupported: 0
      }
    });
    expect(review.readiness).toMatchObject({
      state: "ready_for_review",
      label: "Ready for review"
    });
  });

  it("marks passing proof as stale when current file fingerprints differ", () => {
    const changedFiles = ["src/auth/session.ts"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      currentProofSnapshot: proofSnapshot({ "src/auth/session.ts": "new" }),
      session: testSession({
        verificationCommands: ["npm test"],
        verificationRuns: [
          verificationRun("npm test", "passed", {
            proofSnapshot: proofSnapshot({ "src/auth/session.ts": "old" })
          })
        ]
      })
    });

    expect(review.proofGaps).toContainEqual(
      expect.objectContaining({
        id: "stale-verification-proof",
        severity: "warning",
        suggestedCommand: "npm test",
        relatedFiles: ["src/auth/session.ts"]
      })
    );
    expect(review.focus[0]).toMatchObject({
      file: "src/auth/session.ts",
      proofStatus: "stale",
      relatedProofGapIds: ["stale-verification-proof"]
    });
    expect(review.focus[0]?.reasons).toContain("proof stale");
    expect(review.contract).toMatchObject({
      summary: {
        stale: 2,
        unsupported: 2
      }
    });
    expect(review.readiness).toMatchObject({
      state: "needs_verification",
      label: "Needs verification",
      suggestedCommand: "npm test"
    });
  });

  it("attributes stale proof to proof-required files and keeps rerun guidance", () => {
    const changedFiles = ["src/auth/session.ts", "README.md"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      currentProofSnapshot: proofSnapshot({
        "src/auth/session.ts": "new",
        "README.md": "new-docs"
      }),
      session: testSession({
        verificationCommands: ["npm test"],
        verificationRuns: [
          verificationRun("npm test", "passed", {
            proofSnapshot: proofSnapshot({
              "src/auth/session.ts": "old",
              "README.md": "old-docs"
            })
          })
        ]
      })
    });

    expect(review.proofFreshness).toMatchObject({
      state: "stale",
      staleFiles: ["README.md", "src/auth/session.ts"],
      staleCategories: [
        {
          category: "auth",
          files: ["src/auth/session.ts"],
          proofRequired: true
        },
        {
          category: "docs",
          files: ["README.md"],
          proofRequired: false
        }
      ]
    });
    expect(review.proofGaps).toContainEqual(
      expect.objectContaining({
        id: "stale-verification-proof",
        severity: "warning",
        suggestedCommand: "npm test",
        relatedFiles: ["src/auth/session.ts"]
      })
    );
    expect(review.proofGaps.find((gap) => gap.id === "stale-verification-proof")?.message).toBe(
      "Verification proof is stale for auth changes after proof was captured. Rerun verification for these files. Docs changes also need manual review."
    );
  });

  it("attributes docs-only stale proof as manual review without rerun proof gap", () => {
    const changedFiles = ["README.md"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      currentProofSnapshot: proofSnapshot({ "README.md": "new-docs" }),
      session: testSession({
        verificationCommands: ["npm test"],
        verificationRuns: [
          verificationRun("npm test", "passed", {
            proofSnapshot: proofSnapshot({ "README.md": "old-docs" })
          })
        ]
      })
    });

    expect(review.proofFreshness).toMatchObject({
      state: "stale",
      staleFiles: ["README.md"],
      staleCategories: [
        {
          category: "docs",
          files: ["README.md"],
          proofRequired: false
        }
      ]
    });
    expect(review.proofGaps.map((gap) => gap.id)).not.toContain("stale-verification-proof");
    expect(review.focus[0]).toMatchObject({
      file: "README.md",
      proofStatus: "not_required",
      relatedProofGapIds: []
    });
    expect(review.readiness.state).toBe("ready_for_review");
  });

  it("reports a clean worktree when no files are changed", () => {
    const changedFiles: string[] = [];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session: testSession({
        verificationCommands: ["npm test"],
        verificationRuns: [verificationRun("npm test", "passed")]
      })
    });

    expect(review.focus).toEqual([]);
    expect(review.proofGaps).toEqual([]);
    expect(review.readiness).toMatchObject({
      state: "clean_worktree",
      label: "Clean worktree",
      reason: "No changed files are currently detected.",
      nextAction: "Start a new AgentFlight session when you begin the next task."
    });
  });

  it("does not report a clean worktree while verification is incomplete", () => {
    const changedFiles: string[] = [];
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
    expect(review.readiness.reason).toContain(
      "Verification is still running or did not record a completed result: npm test"
    );
  });

  it("keeps failed verification blocking even when no files are changed", () => {
    const changedFiles: string[] = [];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session: testSession({
        verificationCommands: ["npm test"],
        verificationRuns: [verificationRun("npm test", "failed")]
      })
    });

    expect(review.readiness).toMatchObject({
      state: "blocked_by_failed_verification",
      label: "Blocked by failed verification",
      suggestedCommand: "npm test"
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
    expect(classifyVerificationProofKind("npm run verify")).toBe("test");
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

function historicalReadySession(options: {
  id: string;
  changedFiles: string[];
  commands: string[];
}): AgentFlightSession {
  return {
    id: options.id,
    task: { title: options.id },
    startedAt: options.id.endsWith("2") ? "2026-06-14T12:02:00.000Z" : "2026-06-14T12:01:00.000Z",
    repoRoot: "/repo",
    git: { branch: "main", commit: "abc123", dirty: true, changedFiles: options.changedFiles },
    packageManager: "npm",
    verificationCommands: options.commands,
    verificationRuns: options.commands.map((command) =>
      verificationRun(command, "passed", {
        proofSnapshot: proofSnapshot(
          Object.fromEntries(options.changedFiles.map((file) => [file, command]))
        )
      })
    ),
    events: [
      event("report_generated", "Report generated", "2026-06-14T12:10:00.000Z", {
        path: `.agentflight/reports/${options.id}-proof.md`,
        readiness: {
          state: "ready_for_review",
          label: "Ready for review",
          riskLevel: "high",
          changedFiles: options.changedFiles.length,
          verificationPassed: options.commands.length,
          verificationFailed: 0
        }
      })
    ],
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

function verificationRun(
  command: string,
  status: "passed" | "failed",
  overrides: Partial<VerificationRun> = {}
): VerificationRun {
  const run: VerificationRun = {
    command,
    startedAt: "2026-06-14T12:01:00.000Z",
    finishedAt: "2026-06-14T12:01:05.000Z",
    durationMs: 5000,
    exitCode: status === "passed" ? 0 : 1,
    status,
    stdoutPath: ".agentflight/evidence/af-test/verification-1.stdout.txt",
    stderrPath: ".agentflight/evidence/af-test/verification-1.stderr.txt"
  };
  return { ...run, ...overrides };
}

function proofSnapshot(fileHashes: Record<string, string>): ProofSnapshot {
  const changedFiles = Object.keys(fileHashes).sort((left, right) => left.localeCompare(right));
  return {
    schemaVersion: 1,
    capturedAt: "2026-06-14T12:01:05.000Z",
    gitCommit: "abc123",
    source: "git_status",
    changedFiles,
    hashAlgorithm: "sha256",
    files: changedFiles.map((file) => ({
      path: file,
      state: "present",
      size: 1,
      sha256: fileHashes[file]!
    })),
    fingerprintHash: changedFiles.map((file) => `${file}:${fileHashes[file]}`).join("|")
  };
}
