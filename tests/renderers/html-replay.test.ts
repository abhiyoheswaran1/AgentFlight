import { describe, expect, it } from "vitest";
import { renderHtmlReplay } from "../../src/renderers/html-replay.js";

describe("HTML replay", () => {
  it("renders a self-contained escaped replay artifact", () => {
    const html = renderHtmlReplay({
      task: "Fix <auth> flow",
      sessionId: "af-1",
      startedAt: "2026-06-13T12:00:00.000Z",
      timeline: [
        {
          type: "session_started",
          title: "Session started",
          timestamp: "2026-06-13T12:00:00.000Z"
        }
      ],
      changedFiles: ["src/auth/reset.ts"],
      changedFileGroups: [{ category: "auth", files: ["src/auth/reset.ts"] }],
      riskBadges: ["high", "auth"],
      verificationEvidence: [
        {
          command: "npm test",
          startedAt: "2026-06-13T12:01:00.000Z",
          finishedAt: "2026-06-13T12:01:05.000Z",
          durationMs: 5000,
          exitCode: 0,
          status: "passed",
          stdoutPath: ".agentflight/evidence/verification-1.stdout.txt",
          stderrPath: ".agentflight/evidence/verification-1.stderr.txt"
        }
      ],
      reviewReadiness: "Not ready for review",
      review: {
        focus: [
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
          reason:
            "Sensitive auth, payment, or security files changed without passing test evidence.",
          nextAction: "Run agentflight verify -- npm test",
          suggestedCommand: "npm test",
          proofGaps: []
        }
      },
      recommendation: "Run npm test."
    });

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Fix &lt;auth&gt; flow");
    expect(html).toContain("summary-grid");
    expect(html).toContain("Changed Files");
    expect(html).toContain("1");
    expect(html).toContain("1 passed / 0 failed");
    expect(html).toContain("Not ready for review");
    expect(html).toContain("Review Focus");
    expect(html).toContain("identity/session path");
    expect(html).toContain("Proof Gaps");
    expect(html).toContain("Sensitive auth, payment, or security files changed");
    expect(html).toContain("Evidence files");
    expect(html).toContain(".agentflight/evidence/verification-1.stdout.txt");
    expect(html).not.toMatch(/https?:\/\//);
    expect(html).not.toContain("<script");
  });

  it("shows an inline, escaped output excerpt for failed verification runs", () => {
    const html = renderHtmlReplay({
      task: "Add reset flow",
      sessionId: "af-2",
      startedAt: "2026-06-16T12:00:00.000Z",
      timeline: [],
      changedFiles: ["src/auth/reset.ts"],
      riskBadges: ["high"],
      verificationEvidence: [
        {
          command: "npm test",
          startedAt: "2026-06-16T12:01:00.000Z",
          finishedAt: "2026-06-16T12:01:08.000Z",
          durationMs: 8000,
          exitCode: 1,
          status: "failed",
          stdoutPath: ".agentflight/evidence/af-2/verification-1.stdout.txt",
          stderrPath: ".agentflight/evidence/af-2/verification-1.stderr.txt",
          outputExcerpt: "FAIL reset.test.ts\nexpected <token> to be single-use"
        }
      ],
      reviewReadiness: "Blocked",
      recommendation: "Fix the failing test."
    });

    expect(html).toContain("excerpt--failed");
    expect(html).toContain("expected &lt;token&gt; to be single-use");
    expect(html).not.toContain("<token>");
    expect(html).not.toContain("<script");
  });
});
