import { describe, expect, it } from "vitest";
import {
  AGENTFLIGHT_PROJECT_CONFIG_GUIDANCE,
  AGENTFLIGHT_RUNTIME_EVIDENCE_GUIDANCE,
  collectSuggestedCommandsForDisplay,
  formatAgentFlightGeneratedFileList,
  formatFileListForDisplay,
  formatAgentFlightLocalFilesGuidance,
  compactCommandInText,
  escapeMarkdownBlockForDisplay,
  escapeMarkdownTextForDisplay,
  formatMarkdownCodeFenceForDisplay,
  formatProjectRequirementDetailsForDisplay,
  formatProofFreshnessAttributionForDisplay,
  formatReviewContractProofReferencesForDisplay,
  formatReviewReceiptForDisplay,
  formatReviewQueueForDisplay,
  formatReviewRoutesForDisplay,
  formatTrustDeltaForDisplay
} from "../../src/core/output.js";

describe("output helpers", () => {
  it("formats generated AgentFlight file lists in review-friendly order", () => {
    const repoRoot = "/repo";

    expect(
      formatAgentFlightGeneratedFileList(repoRoot, [
        "/repo/.agentflight/evidence",
        "/repo/.agentflight/.gitignore",
        "/repo/.agentflight/config.json"
      ])
    ).toBe(`- .agentflight/config.json
- .agentflight/.gitignore
- .agentflight/evidence`);
  });

  it("caps repeated file lists while keeping the count visible", () => {
    expect(formatFileListForDisplay(["a.ts", "b.ts", "c.ts"], { maxFiles: 2 })).toBe(
      "a.ts, b.ts and 1 more"
    );
  });

  it("compacts commands in text after normalizing command whitespace", () => {
    const command = `npm test\t-- --runInBand
      --grep auth-session-boundary --reporter verbose --maxWorkers=1 --testNamePattern "updates sessions safely"`;
    const text = `Run ${command} before trusting the review.`;

    const compacted = compactCommandInText(text, command);

    expect(compacted).toContain("Run npm test -- --runInBand --grep auth-session-boundary");
    expect(compacted).toContain("… before trusting the review.");
    expect(compacted).not.toContain("--testNamePattern");
  });

  it("escapes Markdown text without changing shell quotes", () => {
    expect(escapeMarkdownTextForDisplay(`run "quoted" <cmd>\n## injected & more`)).toBe(
      `run "quoted" &lt;cmd&gt; ## injected &amp; more`
    );
    expect(escapeMarkdownTextForDisplay("![proof](javascript:alert(1)) `[link](x)`")).toBe(
      "\\!\\[proof\\](javascript:alert(1)) \\`\\[link\\](x)\\`"
    );
    expect(escapeMarkdownTextForDisplay("# injected heading")).toBe("\\# injected heading");
  });

  it("escapes Markdown blocks while preserving generated list structure", () => {
    expect(
      escapeMarkdownBlockForDisplay(
        "- ![proof](javascript:alert(1))\n1. # injected\n   [link](javascript:alert(1))"
      )
    ).toBe(
      "- \\!\\[proof\\](javascript:alert(1))\n1. \\# injected\n   \\[link\\](javascript:alert(1))"
    );
  });

  it("collects suggested commands from all review display sources", () => {
    expect(
      collectSuggestedCommandsForDisplay({
        proofGaps: [{ suggestedCommand: "npm test" }],
        focus: [{ suggestedCommand: "npm run typecheck" }],
        contract: { claims: [{ suggestedCommand: "npm run verify" }] },
        readiness: { suggestedCommand: "npm run build" }
      })
    ).toEqual(["npm test", "npm run typecheck", "npm run verify", "npm run build"]);
  });

  it("wraps Markdown code fences with enough backticks for raw excerpts", () => {
    const fenced = formatMarkdownCodeFenceForDisplay("first\n```nested\nsecond", "text");

    expect(fenced).toBe("````text\nfirst\n```nested\nsecond\n````");
  });

  it("caps stale proof freshness file lists", () => {
    expect(
      formatProofFreshnessAttributionForDisplay({
        state: "stale",
        reason: "Changed files were added or changed after proof was captured.",
        staleCategories: [
          {
            category: "source",
            files: Array.from({ length: 10 }, (_, index) => `src/file-${index}.ts`),
            proofRequired: true
          }
        ]
      }).join("\n")
    ).toContain("Proof-required stale files: source (src/file-0.ts, src/file-1.ts");
    expect(
      formatProofFreshnessAttributionForDisplay({
        state: "stale",
        reason: "Changed files were added or changed after proof was captured.",
        staleCategories: [
          {
            category: "source",
            files: Array.from({ length: 10 }, (_, index) => `src/file-${index}.ts`),
            proofRequired: true
          }
        ]
      }).join("\n")
    ).toContain("and 2 more");
  });

  it("caps project requirement related files", () => {
    expect(
      formatProjectRequirementDetailsForDisplay({
        proofStatus: "missing",
        requiredProof: ["test"],
        manualReview: [],
        relatedFiles: Array.from({ length: 10 }, (_, index) => `src/file-${index}.ts`)
      }).join("\n")
    ).toContain("Files: src/file-0.ts, src/file-1.ts");
    expect(
      formatProjectRequirementDetailsForDisplay({
        proofStatus: "missing",
        requiredProof: ["test"],
        manualReview: [],
        relatedFiles: Array.from({ length: 10 }, (_, index) => `src/file-${index}.ts`)
      }).join("\n")
    ).toContain("and 2 more");
  });

  it("caps review contract proof references in dense surfaces", () => {
    expect(
      formatReviewContractProofReferencesForDisplay({
        proofReferences: [
          {
            kind: "changed_file",
            label: "Changed file: src/file-0.ts"
          },
          {
            kind: "changed_file",
            label: "Changed file: src/file-1.ts"
          },
          {
            kind: "changed_file",
            label: "Changed file: src/file-2.ts"
          },
          {
            kind: "changed_file",
            label: "Changed file: src/file-3.ts"
          },
          {
            kind: "changed_file",
            label: "Changed file: src/file-4.ts"
          },
          {
            kind: "suggested_command",
            label:
              "Suggested proof: npm run a-very-long-contract-command -- --project chromium --reporter line"
          }
        ]
      })
    ).toBe(
      "Proof refs: Changed file: src/file-0.ts; Changed file: src/file-1.ts; Changed file: src/file-2.ts; Changed file: src/file-3.ts; and 2 more"
    );
  });

  it("formats empty generated AgentFlight file lists without exposing absolute paths", () => {
    expect(formatAgentFlightGeneratedFileList("/repo", [])).toBe("- none");
  });

  it("keeps first-run local-file guidance centralized", () => {
    expect(AGENTFLIGHT_PROJECT_CONFIG_GUIDANCE).toContain(".agentflight/config.json");
    expect(AGENTFLIGHT_PROJECT_CONFIG_GUIDANCE).toContain("project config");
    expect(AGENTFLIGHT_RUNTIME_EVIDENCE_GUIDANCE).toContain("runtime evidence");
    expect(AGENTFLIGHT_RUNTIME_EVIDENCE_GUIDANCE).toContain(
      "excluded from AgentFlight changed-file analysis"
    );
    expect(formatAgentFlightLocalFilesGuidance()).toContain(AGENTFLIGHT_PROJECT_CONFIG_GUIDANCE);
    expect(formatAgentFlightLocalFilesGuidance()).toContain(AGENTFLIGHT_RUNTIME_EVIDENCE_GUIDANCE);
    expect(formatAgentFlightLocalFilesGuidance()).toContain(".projscan-memory/**");
  });

  it("formats trust delta and review queue items compactly", () => {
    expect(
      formatTrustDeltaForDisplay({
        summary: "Trust changed because proof is stale or missing.",
        items: [
          {
            kind: "stale_proof",
            severity: "warning",
            message:
              "Verification proof is stale for auth changes after proof was captured. Rerun verification for these files.",
            relatedFiles: ["src/auth/session.ts"],
            suggestedCommand:
              "npm run a-very-long-e2e-auth-command -- --browser chromium --project production",
            relatedProofGapIds: ["stale-verification-proof"]
          }
        ]
      })
    ).toContain("warning - Verification proof is stale for auth changes after proof was captured.");

    expect(
      formatReviewQueueForDisplay([
        {
          rank: 1,
          action: "rerun_stale_proof",
          label: "Rerun stale proof",
          detail: "Run stale auth proof before review.",
          relatedFiles: ["src/auth/session.ts"],
          suggestedCommand:
            "npm run a-very-long-e2e-auth-command -- --browser chromium --project production",
          relatedProofGapIds: ["stale-verification-proof"]
        }
      ])
    ).toContain("Suggested proof: agentflight verify -- npm run a-very-long-e2e-auth-command");
  });

  it("formats review receipt state without exposing source contents", () => {
    expect(
      formatReviewReceiptForDisplay({
        state: "stale",
        label: "Review receipt stale",
        summary: "Accepted handoff is stale because files changed after review.",
        nextAction: "Regenerate the handoff after re-review.",
        staleFiles: ["src/auth/session.ts"],
        receipt: {
          id: "receipt-20260614-121000-accepted-001",
          decision: "accepted",
          recordedAt: "2026-06-14T12:10:00.000Z",
          summary: "Accepted local handoff.",
          snapshot: {
            branch: "main",
            gitCommit: "abc123",
            changedFiles: ["src/auth/session.ts"],
            readinessState: "ready_for_review",
            verificationPassed: 1,
            verificationFailed: 0,
            artifactPath: ".agentflight/reports/af-test-handoff.md"
          }
        }
      })
    ).toBe(`Review receipt stale
- Accepted local handoff.
- Recorded: 2026-06-14T12:10:00.000Z
- State: Accepted handoff is stale because files changed after review.
- Stale files: src/auth/session.ts
- Next: Regenerate the handoff after re-review.`);
  });

  it("formats role-aware review routes compactly", () => {
    expect(
      formatReviewRoutesForDisplay({
        summary: "2 reviewer routes need attention before trust.",
        items: [
          {
            role: "maintainer",
            label: "Maintainer",
            status: "needs_review",
            priority: 1,
            summary: "Start with the highest-signal changed files.",
            reason: "Ready for review; manual review remains.",
            relatedFiles: ["src/auth/session.ts"],
            relatedProofGapIds: []
          },
          {
            role: "verification",
            label: "Verification",
            status: "blocked",
            priority: 2,
            summary: "Proof is blocked by a failed verification run.",
            reason: "A verification command failed.",
            relatedFiles: ["src/auth/session.ts"],
            suggestedCommand:
              "npm run a-very-long-e2e-auth-command -- --browser chromium --project production",
            relatedProofGapIds: ["failed-verification"]
          }
        ]
      })
    ).toBe(`- 2 reviewer routes need attention before trust.
1. Maintainer - needs review
   Start with the highest-signal changed files.
   Why: Ready for review; manual review remains.
   Files: src/auth/session.ts
2. Verification - blocked
   Proof is blocked by a failed verification run.
   Why: A verification command failed.
   Files: src/auth/session.ts
   Suggested proof: agentflight verify -- npm run a-very-long-e2e-auth-command -- --browser chromium --project production`);
  });
});
