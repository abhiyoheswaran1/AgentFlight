import { describe, expect, it } from "vitest";
import { renderMarkdownReport } from "../../src/renderers/markdown-report.js";

describe("markdown proof report", () => {
  it("escapes raw HTML in Markdown text fields", () => {
    const markdown = renderMarkdownReport({
      task: "Render <img src=x onerror=alert(1)> safely",
      sessionId: "af-markdown-html-escape",
      startedAt: "2026-06-24T12:00:00.000Z",
      changedFiles: ["docs/<guide>.md"],
      risk: {
        level: "low",
        changedFiles: 1,
        categories: [{ category: "docs", files: ["docs/<guide>.md"] }],
        reasons: ["Documentation <tag> changed."]
      },
      verificationCommands: [],
      verificationEvidence: [],
      timelineEvents: [
        {
          id: "evt-1",
          type: "snapshot_created",
          timestamp: "2026-06-24T12:01:00.000Z",
          title: "Snapshot <unsafe>",
          message: "Captured <script>alert(1)</script>"
        }
      ],
      tooling: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });

    expect(markdown).toContain("Render &lt;img src=x onerror=alert(1)&gt; safely");
    expect(markdown).toContain("- docs/&lt;guide&gt;.md");
    expect(markdown).toContain("- Documentation &lt;tag&gt; changed.");
    expect(markdown).toContain("Snapshot &lt;unsafe&gt;");
    expect(markdown).not.toContain("<img src=x onerror=alert(1)>");
    expect(markdown).not.toContain("<script>alert(1)</script>");
  });

  it("neutralizes active Markdown in report identity fields", () => {
    const markdown = renderMarkdownReport({
      task: "![proof](javascript:alert(1)) `task`\n# injected",
      sessionId: "[af-session](https://example.test)",
      startedAt: "1. started",
      changedFiles: ["docs/[guide](javascript:alert).md"],
      risk: {
        level: "low",
        changedFiles: 1,
        categories: [{ category: "docs", files: ["docs/[guide](javascript:alert).md"] }],
        reasons: ["![risk](javascript:alert(1))"]
      },
      verificationCommands: [],
      verificationEvidence: [],
      tooling: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });

    expect(markdown).toContain("\\!\\[proof\\](javascript:alert(1)) \\`task\\` # injected");
    expect(markdown).toContain("- Session ID: \\[af-session\\](https://example.test)");
    expect(markdown).toContain("- Started: 1\\. started");
    expect(markdown).toContain("- docs/\\[guide\\](javascript:alert).md");
    expect(markdown).toContain("- \\!\\[risk\\](javascript:alert(1))");
    expect(markdown).not.toContain("\n# injected");
  });

  it("renders required sections without claiming missing proof passed", () => {
    const markdown = renderMarkdownReport({
      task: "Add password reset flow",
      sessionId: "af-1",
      startedAt: "2026-06-13T12:00:00.000Z",
      changedFiles: ["src/auth/reset.ts"],
      risk: {
        level: "high",
        changedFiles: 1,
        categories: [{ category: "auth", files: ["src/auth/reset.ts"] }],
        reasons: ["Authentication-sensitive files changed."]
      },
      verificationCommands: ["npm test"],
      verificationEvidence: [],
      timelineEvents: [],
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
        trustDelta: {
          summary: "Trust changed because proof is stale or missing.",
          items: [
            {
              kind: "missing_proof",
              severity: "blocking",
              message:
                "Sensitive auth, payment, or security files changed without passing test evidence.",
              suggestedCommand: "npm test",
              relatedFiles: ["src/auth/reset.ts"],
              relatedProofGapIds: ["missing-auth-test-proof"]
            }
          ]
        },
        reviewQueue: [
          {
            rank: 1,
            action: "run_missing_proof",
            label: "Run missing proof",
            detail:
              "Sensitive auth, payment, or security files changed without passing test evidence.",
            suggestedCommand: "npm test",
            relatedFiles: ["src/auth/reset.ts"],
            relatedProofGapIds: ["missing-auth-test-proof"]
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
        },
        contract: {
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
              files: Array.from({ length: 10 }, (_, index) => `src/auth/file-${index}.ts`),
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
                },
                {
                  kind: "suggested_command",
                  label: "Suggested proof: npm test"
                }
              ],
              relatedProofGapIds: ["missing-auth-test-proof"],
              suggestedCommand: "npm test"
            }
          ]
        }
      },
      tooling: {
        projscan: { available: false, warnings: ["ProjScan unavailable"] },
        agentloopkit: { available: true, warnings: [] }
      }
    });

    expect(markdown).toContain("# AgentFlight Proof Report");
    expect(markdown).toContain("## Timeline");
    expect(markdown).toContain("No timeline events recorded.");
    expect(markdown).toContain("## Verification Evidence");
    expect(markdown).toContain("No verification evidence recorded.");
    expect(markdown).toContain("## Review First");
    expect(markdown).toContain("## Trust Delta");
    expect(markdown).toContain("Trust changed because proof is stale or missing.");
    expect(markdown).toContain("## Review Queue");
    expect(markdown).toContain("Run missing proof");
    expect(markdown).toContain("## Review Routing");
    expect(markdown).toContain("Verification - blocked");
    expect(markdown).toContain("Security-sensitive paths are blocked by required proof.");
    expect(markdown).toContain("## Review Contract");
    expect(markdown).toContain("Review path: Review 4 unsupported claims before sharing.");
    expect(markdown).toContain("Next action: Run agentflight verify -- npm test");
    expect(markdown).toContain("unsupported - Changed file reviewed: src/auth/reset.ts");
    expect(markdown).toContain("Files: src/auth/file-0.ts, src/auth/file-1.ts, src/auth/file-2.ts");
    expect(markdown).toContain("src/auth/file-7.ts and 2 more");
    expect(markdown).not.toContain("src/auth/file-8.ts");
    expect(markdown).toContain(
      "Proof refs: Changed file: src/auth/reset.ts; Proof gap: missing-auth-test-proof; Suggested proof: npm test"
    );
    expect(markdown).toContain("src/auth/reset.ts");
    expect(markdown).toContain("identity/session path");
    expect(markdown).toContain("## Proof Gaps");
    expect(markdown).toContain("Sensitive auth, payment, or security files changed");
    expect(markdown).toContain("## Review Readiness");
    expect(markdown).toContain("Needs verification");
    expect(markdown).not.toContain("tests passed");
    expect(markdown).toContain("Generated by AgentFlight");

    const timelineIndex = headingLineIndex(markdown, "## Timeline");
    for (const section of [
      "## Changed Files",
      "## Risk Summary",
      "## Verification Evidence",
      "## Review First",
      "## Trust Delta",
      "## Review Queue",
      "## Review Routing",
      "## Review Contract",
      "## Proof Gaps",
      "## Review Readiness",
      "## Recommendation",
      "## Next Action"
    ]) {
      expect(
        headingLineIndex(markdown, section),
        `${section} should come before Timeline`
      ).toBeLessThan(timelineIndex);
    }
    expect(timelineIndex).toBeLessThan(headingLineIndex(markdown, "## Tooling"));
  });

  it("renders proof freshness attribution when proof is stale", () => {
    const markdown = renderMarkdownReport({
      task: "Docs freshness",
      sessionId: "af-freshness",
      startedAt: "2026-06-17T12:00:00.000Z",
      changedFiles: ["README.md"],
      risk: {
        level: "low",
        changedFiles: 1,
        categories: [{ category: "docs", files: ["README.md"] }],
        reasons: ["Only low-risk docs, tests, or isolated UI files changed."]
      },
      verificationCommands: ["npm test"],
      verificationEvidence: [],
      timelineEvents: [],
      review: {
        focus: [],
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
        }
      },
      tooling: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });

    expect(markdown).toContain("## Proof Freshness");
    expect(markdown).toContain("docs changed after proof was captured; manual review remains.");
    expect(markdown).toContain("Manual-review stale files: docs (README.md)");
  });

  it("renders project review contract required proof before claim details", () => {
    const markdown = renderMarkdownReport({
      task: "Update auth flow",
      sessionId: "af-contract",
      startedAt: "2026-06-23T12:00:00.000Z",
      changedFiles: ["src/auth/session.ts"],
      risk: {
        level: "high",
        changedFiles: 1,
        categories: [{ category: "auth", files: ["src/auth/session.ts"] }],
        reasons: ["Authentication-sensitive files changed."]
      },
      verificationCommands: ["npm test"],
      verificationEvidence: [],
      timelineEvents: [],
      review: {
        focus: [
          {
            rank: 1,
            file: "src/auth/session.ts",
            category: "auth",
            riskLevel: "high",
            score: 130,
            reasons: ["identity/session path", "matching proof missing"],
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
              remainingReview: [
                "Run agentflight verify -- npm test.",
                "Review auth flow manually."
              ],
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
        proofGaps: [
          {
            id: "auth-contract",
            severity: "blocking",
            message: "Auth/session contract requires passing test proof.",
            suggestedCommand: "npm test",
            relatedFiles: ["src/auth/session.ts"]
          }
        ],
        readiness: {
          state: "needs_verification",
          label: "Needs verification",
          reason: "Auth/session contract requires passing test proof.",
          nextAction: "Run agentflight verify -- npm test",
          suggestedCommand: "npm test",
          proofGaps: []
        },
        contract: {
          summary: {
            total: 2,
            supported: 0,
            needsReview: 0,
            unsupported: 2,
            failed: 0,
            stale: 0,
            notTestable: 0,
            unknown: 0
          },
          claims: []
        }
      },
      tooling: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });

    expect(markdown).toContain("## Required Proof");
    expect(markdown).toContain("- missing - Auth/session contract");
    expect(markdown).toContain("Accepted proof: test");
    expect(markdown).toContain("Matched: Matched auth changes: src/auth/session.ts");
    expect(markdown).toContain("Proof detail: No passing test proof recorded.");
    expect(markdown).toContain("Remaining: Run agentflight verify -- npm test.");
    expect(markdown).toContain("Remaining: Review auth flow manually.");
    expect(markdown).toContain("Manual review: Review auth flow manually.");
    expect(markdown).toContain("Files: src/auth/session.ts");
    expect(markdown).toContain("Suggested proof: agentflight verify -- npm test");
    expect(headingLineIndex(markdown, "## Required Proof")).toBeLessThan(
      headingLineIndex(markdown, "## Review Contract")
    );
  });

  it("renders repo calibration suggestions as compact local guidance", () => {
    const markdown = renderMarkdownReport({
      task: "Update auth flow",
      sessionId: "af-calibrated",
      startedAt: "2026-06-24T12:00:00.000Z",
      changedFiles: ["src/auth/session.ts"],
      risk: {
        level: "high",
        changedFiles: 1,
        categories: [{ category: "auth", files: ["src/auth/session.ts"] }],
        reasons: ["Authentication-sensitive files changed."]
      },
      verificationCommands: ["npm test", "npm run e2e:auth"],
      verificationEvidence: [],
      timelineEvents: [],
      review: {
        focus: [],
        proofGaps: [],
        calibration: {
          source: "local_session_history",
          state: "under_proven",
          summary:
            "Similar local ready handoffs suggest 1 additional proof command for this change.",
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
        readiness: {
          state: "ready_for_review",
          label: "Ready for review",
          reason: "Verification evidence matches the observed review risk.",
          nextAction: "Run agentflight handoff to generate the local review packet.",
          proofGaps: []
        }
      },
      tooling: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });

    expect(markdown).toContain("## Repo Calibration");
    expect(markdown).toContain(
      "Similar local ready handoffs suggest 1 additional proof command for this change."
    );
    expect(markdown).toContain("- under-proven - auth");
    expect(markdown).toContain("Current proof: npm test");
    expect(markdown).toContain("Historical proof: npm run e2e:auth, npm test");
    expect(markdown).toContain("Suggested proof: agentflight verify -- npm run e2e:auth");
    expect(headingLineIndex(markdown, "## Required Proof")).toBeLessThan(
      headingLineIndex(markdown, "## Repo Calibration")
    );
    expect(headingLineIndex(markdown, "## Repo Calibration")).toBeLessThan(
      headingLineIndex(markdown, "## Review Contract")
    );
  });

  it("compacts long suggested proof commands in dense report sections", () => {
    const longCommand = `node -e "${"console.error('very noisy proof command'); ".repeat(12)}process.exit(1)"`;
    const markdown = renderMarkdownReport({
      task: "Dogfood failure",
      sessionId: "af-long-command",
      startedAt: "2026-06-17T12:00:00.000Z",
      changedFiles: ["src/auth/reset.ts"],
      risk: {
        level: "high",
        changedFiles: 1,
        categories: [{ category: "auth", files: ["src/auth/reset.ts"] }],
        reasons: ["Authentication-sensitive files changed."]
      },
      verificationCommands: [],
      verificationEvidence: [],
      timelineEvents: [],
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
          claims: [
            {
              id: "file-src-auth-reset-ts",
              text: "Changed file reviewed: src/auth/reset.ts",
              status: "unsupported",
              source: "file",
              reason: "matching proof missing",
              files: ["src/auth/reset.ts"],
              evidence: ["Proof: missing"],
              proofReferences: [
                {
                  kind: "suggested_command",
                  label: `Suggested proof: ${longCommand}`
                }
              ],
              relatedProofGapIds: ["failed-verification"],
              suggestedCommand: longCommand
            }
          ]
        }
      },
      tooling: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });

    expect(markdown).toContain("Suggested proof: agentflight verify -- node -e");
    expect(markdown).toContain("…");
    expect(markdown).toContain("## Full Suggested Commands");
    expect(markdown).toContain("<summary>agentflight verify -- node -e");
    expect(markdown).toContain("process.exit(1)");
  });

  it("escapes full-command summaries in raw Markdown details", () => {
    const command = `node -e "</summary><script>alert(1)</script>; ${"console.log('noise'); ".repeat(12)}"`;
    const markdown = renderMarkdownReport({
      task: "Escape summary command",
      sessionId: "af-escape-summary",
      startedAt: "2026-06-20T12:00:00.000Z",
      changedFiles: ["src/auth/reset.ts"],
      risk: {
        level: "high",
        changedFiles: 1,
        categories: [{ category: "auth", files: ["src/auth/reset.ts"] }],
        reasons: ["Authentication-sensitive files changed."]
      },
      verificationCommands: [],
      verificationEvidence: [],
      timelineEvents: [],
      review: {
        focus: [],
        proofGaps: [
          {
            id: "failed-verification",
            severity: "blocking",
            message: "A verification command failed.",
            suggestedCommand: command,
            relatedFiles: ["src/auth/reset.ts"]
          }
        ],
        readiness: {
          state: "blocked_by_failed_verification",
          label: "Blocked by failed verification",
          reason: "A verification command failed.",
          nextAction: `Fix the failed command, then rerun agentflight verify -- ${command}`,
          suggestedCommand: command,
          proofGaps: []
        }
      },
      tooling: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });

    const summaryLine = markdown.split("\n").find((line) => line.startsWith("<summary>"));
    expect(summaryLine).toContain("&lt;/summary&gt;&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(summaryLine).not.toContain("</summary><script>alert(1)</script>");
  });

  it("compacts long verification evidence commands in evidence rows", () => {
    const longCommand = `node -e "${"console.log('verification evidence command noise'); ".repeat(12)}process.exit(0)"`;
    const markdown = renderMarkdownReport({
      task: "Dogfood long evidence command",
      sessionId: "af-long-evidence-command",
      startedAt: "2026-06-20T12:00:00.000Z",
      changedFiles: ["src/renderers/markdown-report.ts"],
      risk: {
        level: "medium",
        changedFiles: 1,
        categories: [{ category: "source", files: ["src/renderers/markdown-report.ts"] }],
        reasons: ["Application source files changed."]
      },
      verificationCommands: [],
      verificationEvidence: [
        {
          command: longCommand,
          startedAt: "2026-06-20T12:01:00.000Z",
          finishedAt: "2026-06-20T12:01:05.000Z",
          durationMs: 5000,
          exitCode: 0,
          status: "passed",
          stdoutPath: ".agentflight/evidence/af-long-evidence-command/verification-1.stdout.txt",
          stderrPath: ".agentflight/evidence/af-long-evidence-command/verification-1.stderr.txt"
        }
      ],
      timelineEvents: [],
      tooling: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });

    expect(markdown).toContain("- node -e");
    expect(markdown).toContain("verification evidence command noise");
    expect(markdown).toContain("…: passed");
    expect(markdown).not.toContain("process.exit(0)");
    expect(markdown).toContain(
      ".agentflight/evidence/af-long-evidence-command/verification-1.stdout.txt"
    );
  });

  it("caps large changed-file lists in full reports", () => {
    const markdown = renderMarkdownReport({
      task: "Large change report",
      sessionId: "af-large-report",
      startedAt: "2026-06-20T12:00:00.000Z",
      changedFiles: Array.from({ length: 85 }, (_, index) => `src/file-${index}.ts`),
      risk: {
        level: "medium",
        changedFiles: 85,
        categories: [],
        reasons: []
      },
      verificationCommands: [],
      verificationEvidence: [],
      timelineEvents: [],
      tooling: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });

    expect(markdown).toContain("- src/file-79.ts");
    expect(markdown).toContain("- 5 more changed files in replay/status JSON.");
    expect(markdown).not.toContain("src/file-80.ts");
  });

  it("uses a Markdown fence longer than the longest backtick run in failure excerpts", () => {
    const markdown = renderMarkdownReport({
      task: "Backtick failure",
      sessionId: "af-backticks",
      startedAt: "2026-06-24T12:00:00.000Z",
      changedFiles: ["src/core/output.ts"],
      risk: {
        level: "medium",
        changedFiles: 1,
        categories: [{ category: "source", files: ["src/core/output.ts"] }],
        reasons: ["Application source files changed."]
      },
      verificationCommands: [],
      verificationEvidence: [
        {
          command: "npm test",
          startedAt: "2026-06-24T12:01:00.000Z",
          finishedAt: "2026-06-24T12:01:05.000Z",
          durationMs: 5000,
          exitCode: 1,
          status: "failed",
          stdoutPath: ".agentflight/evidence/af-backticks/stdout.txt",
          stderrPath: ".agentflight/evidence/af-backticks/stderr.txt",
          outputExcerpt: "````\n## fake heading\n````"
        }
      ],
      timelineEvents: [],
      tooling: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });

    expect(markdown).toContain("`````text\n````\n## fake heading\n````\n`````");
  });

  it("keeps AgentLoopKit tooling diagnostics concise when doctor output is noisy", () => {
    const markdown = renderMarkdownReport({
      task: "Dogfood report",
      sessionId: "af-tooling",
      startedAt: "2026-06-17T12:00:00.000Z",
      changedFiles: ["README.md"],
      risk: {
        level: "low",
        changedFiles: 1,
        categories: [{ category: "docs", files: ["README.md"] }],
        reasons: ["Only low-risk docs, tests, or isolated UI files changed."]
      },
      verificationCommands: [],
      verificationEvidence: [],
      timelineEvents: [],
      tooling: {
        projscan: { available: true, warnings: [] },
        agentloopkit: {
          available: false,
          warnings: [
            "AgentLoopKit doctor reported issues: # AgentLoopKit Doctor\n\n- [`fail`] `agentloop.config.json`: `AgentLoopKit config not found at /repo/agentloop.config.json. Run agentloop init.`\n- [`warn`] `Template manifest`: `missing .agentloop/manifest.json`"
          ]
        }
      }
    });

    expect(markdown).toContain(
      "- AgentLoopKit: unavailable (AgentLoopKit doctor reported issues; run agentloopkit doctor for details.)"
    );
    expect(markdown).not.toContain("agentloop.config.json");
    expect(markdown).not.toContain("Template manifest");
  });

  it("shows whether AgentLoopKit has an active task linked", () => {
    const markdown = renderMarkdownReport({
      task: "Review linked task state",
      sessionId: "af-tooling-linked",
      startedAt: "2026-06-17T12:00:00.000Z",
      changedFiles: ["src/commands/start.ts"],
      risk: {
        level: "medium",
        changedFiles: 1,
        categories: [{ category: "source", files: ["src/commands/start.ts"] }],
        reasons: ["Source files changed."]
      },
      verificationCommands: [],
      verificationEvidence: [],
      timelineEvents: [],
      tooling: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, version: "0.35.2", taskLinked: false, warnings: [] }
      }
    });

    expect(markdown).toContain("- AgentLoopKit: available 0.35.2 (no active task linked)");
  });

  it("renders a compact report without timeline or tooling sections", () => {
    const markdown = renderMarkdownReport(
      {
        task: "Failure review",
        sessionId: "af-compact",
        startedAt: "2026-06-17T12:00:00.000Z",
        changedFiles: ["src/api/users.ts"],
        risk: {
          level: "medium",
          changedFiles: 1,
          categories: [{ category: "backend/api", files: ["src/api/users.ts"] }],
          reasons: ["Backend/API files changed."]
        },
        verificationCommands: [],
        verificationEvidence: [
          {
            command: "npm test",
            startedAt: "2026-06-17T12:01:00.000Z",
            finishedAt: "2026-06-17T12:01:05.000Z",
            durationMs: 5000,
            exitCode: 1,
            status: "failed",
            stdoutPath: ".agentflight/evidence/af-compact/verification-1.stdout.txt",
            stderrPath: ".agentflight/evidence/af-compact/verification-1.stderr.txt",
            outputExcerpt: "expected failure excerpt"
          }
        ],
        timelineEvents: [],
        review: {
          focus: [
            {
              rank: 1,
              file: "src/api/users.ts",
              category: "backend/api",
              riskLevel: "medium",
              score: 100,
              reasons: ["backend/API file", "verification failed"],
              suggestedReviewerFocus: "Check request handling, validation, and error paths first.",
              proofStatus: "failed",
              suggestedCommand: "npm test",
              relatedProofGapIds: ["failed-verification"]
            }
          ],
          proofGaps: [
            {
              id: "failed-verification",
              severity: "blocking",
              message:
                "A verification command failed and must be fixed or rerun successfully: npm test",
              suggestedCommand: "npm test",
              relatedFiles: ["src/api/users.ts"]
            }
          ],
          readiness: {
            state: "blocked_by_failed_verification",
            label: "Blocked by failed verification",
            reason:
              "A verification command failed and must be fixed or rerun successfully: npm test",
            nextAction: "Fix the failed command, then rerun agentflight verify -- npm test",
            suggestedCommand: "npm test",
            proofGaps: []
          }
        },
        tooling: {
          projscan: { available: true, warnings: [] },
          agentloopkit: { available: true, warnings: [] }
        }
      },
      { mode: "compact" }
    );

    expect(markdown).toContain("# AgentFlight Compact Report");
    expect(markdown).toContain("## Review Readiness");
    expect(markdown).toContain("## Verification Evidence");
    expect(markdown).toContain("expected failure excerpt");
    expect(markdown).toContain(".agentflight/evidence/af-compact/verification-1.stderr.txt");
    expect(markdown).not.toContain("## Timeline");
    expect(markdown).not.toContain("## Tooling");
  });

  it("renders local review receipt state in Markdown reports", () => {
    const markdown = renderMarkdownReport({
      task: "Receipt report",
      sessionId: "af-receipt-report",
      startedAt: "2026-06-17T12:00:00.000Z",
      changedFiles: ["README.md"],
      risk: {
        level: "low",
        changedFiles: 1,
        categories: [{ category: "docs", files: ["README.md"] }],
        reasons: ["Only low-risk docs, tests, or isolated UI files changed."]
      },
      verificationCommands: [],
      verificationEvidence: [],
      timelineEvents: [],
      review: {
        focus: [],
        proofGaps: [],
        reviewReceipt: {
          state: "current",
          label: "Review receipt current",
          summary: "Accepted handoff still matches the current changed-file state.",
          nextAction: "Keep the receipt with the local handoff.",
          staleFiles: [],
          receipt: {
            id: "receipt-20260617-121000-accepted-001",
            decision: "accepted",
            recordedAt: "2026-06-17T12:10:00.000Z",
            summary: "Accepted local handoff.",
            snapshot: {
              branch: "main",
              gitCommit: "abc123",
              changedFiles: ["README.md"],
              readinessState: "ready_for_review",
              verificationPassed: 0,
              verificationFailed: 0,
              artifactPath: ".agentflight/reports/af-receipt-report-handoff.md"
            }
          }
        },
        readiness: {
          state: "ready_for_review",
          label: "Ready for review",
          reason: "Verification evidence matches the observed review risk.",
          nextAction: "Run agentflight handoff to generate the local review packet.",
          proofGaps: []
        }
      },
      tooling: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });

    expect(markdown).toContain("## Review Receipt");
    expect(markdown).toContain("Review receipt current");
    expect(markdown).toContain("- Accepted local handoff.");
    expect(markdown).toContain("- Next: Keep the receipt with the local handoff.");
  });

  it("renders a local PR comment draft without posting-oriented claims", () => {
    const markdown = renderMarkdownReport(
      {
        task: "Review handoff",
        sessionId: "af-pr-comment",
        startedAt: "2026-06-17T12:00:00.000Z",
        changedFiles: ["src/api/users.ts"],
        risk: {
          level: "medium",
          changedFiles: 1,
          categories: [{ category: "backend/api", files: ["src/api/users.ts"] }],
          reasons: ["Backend/API files changed."]
        },
        verificationCommands: [],
        verificationEvidence: [
          {
            command: "npm test",
            startedAt: "2026-06-17T12:01:00.000Z",
            finishedAt: "2026-06-17T12:01:05.000Z",
            durationMs: 5000,
            exitCode: 0,
            status: "passed",
            stdoutPath: ".agentflight/evidence/af-pr-comment/verification-1.stdout.txt",
            stderrPath: ".agentflight/evidence/af-pr-comment/verification-1.stderr.txt"
          }
        ],
        timelineEvents: [],
        review: {
          focus: [
            {
              rank: 1,
              file: "src/api/users.ts",
              category: "backend/api",
              riskLevel: "medium",
              score: 70,
              reasons: ["backend/API file"],
              suggestedReviewerFocus: "Check request handling, validation, and error paths first.",
              proofStatus: "covered",
              relatedProofGapIds: []
            }
          ],
          proofGaps: [],
          readiness: {
            state: "ready_for_review",
            label: "Ready for review",
            reason: "Verification evidence matches the observed review risk.",
            nextAction:
              "Generate or share the AgentFlight report/replay and request scoped human review.",
            proofGaps: []
          }
        },
        tooling: {
          projscan: { available: true, warnings: [] },
          agentloopkit: { available: true, warnings: [] }
        }
      },
      { mode: "pr-comment" }
    );

    expect(markdown).toContain("## AgentFlight Review Summary");
    expect(markdown).toContain("Generated locally by AgentFlight. Not posted automatically.");
    expect(markdown).toContain("Readiness: Ready for review");
    expect(markdown).toContain("Review first");
    expect(markdown).toContain("src/api/users.ts");
    expect(markdown).toContain("Proof gaps: none");
    expect(markdown).toContain("npm test: passed");
    expect(markdown).toContain(".agentflight/evidence/af-pr-comment/verification-1.stdout.txt");
    expect(markdown).not.toContain("## Timeline");
    expect(markdown).not.toContain("## Tooling");
    expect(markdown).not.toContain("posted to GitHub");
  });
});

function headingLineIndex(markdown: string, heading: string): number {
  return markdown.split("\n").findIndex((line) => line === heading);
}
