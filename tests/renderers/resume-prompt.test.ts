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
        claims: [
          {
            id: "file-src-auth-reset-ts",
            text: "Changed file reviewed: src/auth/reset.ts",
            status: "unsupported",
            source: "file",
            reason: "identity/session path; no passing test evidence",
            files: ["src/auth/reset.ts"],
            evidence: ["Proof: missing", "Gap: missing-auth-test-proof"],
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
    expect(prompt).toContain("unsupported - Changed file reviewed: src/auth/reset.ts");
    expect(prompt).toContain("src/auth/reset.ts");
    expect(prompt).toContain("identity/session path");
    expect(prompt).toContain("Proof Gaps");
    expect(prompt).toContain("Sensitive auth, payment, or security files changed");
    expect(prompt).toContain("src/auth/reset.ts");
    expect(prompt).toContain("Do not start unrelated work.");
    expect(prompt).toContain("Do not claim completion without proof.");
    expect(prompt).toContain("Run relevant verification before declaring success.");
  });
});
