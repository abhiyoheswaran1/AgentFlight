import { describe, expect, it } from "vitest";
import { renderResumePrompt } from "../../src/renderers/resume-prompt.js";

describe("resume prompt", () => {
  it("escapes raw HTML in Markdown text fields", () => {
    const prompt = renderResumePrompt({
      task: "Continue <img src=x onerror=alert(1)> safely",
      sessionId: "af-resume-html-escape",
      branch: "feature/<unsafe>",
      changedFiles: ["docs/<guide>.md"],
      riskLevel: "low",
      riskReasons: ["Documentation <tag> changed."],
      verificationGaps: ["Run <script>alert(1)</script> proof."],
      latestSnapshotNote: "Snapshot <unsafe>",
      verificationState: "0 passed, 0 failed",
      nextAction: "Review docs/<guide>.md"
    });

    expect(prompt).toContain("Continue &lt;img src=x onerror=alert(1)&gt; safely");
    expect(prompt).toContain("- Git branch: feature/&lt;unsafe&gt;");
    expect(prompt).toContain("- docs/&lt;guide&gt;.md");
    expect(prompt).toContain("- Documentation &lt;tag&gt; changed.");
    expect(prompt).toContain("Run &lt;script&gt;alert(1)&lt;/script&gt; proof.");
    expect(prompt).toContain("Snapshot &lt;unsafe&gt;");
    expect(prompt).not.toContain("<img src=x onerror=alert(1)>");
    expect(prompt).not.toContain("<script>alert(1)</script>");
  });

  it("neutralizes active Markdown in resume identity fields", () => {
    const prompt = renderResumePrompt({
      task: "![proof](javascript:alert(1)) `task`\n# injected",
      sessionId: "[af-session](https://example.test)",
      branch: "# unsafe-branch",
      changedFiles: ["docs/[guide](javascript:alert).md"],
      riskLevel: "low",
      riskReasons: ["![risk](javascript:alert(1))"],
      verificationGaps: [],
      reviewFocus: [
        {
          rank: 1,
          file: "docs/[guide](javascript:alert).md",
          category: "docs",
          riskLevel: "low",
          score: 10,
          reasons: ["![reason](javascript:alert(1))"],
          suggestedReviewerFocus: "`focus` [link](javascript:alert(1))",
          proofStatus: "not_required",
          relatedProofGapIds: []
        }
      ],
      latestSnapshotNote: "![snapshot](javascript:alert(1))",
      verificationState: "0 passed, 0 failed",
      nextAction: "Review locally."
    });

    expect(prompt).toContain("\\!\\[proof\\](javascript:alert(1)) \\`task\\` # injected");
    expect(prompt).toContain("- Session: \\[af-session\\](https://example.test)");
    expect(prompt).toContain("- Git branch: \\# unsafe-branch");
    expect(prompt).toContain("- docs/\\[guide\\](javascript:alert).md");
    expect(prompt).toContain("- \\!\\[risk\\](javascript:alert(1))");
    expect(prompt).toContain("1. docs/\\[guide\\](javascript:alert).md");
    expect(prompt).toContain("- Why: \\!\\[reason\\](javascript:alert(1))");
    expect(prompt).toContain("- Focus: \\`focus\\` \\[link\\](javascript:alert(1))");
    expect(prompt).toContain("\\!\\[snapshot\\](javascript:alert(1))");
    expect(prompt).not.toContain("\n# injected");
  });

  it("includes state, risks, verification gaps, and continuation constraints", () => {
    const prompt = renderResumePrompt({
      task: "Add password reset flow",
      sessionId: "af-1",
      branch: "main",
      changedFiles: ["src/auth/reset.ts"],
      riskLevel: "high",
      riskReasons: ["Authentication-sensitive files changed."],
      verificationGaps: ["No verification evidence recorded."],
      reviewFocus: [
        {
          rank: 1,
          file: "src/auth/reset.ts",
          category: "auth",
          riskLevel: "high",
          score: 130,
          reasons: ["identity/session path", "no passing test evidence"],
          suggestedReviewerFocus: "Check session, permission, and identity boundaries first.",
          proofStatus: "missing",
          suggestedCommand: "npm test",
          relatedProofGapIds: ["missing-auth-test-proof"]
        }
      ],
      proofGaps: [
        {
          id: "missing-auth-test-proof",
          severity: "blocking",
          message:
            "Sensitive auth, payment, or security files changed without passing test evidence.",
          suggestedCommand: "npm test",
          relatedFiles: ["src/auth/reset.ts"]
        }
      ],
      readiness: {
        state: "needs_verification",
        label: "Needs verification",
        reason: "Sensitive auth, payment, or security files changed without passing test evidence.",
        nextAction: "Run agentflight verify -- npm test",
        suggestedCommand: "npm test",
        proofGaps: []
      },
      reviewContract: {
        summary: {
          total: 4,
          supported: 0,
          needsReview: 0,
          unsupported: 4,
          failed: 0,
          stale: 0,
          notTestable: 0,
          unknown: 0
        },
        reviewPath: {
          summary: "Review 4 unsupported claims before sharing.",
          nextAction: "Run agentflight verify -- npm test",
          inspectClaimIds: ["file-src-auth-reset-ts"]
        },
        claims: [
          {
            id: "file-src-auth-reset-ts",
            text: "Changed file reviewed: src/auth/reset.ts",
            status: "unsupported",
            source: "file",
            reason: "identity/session path; no passing test evidence",
            files: ["src/auth/reset.ts"],
            evidence: ["Proof: missing", "Gap: missing-auth-test-proof"],
            proofReferences: [
              {
                kind: "changed_file",
                label: "Changed file: src/auth/reset.ts",
                target: "review-focus-file-src-auth-reset-ts"
              },
              {
                kind: "proof_gap",
                label: "Proof gap: missing-auth-test-proof",
                target: "proof-gap-missing-auth-test-proof"
              }
            ],
            relatedProofGapIds: ["missing-auth-test-proof"],
            suggestedCommand: "npm test"
          }
        ]
      },
      latestSnapshotNote: "Initial implementation completed",
      verificationState: "0 passed, 0 failed",
      nextAction: "Run npm test."
    });

    expect(prompt).toContain("Continue this AgentFlight-recorded coding session safely.");
    expect(prompt).toContain("Add password reset flow");
    expect(prompt).toContain("Latest Snapshot");
    expect(prompt).toContain("Initial implementation completed");
    expect(prompt).toContain("Verification State");
    expect(prompt).toContain("0 passed, 0 failed");
    expect(prompt).toContain("Review Focus");
    expect(prompt).toContain("Review Contract");
    expect(prompt).toContain("Review path: Review 4 unsupported claims before sharing.");
    expect(prompt).toContain("unsupported - Changed file reviewed: src/auth/reset.ts");
    expect(prompt).toContain(
      "Proof refs: Changed file: src/auth/reset.ts; Proof gap: missing-auth-test-proof"
    );
    expect(prompt).toContain("src/auth/reset.ts");
    expect(prompt).toContain("identity/session path");
    expect(prompt).toContain("Proof Gaps");
    expect(prompt).toContain("Sensitive auth, payment, or security files changed");
    expect(prompt).toContain("src/auth/reset.ts");
    expect(prompt).toContain("Do not start unrelated work.");
    expect(prompt).toContain("Do not claim completion without proof.");
    expect(prompt).toContain("Run relevant verification before declaring success.");
  });

  it("includes repo calibration guidance without replacing proof gaps", () => {
    const prompt = renderResumePrompt({
      task: "Update auth flow",
      sessionId: "af-calibrated-resume",
      branch: "main",
      changedFiles: ["src/auth/session.ts"],
      riskLevel: "high",
      riskReasons: ["Authentication-sensitive files changed."],
      verificationGaps: [],
      calibration: {
        source: "local_session_history",
        state: "under_proven",
        summary: "Similar local ready handoffs suggest 1 additional proof command for this change.",
        scannedSessions: 4,
        similarReadySessions: 2,
        suggestions: [
          {
            id: "repo-calibration-auth-e2e",
            status: "under_proven",
            category: "auth",
            message:
              "Similar local ready handoffs for auth changes usually included npm run e2e:auth.",
            currentProof: ["npm test"],
            historicalProof: ["npm run e2e:auth", "npm test"],
            suggestedCommand: "npm run e2e:auth",
            similarReadySessions: 2,
            matchedSessionIds: ["af-auth-1", "af-auth-2"]
          }
        ]
      },
      proofGaps: [],
      trustDelta: {
        summary: "Proof exists, but similar local ready handoffs used stronger proof.",
        items: [
          {
            kind: "repo_calibration",
            severity: "warning",
            message:
              "Similar local ready handoffs for auth changes usually included npm run e2e:auth.",
            relatedFiles: ["src/auth/session.ts"],
            suggestedCommand: "npm run e2e:auth",
            relatedProofGapIds: []
          }
        ]
      },
      reviewQueue: [
        {
          rank: 1,
          action: "consider_repo_calibration",
          label: "Consider stronger local-history proof",
          detail:
            "Similar local ready handoffs for auth changes usually included npm run e2e:auth.",
          relatedFiles: ["src/auth/session.ts"],
          suggestedCommand: "npm run e2e:auth",
          relatedProofGapIds: []
        }
      ],
      reviewRoutes: {
        summary: "2 reviewer routes need attention before trust.",
        items: [
          {
            role: "maintainer",
            label: "Maintainer",
            status: "needs_review",
            priority: 1,
            summary: "Start with the highest-signal changed files and trust-state summary.",
            reason: "Proof exists, but similar local ready handoffs used stronger proof.",
            relatedFiles: ["src/auth/session.ts"],
            suggestedCommand: "npm run e2e:auth",
            relatedProofGapIds: []
          },
          {
            role: "verification",
            label: "Verification",
            status: "needs_review",
            priority: 2,
            summary: "Proof needs a rerun, missing command, or stronger local-history check.",
            reason:
              "Similar local ready handoffs for auth changes usually included npm run e2e:auth.",
            relatedFiles: ["src/auth/session.ts"],
            suggestedCommand: "npm run e2e:auth",
            relatedProofGapIds: []
          }
        ]
      },
      readiness: {
        state: "ready_for_review",
        label: "Ready for review",
        reason: "Verification evidence matches the observed review risk.",
        nextAction: "Run agentflight handoff to generate the local review packet.",
        proofGaps: []
      },
      nextAction: "Run agentflight handoff to generate the local review packet."
    });

    expect(prompt).toContain("## Repo Calibration");
    expect(prompt).toContain("## Trust Delta");
    expect(prompt).toContain("Proof exists, but similar local ready handoffs used stronger proof.");
    expect(prompt).toContain("## Review Queue");
    expect(prompt).toContain("Consider stronger local-history proof");
    expect(prompt).toContain("## Review Routing");
    expect(prompt).toContain("Verification - needs review");
    expect(prompt).toContain(
      "Similar local ready handoffs suggest 1 additional proof command for this change."
    );
    expect(prompt).toContain("- under-proven - auth");
    expect(prompt).toContain("Suggested proof: agentflight verify -- npm run e2e:auth");
    expect(prompt).toContain("## Proof Gaps\nNo proof gaps recorded.");
  });

  it("includes proof freshness attribution when proof is stale", () => {
    const prompt = renderResumePrompt({
      task: "Docs freshness",
      sessionId: "af-freshness",
      branch: "main",
      changedFiles: ["README.md"],
      riskLevel: "low",
      riskReasons: ["Only low-risk docs, tests, or isolated UI files changed."],
      verificationGaps: [],
      proofFreshness: {
        state: "stale",
        reason: "docs changed after proof was captured; manual review remains.",
        staleFiles: ["README.md"],
        staleCategories: [
          {
            category: "docs",
            files: ["README.md"],
            proofRequired: false
          }
        ]
      },
      proofGaps: [],
      readiness: {
        state: "ready_for_review",
        label: "Ready for review",
        reason: "Verification evidence matches the observed review risk.",
        nextAction: "Run agentflight handoff to generate the local review packet.",
        proofGaps: []
      },
      nextAction: "Run agentflight handoff to generate the local review packet."
    });

    expect(prompt).toContain("## Proof Freshness");
    expect(prompt).toContain("docs changed after proof was captured; manual review remains.");
    expect(prompt).toContain("Manual-review stale files: docs (README.md)");
  });

  it("includes local review receipt state in resume prompts", () => {
    const prompt = renderResumePrompt({
      task: "Receipt resume",
      sessionId: "af-receipt-resume",
      branch: "main",
      changedFiles: ["src/auth/session.ts"],
      riskLevel: "high",
      riskReasons: ["Authentication-sensitive files changed."],
      verificationGaps: [],
      reviewReceipt: {
        state: "stale",
        label: "Review receipt stale",
        summary: "Accepted handoff is stale because files changed after review.",
        nextAction: "Regenerate the handoff after re-review.",
        staleFiles: ["src/auth/session.ts"],
        receipt: {
          id: "receipt-20260617-121000-accepted-001",
          decision: "accepted",
          recordedAt: "2026-06-17T12:10:00.000Z",
          summary: "Accepted local handoff.",
          snapshot: {
            branch: "main",
            gitCommit: "abc123",
            changedFiles: ["src/auth/session.ts"],
            readinessState: "ready_for_review",
            verificationPassed: 1,
            verificationFailed: 0
          }
        }
      },
      proofGaps: [],
      readiness: {
        state: "ready_for_review",
        label: "Ready for review",
        reason: "Verification evidence matches the observed review risk.",
        nextAction: "Run agentflight handoff to generate the local review packet.",
        proofGaps: []
      },
      nextAction: "Run agentflight handoff to generate the local review packet."
    });

    expect(prompt).toContain("## Review Receipt");
    expect(prompt).toContain("Review receipt stale");
    expect(prompt).toContain("Stale files: src/auth/session.ts");
    expect(prompt).toContain("Regenerate the handoff after re-review.");
  });

  it("escapes full-command summaries in raw Markdown details", () => {
    const command = `node -e "</summary><script>alert(1)</script>; ${"console.log('noise'); ".repeat(12)}"`;
    const prompt = renderResumePrompt({
      task: "Escape resume summary",
      sessionId: "af-resume-escape",
      branch: "main",
      changedFiles: ["src/auth/session.ts"],
      riskLevel: "high",
      riskReasons: ["Authentication-sensitive files changed."],
      verificationGaps: [],
      proofGaps: [
        {
          id: "failed-verification",
          severity: "blocking",
          message: "A verification command failed.",
          suggestedCommand: command,
          relatedFiles: ["src/auth/session.ts"]
        }
      ],
      readiness: {
        state: "blocked_by_failed_verification",
        label: "Blocked by failed verification",
        reason: "A verification command failed.",
        nextAction: `Fix the failed command, then rerun agentflight verify -- ${command}`,
        suggestedCommand: command,
        proofGaps: []
      },
      nextAction: `Fix the failed command, then rerun agentflight verify -- ${command}`
    });

    const summaryLine = prompt.split("\n").find((line) => line.startsWith("<summary>"));
    expect(summaryLine).toContain("&lt;/summary&gt;&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(summaryLine).not.toContain("</summary><script>alert(1)</script>");
  });

  it("shows when review focus rows are capped", () => {
    const prompt = renderResumePrompt({
      task: "Focus overflow",
      sessionId: "af-focus-overflow",
      branch: "main",
      changedFiles: Array.from({ length: 6 }, (_, index) => `src/file-${index}.ts`),
      riskLevel: "medium",
      riskReasons: [],
      verificationGaps: [],
      reviewFocus: Array.from({ length: 5 }, (_, index) => ({
        rank: index + 1,
        file: `src/file-${index}.ts`,
        category: "source",
        riskLevel: "medium",
        score: 10,
        reasons: ["source code"],
        suggestedReviewerFocus: "Inspect behavior.",
        proofStatus: "missing",
        relatedProofGapIds: []
      })),
      reviewFocusTotal: 6,
      nextAction: "Run verification."
    });

    expect(prompt).toContain("- 1 more review focus file in report/replay.");
  });

  it("caps large changed-file lists", () => {
    const prompt = renderResumePrompt({
      task: "Large resume",
      sessionId: "af-large-resume",
      branch: "main",
      changedFiles: Array.from({ length: 85 }, (_, index) => `src/file-${index}.ts`),
      riskLevel: "medium",
      riskReasons: [],
      verificationGaps: [],
      nextAction: "Run verification."
    });

    expect(prompt).toContain("- src/file-79.ts");
    expect(prompt).toContain("- 5 more changed files in replay/status JSON.");
    expect(prompt).not.toContain("src/file-80.ts");
  });
});
