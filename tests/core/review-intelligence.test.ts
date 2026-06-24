import { describe, expect, it } from "vitest";
import { analyzeRisk } from "../../src/core/risk.js";
import {
  buildReviewIntelligence,
  classifyVerificationProofKind
} from "../../src/core/review-intelligence.js";
import type {
  AgentFlightSession,
  ProofSnapshot,
  ReviewReadinessState,
  VerificationRun
} from "../../src/types/index.js";

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
    expect(review.trustDelta!.items[0]).toMatchObject({
      kind: "missing_proof",
      severity: "blocking",
      suggestedCommand: "npm test",
      relatedFiles: ["src/auth/session.ts"]
    });
    expect(review.reviewQueue![0]).toMatchObject({
      action: "run_missing_proof",
      label: "Run missing proof",
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
    expect(review.trustDelta!.summary).toBe("Trust changed because failed proof blocks review.");
    expect(review.trustDelta!.items[0]).toMatchObject({
      kind: "failed_proof",
      severity: "blocking",
      suggestedCommand: "npm test"
    });
    expect(review.reviewQueue![0]).toMatchObject({
      action: "fix_failed_proof",
      label: "Fix failed proof",
      suggestedCommand: "npm test"
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

  it("builds a trust delta and review queue for under-proven local-history guidance", () => {
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

    expect(review.trustDelta).toMatchObject({
      summary: "Proof exists, but similar local ready handoffs used stronger proof.",
      items: [
        {
          kind: "repo_calibration",
          severity: "warning",
          suggestedCommand: "npm run e2e:auth",
          relatedFiles: ["src/auth/session.ts"]
        }
      ]
    });
    expect(review.reviewQueue![0]).toMatchObject({
      action: "consider_repo_calibration",
      label: "Consider stronger local-history proof",
      suggestedCommand: "npm run e2e:auth",
      relatedFiles: ["src/auth/session.ts"]
    });
    expect(review.readiness.state).toBe("ready_for_review");
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

  it("keeps required test proof stale when a newer unrelated build proof is current", () => {
    const changedFiles = ["src/auth/session.ts"];
    const currentProofSnapshot = proofSnapshot({ "src/auth/session.ts": "new" });
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
        verificationCommands: ["npm test", "npm run build"],
        verificationRuns: [
          verificationRun("npm test", "passed", {
            proofSnapshot: proofSnapshot({ "src/auth/session.ts": "old" }),
            finishedAt: "2026-06-14T12:01:05.000Z"
          }),
          verificationRun("npm run build", "passed", {
            proofSnapshot: currentProofSnapshot,
            finishedAt: "2026-06-14T12:02:05.000Z"
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
      suggestedCommand: "npm test",
      relatedProofGapIds: ["stale-verification-proof"]
    });
    expect(review.trustDelta?.items[0]).toMatchObject({
      kind: "stale_proof",
      message: "Test proof is stale; files changed after proof was captured."
    });
    expect(review.readiness.state).toBe("needs_verification");
  });

  it("uses a current accepted proof kind when another accepted proof kind is stale", () => {
    const changedFiles = ["migrations/20260624000000_create_sessions.sql"];
    const currentProofSnapshot = proofSnapshot({
      "migrations/20260624000000_create_sessions.sql": "new"
    });
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      currentProofSnapshot,
      projectReviewContract: {
        enabled: true,
        rules: [
          {
            id: "database-contract",
            label: "Database migration contract",
            categories: ["database/migrations"],
            requiredProof: ["test", "build"],
            severity: "blocking"
          }
        ]
      },
      session: testSession({
        verificationCommands: ["npm test", "npm run build"],
        verificationRuns: [
          verificationRun("npm test", "passed", {
            proofSnapshot: proofSnapshot({
              "migrations/20260624000000_create_sessions.sql": "old"
            }),
            finishedAt: "2026-06-14T12:01:05.000Z"
          }),
          verificationRun("npm run build", "passed", {
            proofSnapshot: currentProofSnapshot,
            finishedAt: "2026-06-14T12:02:05.000Z"
          })
        ]
      })
    });

    expect(review.projectReviewContract?.requirements[0]).toMatchObject({
      status: "supported",
      proofStatus: "current",
      satisfiedProof: {
        kind: "build",
        command: "npm run build"
      },
      proofReason: "Satisfied by current build proof: npm run build",
      relatedProofGapIds: []
    });
    expect(review.proofGaps.map((gap) => gap.id)).not.toContain("stale-verification-proof");
  });

  it("keeps OR proof requirements supported when a different accepted proof kind failed", () => {
    const changedFiles = ["migrations/20260624000000_create_sessions.sql"];
    const currentProofSnapshot = proofSnapshot({
      "migrations/20260624000000_create_sessions.sql": "fresh"
    });
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      currentProofSnapshot,
      projectReviewContract: {
        enabled: true,
        rules: [
          {
            id: "database-contract",
            label: "Database migration contract",
            categories: ["database/migrations"],
            requiredProof: ["test", "build"],
            severity: "blocking"
          }
        ]
      },
      session: testSession({
        verificationCommands: ["npm test", "npm run build"],
        verificationRuns: [
          verificationRun("npm test", "failed"),
          verificationRun("npm run build", "passed", {
            proofSnapshot: currentProofSnapshot
          })
        ]
      })
    });

    expect(review.projectReviewContract?.requirements[0]).toMatchObject({
      status: "supported",
      proofStatus: "current",
      satisfiedProof: {
        kind: "build",
        command: "npm run build"
      },
      proofReason: "Satisfied by current build proof: npm run build",
      relatedProofGapIds: []
    });
    expect(review.proofGaps.map((gap) => gap.id)).toContain("failed-verification");
  });

  it("treats e2e commands as test proof for project review contract requirements", () => {
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
        verificationCommands: ["npm run e2e:auth"],
        verificationRuns: [
          verificationRun("npm run e2e:auth", "passed", {
            proofSnapshot: currentProofSnapshot
          })
        ]
      })
    });

    expect(review.projectReviewContract?.requirements[0]).toMatchObject({
      status: "supported",
      proofStatus: "current",
      satisfiedProof: {
        kind: "test",
        command: "npm run e2e:auth"
      },
      relatedProofGapIds: []
    });
    expect(review.proofGaps).toEqual([]);
    expect(review.readiness.state).toBe("ready_for_review");
  });

  it("does not mark proof-required files stale when only manual-review files changed after proof", () => {
    const changedFiles = ["README.md", "src/auth/session.ts"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      currentProofSnapshot: proofSnapshot({
        "README.md": "new-docs",
        "src/auth/session.ts": "same-auth"
      }),
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
            proofSnapshot: proofSnapshot({
              "README.md": "old-docs",
              "src/auth/session.ts": "same-auth"
            })
          })
        ]
      })
    });

    expect(review.proofGaps.map((gap) => gap.id)).not.toContain("stale-verification-proof");
    expect(review.projectReviewContract?.requirements[0]).toMatchObject({
      status: "supported",
      proofStatus: "current",
      relatedProofGapIds: []
    });
    expect(review.readiness.state).toBe("ready_for_review");
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
    expect(review.trustDelta).toMatchObject({
      summary: "Trust changed because proof is stale or missing.",
      items: [
        {
          kind: "stale_proof",
          severity: "warning",
          suggestedCommand: "npm test",
          relatedFiles: ["src/auth/session.ts"]
        }
      ]
    });
    expect(review.reviewQueue![0]).toMatchObject({
      action: "rerun_stale_proof",
      label: "Rerun stale proof",
      suggestedCommand: "npm test",
      relatedFiles: ["src/auth/session.ts"]
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

  it("keeps all stale project-contract files in trust delta and review queue", () => {
    const changedFiles = ["src/auth/session.ts", "src/core/output.ts"];
    const currentProofSnapshot = proofSnapshot({
      "src/auth/session.ts": "new-auth",
      "src/core/output.ts": "new-source"
    });
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
          },
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
        verificationRuns: [
          verificationRun("npm test", "passed", {
            proofSnapshot: proofSnapshot({
              "src/auth/session.ts": "old-auth",
              "src/core/output.ts": "old-source"
            })
          })
        ]
      })
    });

    expect(review.proofGaps.filter((gap) => gap.id === "stale-verification-proof")).toHaveLength(3);
    expect(
      review.trustDelta?.items.find((item) => item.kind === "stale_proof")?.relatedFiles
    ).toEqual(["src/auth/session.ts", "src/core/output.ts"]);
    expect(review.reviewQueue?.[0]).toMatchObject({
      action: "rerun_stale_proof",
      relatedFiles: ["src/auth/session.ts", "src/core/output.ts"]
    });
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
    expect(review.trustDelta).toMatchObject({
      summary: "Ready for review; manual review remains.",
      items: [
        {
          kind: "manual_review",
          severity: "info",
          relatedFiles: ["README.md"]
        }
      ]
    });
    expect(review.reviewQueue![0]).toMatchObject({
      action: "inspect_manual_review",
      label: "Review manual-only changes",
      relatedFiles: ["README.md"]
    });
  });

  it("keeps verification route clear when only review-only files are stale", () => {
    const changedFiles = ["src/core/output.ts", "README.md"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      currentProofSnapshot: proofSnapshot({
        "src/core/output.ts": "same-source",
        "README.md": "new-docs"
      }),
      session: testSession({
        verificationCommands: ["npm test"],
        verificationRuns: [
          verificationRun("npm test", "passed", {
            proofSnapshot: proofSnapshot({
              "src/core/output.ts": "same-source",
              "README.md": "old-docs"
            })
          })
        ]
      })
    });

    const verificationRoute = review.reviewRoutes?.items.find(
      (item) => item.role === "verification"
    );

    expect(review.proofGaps.map((gap) => gap.id)).not.toContain("stale-verification-proof");
    expect(review.proofFreshness).toMatchObject({
      state: "stale",
      staleFiles: ["README.md"]
    });
    expect(verificationRoute).toMatchObject({
      role: "verification",
      status: "clear",
      summary: "Recorded proof is current for the proof-relevant change.",
      reason: "Verification evidence matches the current proof state.",
      relatedFiles: ["src/core/output.ts"]
    });
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

  it("marks an accepted local review receipt as current when changed-file fingerprints still match", () => {
    const changedFiles = ["src/auth/session.ts"];
    const snapshot = proofSnapshot({ "src/auth/session.ts": "same" });
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      currentProofSnapshot: snapshot,
      session: testSession({
        verificationCommands: ["npm test"],
        verificationRuns: [verificationRun("npm test", "passed", { proofSnapshot: snapshot })],
        reviewReceipts: [
          reviewReceipt({
            proofSnapshot: snapshot,
            changedFiles,
            readinessState: "ready_for_review"
          })
        ]
      })
    });

    expect(review.reviewReceipt).toMatchObject({
      state: "current",
      label: "Review receipt current",
      staleFiles: [],
      receipt: {
        decision: "accepted",
        summary: "Accepted local handoff."
      }
    });
    expect(review.trustDelta!.items.map((item) => item.kind)).not.toContain("stale_receipt");
  });

  it("marks an accepted local review receipt stale when proof fails after acceptance", () => {
    const changedFiles = ["src/auth/session.ts"];
    const snapshot = proofSnapshot({ "src/auth/session.ts": "same" });
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      currentProofSnapshot: snapshot,
      session: testSession({
        verificationCommands: ["npm test"],
        verificationRuns: [
          verificationRun("npm test", "passed", {
            proofSnapshot: snapshot,
            finishedAt: "2026-06-14T12:05:00.000Z"
          }),
          verificationRun("npm test", "failed", {
            proofSnapshot: snapshot,
            finishedAt: "2026-06-14T12:20:00.000Z"
          })
        ],
        reviewReceipts: [
          reviewReceipt({
            proofSnapshot: snapshot,
            changedFiles,
            readinessState: "ready_for_review",
            recordedAt: "2026-06-14T12:10:00.000Z"
          })
        ]
      })
    });

    expect(review.reviewReceipt).toMatchObject({
      state: "stale",
      label: "Review receipt stale",
      summary: "Accepted handoff is stale because verification failed after review.",
      staleFiles: changedFiles
    });
    expect(review.trustDelta?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "failed_proof",
          severity: "blocking"
        }),
        expect.objectContaining({
          kind: "stale_receipt",
          severity: "warning",
          message: "Accepted handoff is stale because verification failed after review.",
          relatedFiles: changedFiles
        })
      ])
    );
  });

  it("marks an accepted local review receipt stale when changed files differ after acceptance", () => {
    const changedFiles = ["src/auth/session.ts"];
    const receiptSnapshot = proofSnapshot({ "src/auth/session.ts": "before-review" });
    const currentSnapshot = proofSnapshot({ "src/auth/session.ts": "after-review" });
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      currentProofSnapshot: currentSnapshot,
      session: testSession({
        verificationCommands: ["npm test"],
        verificationRuns: [
          verificationRun("npm test", "passed", { proofSnapshot: currentSnapshot })
        ],
        reviewReceipts: [
          reviewReceipt({
            proofSnapshot: receiptSnapshot,
            changedFiles,
            readinessState: "ready_for_review"
          })
        ]
      })
    });

    expect(review.reviewReceipt).toMatchObject({
      state: "stale",
      label: "Review receipt stale",
      staleFiles: ["src/auth/session.ts"],
      nextAction: "Regenerate the handoff after re-review."
    });
    expect(review.trustDelta!.items[0]).toMatchObject({
      kind: "stale_receipt",
      severity: "warning",
      relatedFiles: ["src/auth/session.ts"]
    });
    expect(review.reviewQueue![0]).toMatchObject({
      action: "refresh_review_receipt",
      label: "Refresh stale review receipt",
      relatedFiles: ["src/auth/session.ts"]
    });
  });

  it("keeps blocked review receipts in trust delta, queue, and maintainer routing", () => {
    const changedFiles = ["src/auth/session.ts"];
    const snapshot = proofSnapshot({ "src/auth/session.ts": "same" });
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      currentProofSnapshot: snapshot,
      session: testSession({
        verificationCommands: ["npm test"],
        verificationRuns: [verificationRun("npm test", "passed", { proofSnapshot: snapshot })],
        reviewReceipts: [
          reviewReceipt({
            decision: "blocked",
            proofSnapshot: snapshot,
            changedFiles,
            readinessState: "ready_for_review"
          })
        ]
      })
    });

    expect(review.reviewReceipt).toMatchObject({
      state: "blocked",
      label: "Review receipt blocked"
    });
    expect(review.trustDelta?.items[0]).toMatchObject({
      kind: "review_receipt",
      severity: "blocking",
      message: "Local review recorded a blocker.",
      relatedFiles: changedFiles
    });
    expect(review.reviewQueue).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "refresh_review_receipt",
          label: "Resolve review receipt",
          relatedFiles: changedFiles
        })
      ])
    );
    expect(review.reviewRoutes?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "maintainer",
          status: "blocked"
        })
      ])
    );
  });

  it("keeps needs-changes review receipts in trust delta and queue", () => {
    const changedFiles = ["README.md"];
    const snapshot = proofSnapshot({ "README.md": "same" });
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      currentProofSnapshot: snapshot,
      session: testSession({
        verificationCommands: ["npm test"],
        verificationRuns: [verificationRun("npm test", "passed", { proofSnapshot: snapshot })],
        reviewReceipts: [
          reviewReceipt({
            decision: "needs_changes",
            proofSnapshot: snapshot,
            changedFiles,
            readinessState: "ready_for_review"
          })
        ]
      })
    });

    expect(review.reviewReceipt).toMatchObject({
      state: "needs_changes",
      label: "Review receipt needs changes"
    });
    expect(review.trustDelta?.items[0]).toMatchObject({
      kind: "review_receipt",
      severity: "warning",
      message: "Local review recorded requested changes.",
      relatedFiles: changedFiles
    });
    expect(review.reviewQueue).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "refresh_review_receipt",
          label: "Resolve review receipt",
          relatedFiles: changedFiles
        })
      ])
    );
    expect(review.trustDelta?.items.map((item) => item.kind)).not.toContain("ready");
  });

  it("routes failed auth work to maintainer, verification, and security reviewers", () => {
    const changedFiles = ["src/auth/session.ts", "README.md"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session: testSession({
        verificationCommands: ["npm test"],
        verificationRuns: [verificationRun("npm test", "failed")]
      })
    });

    expect(review.reviewRoutes?.summary).toBe("4 reviewer routes need attention before trust.");
    expect(review.reviewRoutes?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "maintainer",
          status: "blocked",
          relatedFiles: expect.arrayContaining(["src/auth/session.ts"])
        }),
        expect.objectContaining({
          role: "verification",
          status: "blocked",
          relatedProofGapIds: expect.arrayContaining(["failed-verification"]),
          suggestedCommand: "npm test"
        }),
        expect.objectContaining({
          role: "security",
          status: "blocked",
          relatedFiles: expect.arrayContaining(["src/auth/session.ts"])
        }),
        expect.objectContaining({
          role: "docs_dx",
          status: "needs_review",
          relatedFiles: ["README.md"]
        })
      ])
    );
  });

  it("routes docs-only changes to docs/DX without inventing proof work", () => {
    const changedFiles = ["docs/usage.md"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session: testSession({
        verificationCommands: [],
        verificationRuns: []
      })
    });

    expect(review.reviewRoutes?.items.map((route) => route.role)).toEqual([
      "maintainer",
      "docs_dx"
    ]);
    expect(review.reviewRoutes?.items.find((route) => route.role === "docs_dx")).toMatchObject({
      status: "needs_review",
      relatedFiles: ["docs/usage.md"],
      relatedProofGapIds: []
    });
    expect(review.reviewRoutes?.items.some((route) => route.role === "verification")).toBe(false);
  });

  it("routes dependency and config changes through release review", () => {
    const changedFiles = ["package.json", ".github/workflows/ci.yml"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session: testSession({
        verificationCommands: ["npm run build"],
        verificationRuns: [verificationRun("npm run build", "passed")]
      })
    });

    expect(review.reviewRoutes?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "release",
          status: "needs_review",
          relatedFiles: expect.arrayContaining(["package.json", ".github/workflows/ci.yml"])
        })
      ])
    );
  });

  it("does not route reviewers for a clean worktree", () => {
    const review = buildReviewIntelligence({
      changedFiles: [],
      risk: analyzeRisk([]),
      session: testSession({
        verificationCommands: ["npm test"],
        verificationRuns: [verificationRun("npm test", "passed")]
      })
    });

    expect(review.reviewRoutes).toEqual({
      summary: "No reviewer routing needed for the current worktree.",
      items: []
    });
  });

  it("still routes failed proof when no files are changed", () => {
    const review = buildReviewIntelligence({
      changedFiles: [],
      risk: analyzeRisk([]),
      session: testSession({
        verificationCommands: ["npm test"],
        verificationRuns: [verificationRun("npm test", "failed")]
      })
    });

    expect(review.reviewRoutes?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "verification",
          status: "blocked",
          suggestedCommand: "npm test",
          relatedProofGapIds: ["failed-verification"]
        })
      ])
    );
  });

  it("does not create a clear verification route for docs-only stale proof", () => {
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

    expect(review.reviewRoutes?.items.some((route) => route.role === "verification")).toBe(false);
    expect(review.reviewRoutes?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "docs_dx",
          status: "needs_review",
          relatedFiles: ["README.md"]
        })
      ])
    );
  });

  it("routes uppercase changelog and devlog files through release review", () => {
    const changedFiles = ["CHANGELOG.md", "AGENTFLIGHT_DEVLOG.md"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session: testSession({
        verificationCommands: [],
        verificationRuns: []
      })
    });

    expect(review.reviewRoutes?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "release",
          status: "needs_review",
          relatedFiles: ["AGENTFLIGHT_DEVLOG.md", "CHANGELOG.md"]
        })
      ])
    );
  });

  it("marks accepted legacy review receipts stale when comparable snapshots are unavailable", () => {
    const changedFiles = ["src/auth/session.ts"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session: testSession({
        verificationCommands: ["npm test"],
        verificationRuns: [verificationRun("npm test", "passed")],
        reviewReceipts: [
          {
            id: "receipt-legacy",
            decision: "accepted",
            recordedAt: "2026-06-14T12:10:00.000Z",
            summary: "Accepted local handoff.",
            snapshot: {
              branch: "main",
              gitCommit: "abc123",
              changedFiles,
              readinessState: "ready_for_review",
              verificationPassed: 1,
              verificationFailed: 0,
              artifactPath: ".agentflight/reports/af-test-handoff.md"
            }
          }
        ]
      })
    });

    expect(review.reviewReceipt).toMatchObject({
      state: "stale",
      staleFiles: ["src/auth/session.ts"]
    });
    expect(review.reviewRoutes?.items.some((route) => route.role === "release")).toBe(false);
    expect(review.reviewQueue).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "refresh_review_receipt",
          relatedFiles: ["src/auth/session.ts"]
        })
      ])
    );
  });

  it("does not describe legacy proof freshness as current in verification routing", () => {
    const changedFiles = ["src/auth/session.ts"];
    const review = buildReviewIntelligence({
      changedFiles,
      risk: analyzeRisk(changedFiles),
      session: testSession({
        verificationCommands: ["npm test"],
        verificationRuns: [verificationRun("npm test", "passed")]
      })
    });

    expect(review.proofFreshness).toMatchObject({
      state: "legacy",
      reason: "Passing verification proof was recorded before proof freshness snapshots existed."
    });
    expect(review.reviewRoutes?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "verification",
          status: "needs_review",
          summary: "Proof exists, but freshness cannot be compared for the proof-relevant change."
        })
      ])
    );
  });

  it("classifies verification commands into proof kinds", () => {
    expect(classifyVerificationProofKind("npm test")).toBe("test");
    expect(classifyVerificationProofKind("npm run verify")).toBe("test");
    expect(classifyVerificationProofKind("npm run e2e:auth")).toBe("test");
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
  reviewReceipts?: AgentFlightSession["reviewReceipts"] | undefined;
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
    reviewReceipts: options.reviewReceipts ?? [],
    events: options.events ?? [],
    tools: {
      projscan: { available: false, warnings: [] },
      agentloopkit: { available: false, warnings: [] }
    }
  };
}

function reviewReceipt(options: {
  decision?: NonNullable<AgentFlightSession["reviewReceipts"]>[number]["decision"] | undefined;
  proofSnapshot: ProofSnapshot;
  changedFiles: string[];
  readinessState: ReviewReadinessState;
  recordedAt?: string | undefined;
}): NonNullable<AgentFlightSession["reviewReceipts"]>[number] {
  return {
    id: "receipt-20260614-121000-accepted-001",
    decision: options.decision ?? "accepted",
    recordedAt: options.recordedAt ?? "2026-06-14T12:10:00.000Z",
    summary: "Accepted local handoff.",
    snapshot: {
      branch: "main",
      gitCommit: "abc123",
      changedFiles: options.changedFiles,
      readinessState: options.readinessState,
      verificationPassed: 1,
      verificationFailed: 0,
      artifactPath: ".agentflight/reports/af-test-handoff.md",
      proofSnapshot: options.proofSnapshot
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
