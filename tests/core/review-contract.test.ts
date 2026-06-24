import { describe, expect, it } from "vitest";
import { stableAnchorId } from "../../src/core/ids.js";
import { buildReviewContract } from "../../src/core/review-contract.js";
import type { ProofGap, ReviewFocusItem, ReviewReadinessDecision } from "../../src/types/index.js";

describe("review contract", () => {
  it("marks task, file, and readiness claims as supported when proof is current", () => {
    const contract = buildReviewContract({
      taskTitle: "Add password reset",
      focus: [
        focusItem({
          file: "src/auth/reset.ts",
          category: "auth",
          proofStatus: "current",
          reasons: ["identity/session path", "proof current"]
        })
      ],
      proofGaps: [],
      readiness: readiness({
        state: "ready_for_review",
        label: "Ready for review",
        reason: "Verification evidence matches the observed review risk."
      })
    });

    expect(contract.summary).toMatchObject({
      total: 3,
      supported: 3,
      failed: 0,
      stale: 0,
      unsupported: 0
    });
    expect(contract.claims.map((claim) => [claim.source, claim.status, claim.text])).toEqual([
      ["task", "supported", "Session task: Add password reset"],
      ["file", "supported", "Changed file reviewed: src/auth/reset.ts"],
      ["readiness", "supported", "Review readiness: Ready for review"]
    ]);
    expect(contract.claims[1]).toMatchObject({
      files: ["src/auth/reset.ts"],
      evidence: ["Proof: current"],
      relatedProofGapIds: []
    });
  });

  it("marks stale proof claims when a file changed after verification", () => {
    const gap = proofGap({
      id: "stale-verification-proof",
      severity: "warning",
      message:
        "Verification proof is stale. Changed files were added or changed after proof was captured.",
      suggestedCommand: "npm test",
      relatedFiles: ["src/auth/reset.ts"]
    });

    const contract = buildReviewContract({
      taskTitle: "Refresh reset flow",
      focus: [
        focusItem({
          file: "src/auth/reset.ts",
          category: "auth",
          proofStatus: "stale",
          reasons: ["identity/session path", "proof stale"],
          relatedProofGapIds: ["stale-verification-proof"],
          suggestedCommand: "npm test"
        })
      ],
      proofGaps: [gap],
      readiness: readiness({
        state: "needs_verification",
        label: "Needs verification",
        reason: gap.message,
        suggestedCommand: "npm test"
      })
    });

    expect(contract.summary).toMatchObject({
      total: 4,
      stale: 2,
      unsupported: 2
    });
    expect(contract.claims).toContainEqual(
      expect.objectContaining({
        source: "file",
        status: "stale",
        text: "Changed file reviewed: src/auth/reset.ts",
        files: ["src/auth/reset.ts"],
        suggestedCommand: "npm test",
        relatedProofGapIds: ["stale-verification-proof"]
      })
    );
    expect(contract.claims).toContainEqual(
      expect.objectContaining({
        source: "proof_gap",
        status: "stale",
        text: gap.message,
        files: ["src/auth/reset.ts"],
        evidence: ["Proof gap: stale-verification-proof"]
      })
    );
  });

  it("marks failed verification claims as failed", () => {
    const gap = proofGap({
      id: "failed-verification",
      severity: "blocking",
      message: "A verification command failed and must be fixed or rerun successfully: npm test",
      suggestedCommand: "npm test",
      relatedFiles: ["src/api/users.ts"]
    });

    const contract = buildReviewContract({
      taskTitle: "Change API users endpoint",
      focus: [
        focusItem({
          file: "src/api/users.ts",
          category: "backend/api",
          proofStatus: "failed",
          reasons: ["backend/API file", "verification failed"],
          relatedProofGapIds: ["failed-verification"],
          suggestedCommand: "npm test"
        })
      ],
      proofGaps: [gap],
      readiness: readiness({
        state: "blocked_by_failed_verification",
        label: "Blocked by failed verification",
        reason: gap.message,
        suggestedCommand: "npm test"
      })
    });

    expect(contract.summary).toMatchObject({
      total: 4,
      failed: 4,
      supported: 0
    });
    expect(contract.claims.every((claim) => claim.status === "failed")).toBe(true);
  });

  it("marks missing source proof as unsupported", () => {
    const gap = proofGap({
      id: "missing-source-proof",
      severity: "warning",
      message: "Source files changed without passing typecheck, test, or build evidence.",
      suggestedCommand: "npm test",
      relatedFiles: ["src/core/session.ts"]
    });

    const contract = buildReviewContract({
      taskTitle: "Update session logic",
      focus: [
        focusItem({
          file: "src/core/session.ts",
          proofStatus: "missing",
          relatedProofGapIds: ["missing-source-proof"],
          suggestedCommand: "npm test"
        })
      ],
      proofGaps: [gap],
      readiness: readiness({
        state: "needs_verification",
        label: "Needs verification",
        reason: gap.message,
        suggestedCommand: "npm test"
      })
    });

    expect(contract.summary).toMatchObject({
      total: 4,
      unsupported: 4
    });
    expect(contract.claims[1]).toMatchObject({
      source: "file",
      status: "unsupported",
      files: ["src/core/session.ts"],
      evidence: ["Proof: missing", "Gap: missing-source-proof"]
    });
    expect(contract.claims[1]!.proofReferences).toEqual([
      {
        kind: "changed_file",
        label: "Changed file: src/core/session.ts",
        target: reviewFocusTarget("src/core/session.ts")
      },
      {
        kind: "proof_snapshot",
        label: "Proof status: missing",
        target: reviewFocusTarget("src/core/session.ts")
      },
      {
        kind: "proof_gap",
        label: "Proof gap: missing-source-proof",
        target: proofGapTarget("missing-source-proof")
      },
      {
        kind: "suggested_command",
        label: "Suggested proof: npm test"
      }
    ]);
  });

  it("marks docs and generated helpers as manual review claims when proof is not required", () => {
    const contract = buildReviewContract({
      taskTitle: "Update docs",
      focus: [
        focusItem({
          file: "README.md",
          category: "docs",
          proofStatus: "not_required",
          reasons: ["docs file"]
        }),
        focusItem({
          rank: 2,
          file: ".agentflight/.gitignore",
          category: "agentflight/config",
          proofStatus: "not_required",
          reasons: ["generated AgentFlight helper"]
        })
      ],
      proofGaps: [],
      readiness: readiness({
        state: "ready_for_review",
        label: "Ready for review",
        reason: "Verification evidence matches the observed review risk."
      })
    });

    expect(contract.claims.filter((claim) => claim.source === "file")).toEqual([
      expect.objectContaining({
        status: "needs_review",
        text: "Changed file reviewed: README.md",
        nextAction: "Review manually; no automated proof is required for this file."
      }),
      expect.objectContaining({
        status: "needs_review",
        text: "Changed file reviewed: .agentflight/.gitignore",
        nextAction: "Review manually; no automated proof is required for this file."
      })
    ]);
    expect(contract.summary.needsReview).toBe(2);
  });

  it("builds an actionable review path from the highest-friction claims", () => {
    const failedGap = proofGap({
      id: "failed-verification",
      severity: "blocking",
      message: "A verification command failed and must be fixed or rerun successfully: npm test",
      suggestedCommand: "npm test",
      relatedFiles: ["src/auth/reset.ts"]
    });
    const staleGap = proofGap({
      id: "stale-verification-proof",
      severity: "warning",
      message:
        "Verification proof is stale. Changed files were added or changed after proof was captured.",
      suggestedCommand: "npm run verify",
      relatedFiles: ["src/ui/form.tsx"]
    });

    const contract = buildReviewContract({
      taskTitle: "Review contract traceability",
      focus: [
        focusItem({
          file: "src/docs/readme.md",
          category: "docs",
          proofStatus: "not_required",
          reasons: ["docs file"]
        }),
        focusItem({
          rank: 2,
          file: "src/ui/form.tsx",
          category: "frontend",
          proofStatus: "stale",
          relatedProofGapIds: ["stale-verification-proof"],
          suggestedCommand: "npm run verify"
        }),
        focusItem({
          rank: 3,
          file: "src/auth/reset.ts",
          category: "auth",
          proofStatus: "failed",
          relatedProofGapIds: ["failed-verification"],
          suggestedCommand: "npm test"
        })
      ],
      proofGaps: [failedGap, staleGap],
      readiness: readiness({
        state: "blocked_by_failed_verification",
        label: "Blocked by failed verification",
        reason: failedGap.message,
        suggestedCommand: "npm test",
        proofGaps: [failedGap],
        nextAction: "Fix the failed command, then rerun agentflight verify -- npm test."
      })
    });

    expect(contract.reviewPath).toEqual({
      summary: "Review 4 failed claims, 2 stale claims, and 1 manual-review claim before sharing.",
      nextAction: "Fix the failed command, then rerun agentflight verify -- npm test.",
      inspectClaimIds: [
        fileClaimId("src/auth/reset.ts"),
        proofGapClaimId("failed-verification"),
        "readiness-review-readiness",
        "task-session-task",
        fileClaimId("src/ui/form.tsx")
      ]
    });
  });

  it("does not describe manual-review claims as release blockers when proof is otherwise ready", () => {
    const contract = buildReviewContract({
      taskTitle: "Update docs",
      focus: [
        focusItem({
          file: "README.md",
          category: "docs",
          proofStatus: "not_required",
          reasons: ["docs file"]
        })
      ],
      proofGaps: [],
      readiness: readiness({
        state: "ready_for_review",
        label: "Ready for review",
        reason: "Verification evidence matches the observed review risk."
      })
    });

    expect(contract.reviewPath?.summary).toBe(
      "Ready for review with 2 supported claims and 1 manual-review claim."
    );
  });

  it("adds project review contract requirement claims before file claims", () => {
    const contract = buildReviewContract({
      taskTitle: "Update auth flow",
      projectReviewContract: {
        enabled: true,
        requirements: [
          {
            id: "auth-contract",
            label: "Auth/session contract",
            status: "missing",
            proofStatus: "missing",
            severity: "blocking",
            requiredProof: ["test"],
            manualReview: ["Review auth flow manually."],
            relatedFiles: ["src/auth/session.ts"],
            matchedCategories: [{ category: "auth", files: ["src/auth/session.ts"] }],
            matchReason: "Matched auth changes: src/auth/session.ts",
            proofReason: "No passing test proof recorded.",
            remainingReview: ["Run agentflight verify -- npm test.", "Review auth flow manually."],
            suggestedCommand: "npm test",
            relatedProofGapIds: ["auth-contract"]
          }
        ],
        summary: {
          total: 1,
          supported: 0,
          needsReview: 0,
          missing: 1,
          failed: 0,
          stale: 0,
          manualReview: 1,
          notRequired: 0,
          unknown: 0
        }
      },
      focus: [
        focusItem({
          file: "src/auth/session.ts",
          category: "auth",
          proofStatus: "missing",
          relatedProofGapIds: ["auth-contract"],
          suggestedCommand: "npm test"
        })
      ],
      proofGaps: [
        proofGap({
          id: "auth-contract",
          severity: "blocking",
          message: "Auth/session contract requires passing test proof.",
          suggestedCommand: "npm test",
          relatedFiles: ["src/auth/session.ts"]
        })
      ],
      readiness: readiness({
        state: "needs_verification",
        label: "Needs verification",
        reason: "Auth/session contract requires passing test proof.",
        suggestedCommand: "npm test"
      })
    });

    expect(contract.claims[1]).toMatchObject({
      id: projectRequirementClaimId("auth-contract"),
      source: "project_requirement",
      status: "unsupported",
      text: "Required proof: Auth/session contract",
      files: ["src/auth/session.ts"],
      evidence: [
        "Matched: Matched auth changes: src/auth/session.ts",
        "Proof: missing",
        "Proof detail: No passing test proof recorded.",
        "Accepted proof: test",
        "Manual review: Review auth flow manually.",
        "Remaining: Run agentflight verify -- npm test.",
        "Remaining: Review auth flow manually.",
        "Gap: auth-contract"
      ],
      suggestedCommand: "npm test",
      relatedProofGapIds: ["auth-contract"]
    });
    expect(contract.claims[1]?.proofReferences).toEqual(
      expect.arrayContaining([
        {
          kind: "changed_file",
          label: "Changed file: src/auth/session.ts",
          target: reviewFocusTarget("src/auth/session.ts")
        },
        {
          kind: "proof_gap",
          label: "Proof gap: auth-contract",
          target: proofGapTarget("auth-contract")
        },
        {
          kind: "suggested_command",
          label: "Suggested proof: npm test"
        }
      ])
    );
    expect(contract.claims[2]).toMatchObject({
      source: "file",
      text: "Changed file reviewed: src/auth/session.ts"
    });
  });
});

function focusItem(overrides: Partial<ReviewFocusItem>): ReviewFocusItem {
  return {
    rank: 1,
    file: "src/core/session.ts",
    category: "source",
    riskLevel: "medium",
    score: 60,
    reasons: ["source code"],
    suggestedReviewerFocus: "Check core behavior, command flow, and edge cases first.",
    proofStatus: "current",
    relatedProofGapIds: [],
    ...overrides
  };
}

function proofGap(overrides: Partial<ProofGap>): ProofGap {
  return {
    id: "missing-source-proof",
    severity: "warning",
    message: "Source files changed without passing typecheck, test, or build evidence.",
    relatedFiles: ["src/core/session.ts"],
    ...overrides
  };
}

function readiness(overrides: Partial<ReviewReadinessDecision>): ReviewReadinessDecision {
  return {
    state: "ready_for_review",
    label: "Ready for review",
    reason: "Verification evidence matches the observed review risk.",
    nextAction: "Run agentflight handoff to generate the local review packet.",
    proofGaps: [],
    ...overrides
  };
}

function fileClaimId(file: string): string {
  return `file-${stableAnchorId(file)}`;
}

function projectRequirementClaimId(id: string): string {
  return `project-requirement-${stableAnchorId(id)}`;
}

function proofGapClaimId(id: string): string {
  return `proof-gap-${stableAnchorId(id)}`;
}

function reviewFocusTarget(file: string): string {
  return `review-focus-file-${stableAnchorId(file)}`;
}

function proofGapTarget(id: string): string {
  return `proof-gap-${stableAnchorId(id)}`;
}
