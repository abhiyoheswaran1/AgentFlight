import { describe, expect, it } from "vitest";
import { renderResumePrompt } from "../../src/renderers/resume-prompt.js";

describe("resume prompt", () => {
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
});
