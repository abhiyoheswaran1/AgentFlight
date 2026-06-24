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

  it("renders long suggested proof commands compactly with the full command in a title", () => {
    const longCommand = `node -e "${"console.error('very noisy proof command'); ".repeat(12)}process.exit(1)"`;
    const html = renderHtmlReplay({
      task: "Dogfood failure",
      sessionId: "af-long-command",
      startedAt: "2026-06-17T12:00:00.000Z",
      timeline: [],
      changedFiles: ["src/auth/reset.ts"],
      riskBadges: ["high"],
      verificationEvidence: [],
      reviewReadiness: "Blocked by failed verification",
      review: {
        focus: [
          {
            rank: 1,
            file: "src/auth/reset.ts",
            category: "auth",
            riskLevel: "high",
            score: 130,
            reasons: ["identity/session path", "matching proof missing"],
            suggestedReviewerFocus: "Check session, permission, and identity boundaries first.",
            proofStatus: "missing",
            suggestedCommand: longCommand,
            relatedProofGapIds: ["failed-verification"]
          }
        ],
        proofGaps: [
          {
            id: "failed-verification",
            severity: "blocking",
            message: `A verification command failed and must be fixed or rerun successfully: ${longCommand}`,
            suggestedCommand: longCommand,
            relatedFiles: ["src/auth/reset.ts"]
          }
        ],
        readiness: {
          state: "blocked_by_failed_verification",
          label: "Blocked by failed verification",
          reason: `A verification command failed and must be fixed or rerun successfully: ${longCommand}`,
          nextAction: `Fix the failed command, then rerun agentflight verify -- ${longCommand}`,
          suggestedCommand: longCommand,
          proofGaps: []
        }
      },
      recommendation: `Blocked by failed verification. Fix the failed command, then rerun agentflight verify -- ${longCommand}`
    });

    expect(html).toContain("agentflight verify -- node -e");
    expect(html).toContain("…");
    expect(html).toContain('title="agentflight verify -- node -e');
    expect(html).toContain("process.exit(1)");
    expect(html).toMatch(/>agentflight verify -- node -e [^<]*…<\/code>/);
  });

  it("renders long verification ledger commands compactly with the full command in a title", () => {
    const longCommand = `node -e "${"console.log('ledger proof command noise'); ".repeat(10)}console.error('<ledger-failure>'); process.exit(1)"`;
    const html = renderHtmlReplay({
      task: "Long ledger command",
      sessionId: "af-long-ledger-command",
      startedAt: "2026-06-20T12:00:00.000Z",
      timeline: [],
      changedFiles: ["src/core/verification.ts"],
      riskBadges: ["medium"],
      verificationEvidence: [
        {
          command: longCommand,
          startedAt: "2026-06-20T12:01:00.000Z",
          finishedAt: "2026-06-20T12:01:05.000Z",
          durationMs: 5000,
          exitCode: 1,
          status: "failed",
          stdoutPath: ".agentflight/evidence/af-long-ledger-command/verification-1.stdout.txt",
          stderrPath: ".agentflight/evidence/af-long-ledger-command/verification-1.stderr.txt",
          outputExcerpt: "ledger failure"
        }
      ],
      reviewReadiness: "Blocked by failed verification",
      recommendation: "Fix the failed verification."
    });

    expect(html).toContain('class="entry-cmd" title="node -e');
    expect(html).toContain("process.exit(1)");
    expect(html).toContain("&lt;ledger-failure&gt;");
    expect(html).not.toContain("<ledger-failure>");
    expect(html).toMatch(/<div class="entry-cmd" title="[^"]*">node -e [^<]*…<\/div>/);
  });

  it("renders accessible review navigation with sticky-safe section anchors", () => {
    const html = renderHtmlReplay({
      task: "Review navigation",
      sessionId: "af-nav",
      startedAt: "2026-06-19T12:00:00.000Z",
      timeline: [
        {
          type: "session_started",
          title: "Session started",
          timestamp: "2026-06-19T12:00:00.000Z"
        }
      ],
      changedFiles: ["src/renderers/html-replay.ts"],
      changedFileGroups: [{ category: "frontend", files: ["src/renderers/html-replay.ts"] }],
      riskBadges: ["medium"],
      verificationEvidence: [
        {
          command: "npm test",
          startedAt: "2026-06-19T12:01:00.000Z",
          finishedAt: "2026-06-19T12:01:05.000Z",
          durationMs: 5000,
          exitCode: 0,
          status: "passed",
          stdoutPath: ".agentflight/evidence/af-nav/verification-1.stdout.txt",
          stderrPath: ".agentflight/evidence/af-nav/verification-1.stderr.txt"
        }
      ],
      reviewReadiness: "Ready for review",
      review: {
        focus: [
          {
            rank: 1,
            file: "src/renderers/html-replay.ts",
            category: "frontend",
            riskLevel: "medium",
            score: 80,
            reasons: ["replay surface"],
            suggestedReviewerFocus: "Check navigation and evidence layout.",
            proofStatus: "covered",
            relatedProofGapIds: []
          }
        ],
        proofGaps: [],
        readiness: {
          state: "ready_for_review",
          label: "Ready for review",
          reason: "Passing verification evidence is present.",
          nextAction: "Review changed files and replay evidence.",
          proofGaps: []
        },
        contract: {
          summary: {
            total: 3,
            supported: 3,
            needsReview: 0,
            unsupported: 0,
            failed: 0,
            stale: 0,
            notTestable: 0,
            unknown: 0
          },
          reviewPath: {
            summary: "All 3 supported claims are ready for review.",
            nextAction: "Review changed files and replay evidence.",
            inspectClaimIds: ["file-src-renderers-html-replay-ts"]
          },
          claims: [
            {
              id: "file-src-renderers-html-replay-ts",
              text: "Changed file reviewed: src/renderers/<html-replay>.ts",
              status: "supported",
              source: "file",
              reason: "replay surface",
              files: ["src/renderers/<html-replay>.ts"],
              evidence: ["Proof: covered"],
              proofReferences: [
                {
                  kind: "changed_file",
                  label: "Changed file: src/renderers/<html-replay>.ts",
                  target: "review-focus-file-src-renderers-html-replay-ts"
                },
                {
                  kind: "verification_run",
                  label: "Verification run: npm test",
                  target: "verification-run-1"
                }
              ],
              relatedProofGapIds: []
            }
          ]
        }
      },
      recommendation: "Review the replay."
    });

    expect(html).toContain('<nav class="jump-nav" aria-label="Replay sections">');
    expect(html).toContain('href="#review-path"');
    expect(html).toContain('href="#review-focus"');
    expect(html).toContain('href="#proof-gaps"');
    expect(html).toContain('href="#timeline"');
    expect(html).toContain('href="#verification-evidence"');
    expect(html).toContain('<section class="section review-path" id="review-path">');
    expect(html).toContain('<section class="section" id="review-focus">');
    expect(html).toContain('<section class="section" id="review-contract">');
    expect(html).toContain("Review Contract");
    expect(html).toContain("All 3 supported claims are ready for review.");
    expect(html).toContain('href="#claim-file-src-renderers-html-replay-ts"');
    expect(html).toContain('id="claim-file-src-renderers-html-replay-ts"');
    expect(html).toContain('id="review-focus-file-src-renderers-html-replay-ts"');
    expect(html).toContain('href="#review-focus-file-src-renderers-html-replay-ts"');
    expect(html).toContain('href="#verification-run-1"');
    expect(html).toContain("Changed file reviewed: src/renderers/&lt;html-replay&gt;.ts");
    expect(html).toContain('<section class="section" id="proof-gaps">');
    expect(html).toContain('<section class="section" id="timeline">');
    expect(html).toContain('<section class="section" id="verification-evidence">');
    expect(html).toContain(".section, .entry { scroll-margin-top:");
  });

  it("renders a blocked replay review path that leads with proof and failed-run anchors", () => {
    const html = renderHtmlReplay({
      task: "Fix replay proof path",
      sessionId: "af-review-path-blocked",
      startedAt: "2026-06-21T12:00:00.000Z",
      timeline: [],
      changedFiles: ["src/auth/<reset>.ts"],
      riskBadges: ["high"],
      verificationEvidence: [
        {
          command: "npm run lint",
          startedAt: "2026-06-21T12:01:00.000Z",
          finishedAt: "2026-06-21T12:01:05.000Z",
          durationMs: 5000,
          exitCode: 0,
          status: "passed",
          stdoutPath: ".agentflight/evidence/af-review-path-blocked/verification-1.stdout.txt",
          stderrPath: ".agentflight/evidence/af-review-path-blocked/verification-1.stderr.txt"
        },
        {
          command: "npm test",
          startedAt: "2026-06-21T12:02:00.000Z",
          finishedAt: "2026-06-21T12:02:05.000Z",
          durationMs: 5000,
          exitCode: 1,
          status: "failed",
          stdoutPath: ".agentflight/evidence/af-review-path-blocked/verification-2.stdout.txt",
          stderrPath: ".agentflight/evidence/af-review-path-blocked/verification-2.stderr.txt",
          outputExcerpt: "expected stderr failure"
        }
      ],
      verificationSummary: {
        passed: 1,
        failed: 1,
        unresolvedFailed: 1,
        resolvedFailed: 0
      },
      reviewReadiness: "Blocked by failed verification",
      review: {
        focus: [
          {
            rank: 1,
            file: "src/auth/<reset>.ts",
            category: "auth",
            riskLevel: "high",
            score: 130,
            reasons: ["identity/session path", "verification failed"],
            suggestedReviewerFocus: "Check session, permission, and identity boundaries first.",
            proofStatus: "failed",
            suggestedCommand: "npm test",
            relatedProofGapIds: ["failed-verification"]
          }
        ],
        proofGaps: [
          {
            id: "failed-verification",
            severity: "blocking",
            message: "A verification command failed and must be fixed or rerun successfully.",
            suggestedCommand: "npm test",
            relatedFiles: ["src/auth/<reset>.ts"]
          }
        ],
        readiness: {
          state: "blocked_by_failed_verification",
          label: "Blocked by failed verification",
          reason: "A verification command failed and must be fixed or rerun successfully.",
          nextAction: "Fix the failed command, then rerun agentflight verify -- npm test",
          suggestedCommand: "npm test",
          proofGaps: []
        }
      },
      recommendation: "Fix the failed verification."
    });

    expect(html).toContain('<section class="section review-path" id="review-path">');
    expect(html).toContain('href="#proof-gaps"');
    expect(html).toContain('href="#verification-run-2"');
    expect(html).toContain("Fix proof gaps");
    expect(html).toContain("Open first failed run");
    expect(html).toContain("Review highest-risk files");
    expect(html).toContain("src/auth/&lt;reset&gt;.ts");
    expect(html).not.toContain("src/auth/<reset>.ts");
    expect(html).not.toMatch(/https?:\/\//);
    expect(html).not.toContain("<script");
    expect(html.indexOf("Fix proof gaps")).toBeLessThan(html.indexOf("Open first failed run"));
    expect(html.indexOf("Open first failed run")).toBeLessThan(
      html.indexOf("Review highest-risk files")
    );
  });

  it("renders a ready replay review path without urgent historical failure guidance", () => {
    const html = renderHtmlReplay({
      task: "Ready replay path",
      sessionId: "af-review-path-ready",
      startedAt: "2026-06-21T12:00:00.000Z",
      timeline: [],
      changedFiles: ["src/core/verification.ts"],
      riskBadges: ["medium"],
      verificationEvidence: [
        {
          command: "npm test",
          startedAt: "2026-06-21T12:01:00.000Z",
          finishedAt: "2026-06-21T12:01:05.000Z",
          durationMs: 5000,
          exitCode: 1,
          status: "failed",
          stdoutPath: ".agentflight/evidence/af-review-path-ready/verification-1.stdout.txt",
          stderrPath: ".agentflight/evidence/af-review-path-ready/verification-1.stderr.txt",
          outputExcerpt: "historical failure excerpt"
        },
        {
          command: "npm test",
          startedAt: "2026-06-21T12:02:00.000Z",
          finishedAt: "2026-06-21T12:02:05.000Z",
          durationMs: 5000,
          exitCode: 0,
          status: "passed",
          stdoutPath: ".agentflight/evidence/af-review-path-ready/verification-2.stdout.txt",
          stderrPath: ".agentflight/evidence/af-review-path-ready/verification-2.stderr.txt"
        }
      ],
      verificationSummary: {
        passed: 1,
        failed: 1,
        unresolvedFailed: 0,
        resolvedFailed: 1
      },
      reviewReadiness: "Ready for review",
      review: {
        focus: [
          {
            rank: 1,
            file: "src/core/verification.ts",
            category: "source",
            riskLevel: "medium",
            score: 90,
            reasons: ["source code"],
            suggestedReviewerFocus: "Check core behavior, command flow, and edge cases first.",
            proofStatus: "covered",
            relatedProofGapIds: []
          }
        ],
        proofGaps: [],
        readiness: {
          state: "ready_for_review",
          label: "Ready for review",
          reason: "Verification evidence matches the observed review risk.",
          nextAction: "Run agentflight handoff to generate the local review packet.",
          proofGaps: []
        }
      },
      recommendation: "Ready for review."
    });

    expect(html).toContain("Review highest-risk files");
    expect(html).toContain("Confirm verification evidence");
    expect(html).toContain("Inspect changed files");
    expect(html.indexOf("Review highest-risk files")).toBeLessThan(
      html.indexOf("Confirm verification evidence")
    );
    expect(html).not.toContain("Open first failed run");
    expect(html).not.toContain("Fix proof gaps");
    expect(html).not.toContain('href="#verification-run-1" class="nav-urgent"');
  });

  it("adds failed-run anchors and a review shortcut to the first failed verification", () => {
    const html = renderHtmlReplay({
      task: "Failure navigation",
      sessionId: "af-failed-nav",
      startedAt: "2026-06-19T12:00:00.000Z",
      timeline: [],
      changedFiles: ["src/core/verification.ts"],
      riskBadges: ["high"],
      verificationEvidence: [
        {
          command: "npm run lint",
          startedAt: "2026-06-19T12:01:00.000Z",
          finishedAt: "2026-06-19T12:01:05.000Z",
          durationMs: 5000,
          exitCode: 0,
          status: "passed",
          stdoutPath: ".agentflight/evidence/af-failed-nav/verification-1.stdout.txt",
          stderrPath: ".agentflight/evidence/af-failed-nav/verification-1.stderr.txt"
        },
        {
          command: "npm test",
          startedAt: "2026-06-19T12:02:00.000Z",
          finishedAt: "2026-06-19T12:02:05.000Z",
          durationMs: 5000,
          exitCode: 1,
          status: "failed",
          stdoutPath: ".agentflight/evidence/af-failed-nav/verification-2.stdout.txt",
          stderrPath: ".agentflight/evidence/af-failed-nav/verification-2.stderr.txt",
          outputExcerpt: "expected stderr failure"
        }
      ],
      reviewReadiness: "Blocked by failed verification",
      review: {
        focus: [],
        proofGaps: [
          {
            id: "failed-verification",
            severity: "blocking",
            message: "A verification command failed and must be fixed or rerun successfully.",
            suggestedCommand: "npm test",
            relatedFiles: []
          }
        ],
        readiness: {
          state: "blocked_by_failed_verification",
          label: "Blocked by failed verification",
          reason: "A verification command failed and must be fixed or rerun successfully.",
          nextAction: "Fix the failed command, then rerun agentflight verify -- npm test",
          suggestedCommand: "npm test",
          proofGaps: []
        }
      },
      recommendation: "Fix the failed verification."
    });

    expect(html).toContain('href="#verification-run-2"');
    expect(html).toContain('<div class="entry entry--failed" id="verification-run-2">');
    expect(html).toContain("First failed run");
    expect(html).toContain("Jump to first failed run");
    expect(html).toContain('<div class="stamp stamp--failed">FAIL</div>');
    expect(html).not.toContain('<div class="entry entry--historical-failed"');
  });

  it("keeps resolved historical failed runs in the ledger without urgent navigation", () => {
    const html = renderHtmlReplay({
      task: "Resolved failure navigation",
      sessionId: "af-resolved-failed-nav",
      startedAt: "2026-06-21T12:00:00.000Z",
      timeline: [],
      changedFiles: ["src/core/verification.ts"],
      riskBadges: ["medium"],
      verificationEvidence: [
        {
          command: "npm test",
          startedAt: "2026-06-21T12:01:00.000Z",
          finishedAt: "2026-06-21T12:01:05.000Z",
          durationMs: 5000,
          exitCode: 1,
          status: "failed",
          stdoutPath: ".agentflight/evidence/af-resolved-failed-nav/verification-1.stdout.txt",
          stderrPath: ".agentflight/evidence/af-resolved-failed-nav/verification-1.stderr.txt",
          outputExcerpt: "historical failure excerpt"
        },
        {
          command: "npm test",
          startedAt: "2026-06-21T12:02:00.000Z",
          finishedAt: "2026-06-21T12:02:05.000Z",
          durationMs: 5000,
          exitCode: 0,
          status: "passed",
          stdoutPath: ".agentflight/evidence/af-resolved-failed-nav/verification-2.stdout.txt",
          stderrPath: ".agentflight/evidence/af-resolved-failed-nav/verification-2.stderr.txt"
        }
      ],
      verificationSummary: {
        passed: 1,
        failed: 1,
        unresolvedFailed: 0,
        resolvedFailed: 1
      },
      reviewReadiness: "Ready for review",
      review: {
        focus: [],
        proofGaps: [],
        readiness: {
          state: "ready_for_review",
          label: "Ready for review",
          reason: "Verification evidence matches the observed review risk.",
          nextAction: "Run agentflight handoff to generate the local review packet.",
          proofGaps: []
        }
      },
      recommendation: "Ready for review."
    });

    expect(html).toContain("1 passed / 0 unresolved failed / 1 historical failed");
    expect(html).toContain('<div class="entry entry--historical-failed" id="verification-run-1">');
    expect(html).toContain('<div class="stamp stamp--historical-failed">HIST</div>');
    expect(html).toContain("historical failure excerpt");
    expect(html).not.toContain('class="nav-urgent"');
    expect(html).not.toContain("First failed run");
    expect(html).not.toContain("Jump to first failed run");
  });

  it("renders escaped project review contract requirements with proof anchors", () => {
    const html = renderHtmlReplay({
      task: "Contract escape",
      sessionId: "af-contract-html",
      startedAt: "2026-06-23T12:00:00.000Z",
      timeline: [],
      changedFiles: ["src/auth/session.ts"],
      riskBadges: ["high"],
      verificationEvidence: [],
      reviewReadiness: "Needs verification",
      review: {
        focus: [
          {
            rank: 1,
            file: "src/auth/session.ts",
            category: "auth",
            riskLevel: "high",
            score: 130,
            reasons: ["identity/session path"],
            suggestedReviewerFocus: "Check session, permission, and identity boundaries first.",
            proofStatus: "missing",
            suggestedCommand: "npm test",
            relatedProofGapIds: ["auth-contract"]
          }
        ],
        projectReviewContract: {
          enabled: true,
          requirements: [
            {
              id: "auth-contract",
              label: "Auth <session> contract",
              status: "missing",
              proofStatus: "missing",
              severity: "blocking",
              requiredProof: ["test"],
              manualReview: ["Review <script>alert(1)</script> manually."],
              relatedFiles: ["src/auth/session.ts"],
              matchedCategories: [{ category: "auth", files: ["src/auth/session.ts"] }],
              matchReason: "Matched <auth> changes: src/auth/session.ts",
              proofReason: "No passing <test> proof recorded.",
              remainingReview: [
                "Run agentflight verify -- npm test && echo '<unsafe>'.",
                "Review <script>alert(1)</script> manually."
              ],
              suggestedCommand: "npm test && echo '<unsafe>'",
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
        proofGaps: [
          {
            id: "auth-contract",
            severity: "blocking",
            message: "Auth <session> contract requires passing test proof.",
            suggestedCommand: "npm test && echo '<unsafe>'",
            relatedFiles: ["src/auth/session.ts"]
          }
        ],
        readiness: {
          state: "needs_verification",
          label: "Needs verification",
          reason: "Auth <session> contract requires passing test proof.",
          nextAction: "Run agentflight verify -- npm test && echo '<unsafe>'",
          suggestedCommand: "npm test && echo '<unsafe>'",
          proofGaps: []
        }
      },
      recommendation: "Needs verification."
    });

    expect(html).toContain('id="required-proof"');
    expect(html).toContain("Auth &lt;session&gt; contract");
    expect(html).toContain("Accepted proof:");
    expect(html).toContain("Matched &lt;auth&gt; changes: src/auth/session.ts");
    expect(html).toContain("No passing &lt;test&gt; proof recorded.");
    expect(html).toContain(
      "Run agentflight verify -- npm test &amp;&amp; echo &#39;&lt;unsafe&gt;&#39;."
    );
    expect(html).toContain("Review &lt;script&gt;alert(1)&lt;/script&gt; manually.");
    expect(html).toContain('href="#proof-gap-auth-contract"');
    expect(html).toContain(
      'title="agentflight verify -- npm test &amp;&amp; echo &#39;&lt;unsafe&gt;&#39;"'
    );
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});
