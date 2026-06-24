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
        reviewRoutes: {
          summary: "3 reviewer routes need attention before trust.",
          items: [
            {
              role: "maintainer",
              label: "Maintainer",
              status: "blocked",
              priority: 1,
              summary: "Review is blocked until the highest-priority proof issue is cleared.",
              reason: "Trust changed because proof is stale or missing.",
              relatedFiles: ["src/auth/reset.ts"],
              suggestedCommand: "npm test",
              relatedProofGapIds: ["missing-auth-test-proof"]
            },
            {
              role: "verification",
              label: "Verification",
              status: "blocked",
              priority: 2,
              summary: "Proof is blocked by a failed or incomplete verification run.",
              reason:
                "Sensitive auth, payment, or security files changed without passing test evidence.",
              relatedFiles: ["src/auth/reset.ts"],
              suggestedCommand: "npm test",
              relatedProofGapIds: ["missing-auth-test-proof"]
            },
            {
              role: "security",
              label: "Security",
              status: "blocked",
              priority: 3,
              summary: "Security-sensitive paths are blocked by required proof.",
              reason:
                "Auth, payment, secret, database, dependency, or runtime configuration paths changed.",
              relatedFiles: ["src/auth/reset.ts"],
              suggestedCommand: "npm test",
              relatedProofGapIds: ["missing-auth-test-proof"]
            }
          ]
        },
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
    expect(html).toContain('href="#review-routes"');
    expect(html).toContain('id="review-routes"');
    expect(html).toContain("Review Routing");
    expect(html).toContain("Verification");
    expect(html).toContain("Security-sensitive paths are blocked by required proof.");
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

  it("renders escaped proof freshness attribution", () => {
    const html = renderHtmlReplay({
      task: "Docs freshness",
      sessionId: "af-freshness",
      startedAt: "2026-06-17T12:00:00.000Z",
      timeline: [],
      changedFiles: ["docs/<guide>.md"],
      riskBadges: ["low", "docs"],
      verificationEvidence: [],
      reviewReadiness: "Ready for review",
      review: {
        focus: [],
        proofFreshness: {
          state: "stale",
          reason: "docs changed after proof was captured; manual review remains.",
          staleFiles: ["docs/<guide>.md"],
          staleCategories: [
            {
              category: "docs",
              files: ["docs/<guide>.md"],
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
        }
      },
      recommendation: "Review docs."
    });

    expect(html).toContain("Proof Freshness");
    expect(html).toContain("docs/&lt;guide&gt;.md");
    expect(html).not.toContain("docs/<guide>.md");
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
    expect(html).toContain("<summary>Full command</summary>");
    expect(html).toContain("process.exit(1)");
    expect(html).toMatch(/>agentflight verify -- node -e [^<]*…<\/code>/);
    expect(html).not.toContain("details { display: none; }");
    expect(html).toContain("details:not([open]) > :not(summary) { display: block; }");
  });

  it("renders proof-reference links with matching replay anchors", () => {
    const html = renderHtmlReplay({
      task: "Anchor proof refs",
      sessionId: "af-anchor-proof-refs",
      startedAt: "2026-06-24T12:00:00.000Z",
      timeline: [],
      changedFiles: ["src/auth/session.ts"],
      riskBadges: ["high", "auth"],
      verificationEvidence: [],
      reviewReadiness: "Needs verification",
      review: {
        focus: [],
        proofGaps: [],
        readiness: {
          state: "needs_verification",
          label: "Needs verification",
          reason: "Run test proof before trusting the change.",
          nextAction: "Run agentflight verify -- npm test",
          suggestedCommand: "npm test",
          proofGaps: []
        },
        contract: {
          summary: {
            total: 1,
            supported: 0,
            needsReview: 0,
            unsupported: 1,
            failed: 0,
            stale: 0,
            notTestable: 0,
            unknown: 0
          },
          reviewPath: {
            summary: "Review 1 unsupported claim before sharing.",
            nextAction: "Run agentflight verify -- npm test",
            inspectClaimIds: ["readiness-review-readiness"]
          },
          claims: [
            {
              id: "readiness-review-readiness",
              text: "Review readiness: Needs verification",
              status: "unsupported",
              source: "readiness",
              reason: "Run test proof before trusting the change.",
              files: [],
              evidence: ["Readiness: Needs verification"],
              proofReferences: [
                {
                  kind: "readiness_reason",
                  label: "Readiness: Needs verification",
                  target: "review-readiness"
                }
              ],
              relatedProofGapIds: []
            }
          ]
        }
      },
      recommendation: "Run npm test."
    });

    const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]));
    const hrefs = [...html.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);

    expect(html).toContain('id="review-readiness"');
    expect(html).toContain('href="#review-readiness"');
    expect(hrefs.filter((href) => !ids.has(href))).toEqual([]);
  });

  it("caps visible proof-reference links in replay claims", () => {
    const html = renderHtmlReplay({
      task: "Cap proof refs",
      sessionId: "af-cap-proof-refs",
      startedAt: "2026-06-24T12:00:00.000Z",
      timeline: [],
      changedFiles: [
        "src/file-0.ts",
        "src/file-1.ts",
        "src/file-2.ts",
        "src/file-3.ts",
        "src/file-4.ts",
        "src/file-5.ts"
      ],
      riskBadges: ["source"],
      verificationEvidence: [],
      reviewReadiness: "Needs review",
      review: {
        focus: [],
        proofGaps: [],
        readiness: {
          state: "needs_verification",
          label: "Needs verification",
          reason: "Run proof before trusting the change.",
          nextAction: "Run agentflight verify -- npm test",
          suggestedCommand: "npm test",
          proofGaps: []
        },
        contract: {
          summary: {
            total: 1,
            supported: 0,
            needsReview: 0,
            unsupported: 1,
            failed: 0,
            stale: 0,
            notTestable: 0,
            unknown: 0
          },
          reviewPath: {
            summary: "Review 1 unsupported claim before sharing.",
            nextAction: "Run agentflight verify -- npm test",
            inspectClaimIds: ["files-many"]
          },
          claims: [
            {
              id: "files-many",
              text: "Changed files reviewed",
              status: "unsupported",
              source: "file",
              reason: "Several source files changed without current proof.",
              files: [],
              evidence: ["Proof: missing"],
              proofReferences: Array.from({ length: 6 }, (_, index) => ({
                kind: "changed_file" as const,
                label: `Changed file: src/file-${index}.ts`,
                target: `review-focus-file-src-file-${index}-ts`
              })),
              relatedProofGapIds: []
            }
          ]
        }
      },
      recommendation: "Run npm test."
    });

    expect(html).toContain("Changed file: src/file-0.ts");
    expect(html).toContain("Changed file: src/file-3.ts");
    expect(html).toContain("and 2 more");
    expect(html).not.toContain(
      'href="#review-focus-file-src-file-4-ts">Changed file: src/file-4.ts</a>'
    );
    expect(html).not.toContain(
      'href="#review-focus-file-src-file-5-ts">Changed file: src/file-5.ts</a>'
    );
  });

  it("routes proof-reference links for hidden review-focus rows to changed files", () => {
    const focus = Array.from({ length: 31 }, (_, index) => ({
      rank: index + 1,
      file: `src/file-${index}.ts`,
      category: "source" as const,
      riskLevel: "medium" as const,
      score: 60 - index,
      reasons: ["source code"],
      suggestedReviewerFocus: "Check core behavior, command flow, and edge cases first.",
      proofStatus: "missing" as const,
      relatedProofGapIds: []
    }));
    const hiddenFocusTarget = "review-focus-file-src-file-30-ts";
    const html = renderHtmlReplay({
      task: "Hidden focus proof ref",
      sessionId: "af-hidden-focus-proof-ref",
      startedAt: "2026-06-24T12:00:00.000Z",
      timeline: [],
      changedFiles: focus.map((item) => item.file),
      riskBadges: ["source"],
      verificationEvidence: [],
      reviewReadiness: "Needs review",
      review: {
        focus,
        proofGaps: [],
        readiness: {
          state: "needs_verification",
          label: "Needs verification",
          reason: "Run proof before trusting the change.",
          nextAction: "Run agentflight verify -- npm test",
          suggestedCommand: "npm test",
          proofGaps: []
        },
        contract: {
          summary: {
            total: 1,
            supported: 0,
            needsReview: 0,
            unsupported: 1,
            failed: 0,
            stale: 0,
            notTestable: 0,
            unknown: 0
          },
          reviewPath: {
            summary: "Review 1 unsupported claim before sharing.",
            nextAction: "Run agentflight verify -- npm test",
            inspectClaimIds: ["hidden-focus"]
          },
          claims: [
            {
              id: "hidden-focus",
              text: "Hidden focus row reviewed",
              status: "unsupported",
              source: "file",
              reason: "The linked file is outside the visible Review Focus cap.",
              files: [],
              evidence: ["Proof: missing"],
              proofReferences: [
                {
                  kind: "changed_file",
                  label: "Changed file: src/file-30.ts",
                  target: hiddenFocusTarget
                }
              ],
              relatedProofGapIds: []
            }
          ]
        }
      },
      recommendation: "Run npm test."
    });

    const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]));
    const hrefs = [...html.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);

    expect(ids.has(hiddenFocusTarget)).toBe(false);
    expect(html).toContain('href="#changed-files">Changed file: src/file-30.ts</a>');
    expect(hrefs.filter((href) => !ids.has(href))).toEqual([]);
  });

  it("renders escaped repo calibration suggestions with full suggested proof in a title", () => {
    const html = renderHtmlReplay({
      task: "Update auth flow",
      sessionId: "af-calibrated-html",
      startedAt: "2026-06-24T12:00:00.000Z",
      timeline: [],
      changedFiles: ["src/auth/session.ts"],
      riskBadges: ["high", "auth"],
      verificationEvidence: [],
      reviewReadiness: "Ready for review",
      review: {
        focus: [],
        proofGaps: [],
        calibration: {
          source: "local_session_history",
          state: "under_proven",
          summary:
            "Similar local ready handoffs suggest 1 additional proof command for this change.",
          scannedSessions: 3,
          similarReadySessions: 2,
          suggestions: [
            {
              id: "repo-calibration-auth-script",
              status: "under_proven",
              category: "auth",
              message:
                "Similar local ready handoffs for auth changes usually included npm run e2e:<auth>.",
              currentProof: ["npm test"],
              historicalProof: ["npm run e2e:<auth>", "npm test"],
              suggestedCommand: "npm run e2e:<auth>",
              similarReadySessions: 2,
              matchedSessionIds: ["af-auth-1", "af-auth-2"]
            }
          ]
        },
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

    expect(html).toContain('href="#repo-calibration"');
    expect(html).toContain('<section class="section" id="repo-calibration">');
    expect(html).toContain("Repo Calibration");
    expect(html).toContain("npm run e2e:&lt;auth&gt;");
    expect(html).toContain('title="agentflight verify -- npm run e2e:&lt;auth&gt;"');
    expect(html).not.toContain("npm run e2e:<auth>");
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
            inspectClaimIds: ["file-src-1b-renderers-1b-html-19-replay-1a-ts"]
          },
          claims: [
            {
              id: "file-src-1b-renderers-1b-html-19-replay-1a-ts",
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
                  target: "review-focus-file-src-1b-renderers-1b-html-19-replay-1a-ts"
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
    expect(html).toContain('href="#claim-file-src-1b-renderers-1b-html-19-replay-1a-ts"');
    expect(html).toContain('id="claim-file-src-1b-renderers-1b-html-19-replay-1a-ts"');
    expect(html).toContain('id="review-focus-file-src-1b-renderers-1b-html-19-replay-1a-ts"');
    expect(html).toContain('href="#review-focus-file-src-1b-renderers-1b-html-19-replay-1a-ts"');
    expect(html).toContain('href="#verification-run-1"');
    expect(html).toContain("Changed file reviewed: src/renderers/&lt;html-replay&gt;.ts");
    expect(html).toContain('<section class="section" id="proof-gaps">');
    expect(html).toContain('<section class="section" id="timeline">');
    expect(html).toContain('<section class="section" id="verification-evidence">');
    expect(html).toContain(".section, .entry { scroll-margin-top:");
  });

  it("keeps replay anchors unique for paths that slug similarly", () => {
    const html = renderHtmlReplay({
      task: "Anchor collision check",
      sessionId: "af-anchor-collision",
      startedAt: "2026-06-24T12:00:00.000Z",
      timeline: [],
      changedFiles: ["src/a_b.ts", "src/a-b.ts"],
      riskBadges: ["medium"],
      verificationEvidence: [],
      reviewReadiness: "Ready for review",
      review: {
        focus: [
          {
            rank: 1,
            file: "src/a_b.ts",
            category: "source",
            riskLevel: "medium",
            score: 60,
            reasons: ["source code"],
            suggestedReviewerFocus: "Check core behavior, command flow, and edge cases first.",
            proofStatus: "covered",
            relatedProofGapIds: []
          },
          {
            rank: 2,
            file: "src/a-b.ts",
            category: "source",
            riskLevel: "medium",
            score: 60,
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
          reason: "Passing verification evidence is present.",
          nextAction: "Review changed files and replay evidence.",
          proofGaps: []
        }
      },
      recommendation: "Review anchors."
    });

    expect(html).toContain('id="review-focus-file-src-1b-a-2n-b-1a-ts"');
    expect(html).toContain('id="review-focus-file-src-1b-a-19-b-1a-ts"');
    expect(html.match(/id="review-focus-file-src-1b-a-/g)).toHaveLength(2);
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

  it("points urgent replay navigation at unresolved failed runs in mixed failure history", () => {
    const html = renderHtmlReplay({
      task: "Mixed failure navigation",
      sessionId: "af-mixed-failed-nav",
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
          stdoutPath: ".agentflight/evidence/af-mixed-failed-nav/verification-1.stdout.txt",
          stderrPath: ".agentflight/evidence/af-mixed-failed-nav/verification-1.stderr.txt",
          outputExcerpt: "resolved test failure"
        },
        {
          command: "npm test",
          startedAt: "2026-06-21T12:02:00.000Z",
          finishedAt: "2026-06-21T12:02:05.000Z",
          durationMs: 5000,
          exitCode: 0,
          status: "passed",
          stdoutPath: ".agentflight/evidence/af-mixed-failed-nav/verification-2.stdout.txt",
          stderrPath: ".agentflight/evidence/af-mixed-failed-nav/verification-2.stderr.txt"
        },
        {
          command: "npm run lint",
          startedAt: "2026-06-21T12:03:00.000Z",
          finishedAt: "2026-06-21T12:03:05.000Z",
          durationMs: 5000,
          exitCode: 1,
          status: "failed",
          stdoutPath: ".agentflight/evidence/af-mixed-failed-nav/verification-3.stdout.txt",
          stderrPath: ".agentflight/evidence/af-mixed-failed-nav/verification-3.stderr.txt",
          outputExcerpt: "unresolved lint failure"
        }
      ],
      verificationSummary: {
        passed: 1,
        failed: 2,
        unresolvedFailed: 1,
        resolvedFailed: 1
      },
      reviewReadiness: "Blocked by failed verification",
      review: {
        focus: [],
        proofGaps: [],
        readiness: {
          state: "blocked_by_failed_verification",
          label: "Blocked by failed verification",
          reason: "A verification command failed.",
          nextAction: "Fix the failed command.",
          proofGaps: []
        }
      },
      recommendation: "Fix the unresolved failure."
    });

    expect(html).toContain('class="nav-urgent">First failed run</a>');
    expect(html).toContain('href="#verification-run-3"');
    expect(html).toContain('<div class="entry entry--historical-failed" id="verification-run-1">');
    expect(html).toContain('<div class="entry entry--failed" id="verification-run-3">');
    expect(html).toContain("resolved test failure");
    expect(html).toContain("unresolved lint failure");
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
        trustDelta: {
          summary: "Trust changed because proof is stale or missing.",
          items: [
            {
              kind: "missing_proof",
              severity: "blocking",
              message: "Auth <session> contract requires passing test proof.",
              suggestedCommand: "npm test && echo '<unsafe>'",
              relatedFiles: ["src/auth/session.ts"],
              relatedProofGapIds: ["auth-contract"]
            }
          ]
        },
        reviewQueue: [
          {
            rank: 1,
            action: "run_missing_proof",
            label: "Run missing <proof>",
            detail: "Auth <session> contract requires passing test proof.",
            suggestedCommand: "npm test && echo '<unsafe>'",
            relatedFiles: ["src/auth/session.ts"],
            relatedProofGapIds: ["auth-contract"]
          }
        ],
        reviewReceipt: {
          state: "stale",
          label: "Review receipt <stale>",
          summary: "Accepted handoff is stale because <files> changed after review.",
          nextAction: "Regenerate the handoff after re-review.",
          staleFiles: ["src/auth/session.ts"],
          receipt: {
            id: "receipt-20260617-121000-accepted-001",
            decision: "accepted",
            recordedAt: "2026-06-17T12:10:00.000Z",
            summary: "Accepted <local> handoff.",
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

    expect(html).toContain('href="#trust-delta"');
    expect(html).toContain('href="#review-receipt"');
    expect(html).toContain('<section class="section" id="trust-delta">');
    expect(html).toContain('<section class="section" id="review-receipt">');
    expect(html).toContain("Review receipt &lt;stale&gt;");
    expect(html).toContain("Accepted &lt;local&gt; handoff.");
    expect(html).not.toContain("Accepted <local> handoff.");
    expect(html).toContain("Run missing &lt;proof&gt;");
    expect(html).not.toContain("Run missing <proof>");
    expect(html).toContain('id="required-proof"');
    expect(html).toContain("Auth &lt;session&gt; contract");
    expect(html).toContain("Accepted proof:");
    expect(html).toContain("Matched &lt;auth&gt; changes: src/auth/session.ts");
    expect(html).toContain("No passing &lt;test&gt; proof recorded.");
    expect(html).toContain(
      "Run agentflight verify -- npm test &amp;&amp; echo &#39;&lt;unsafe&gt;&#39;."
    );
    expect(html).toContain("Review &lt;script&gt;alert(1)&lt;/script&gt; manually.");
    expect(html).toContain('href="#proof-gap-auth-19-contract"');
    expect(html).toContain(
      'title="agentflight verify -- npm test &amp;&amp; echo &#39;&lt;unsafe&gt;&#39;"'
    );
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});
