import { describe, expect, it } from "vitest";
import {
  createAgentFlightGuardSummary,
  renderAgentFlightGuardSummary
} from "../../src/core/guard.js";
import type { AgentFlightGuardSummary, AgentFlightResultV1 } from "../../src/types/index.js";

describe("AgentFlight Guard core", () => {
  it("promotes failed verification proof gaps into blocking guard signals", () => {
    const summary = createAgentFlightGuardSummary({
      generatedAt: new Date("2026-06-28T12:00:00.000Z"),
      task: { title: "Reset auth" },
      changedFiles: ["src/auth/reset.ts", "tests/auth/reset.test.ts"],
      verification: {
        passed: 1,
        failed: 1,
        unresolvedFailed: 1,
        resolvedFailed: 0
      },
      review: {
        readiness: {
          state: "blocked_by_failed_verification",
          label: "Blocked by failed verification",
          reason: "A verification command failed.",
          nextAction: "Fix the failed command, then rerun agentflight verify -- npm test -- auth",
          suggestedCommand: "npm test -- auth"
        },
        proofGaps: [
          {
            id: "failed-verification",
            severity: "blocking",
            message: "A verification command failed and must be fixed or rerun successfully.",
            suggestedCommand: "npm test -- auth",
            relatedFiles: ["src/auth/reset.ts"]
          }
        ],
        trustDelta: {
          summary: "Trust changed because proof failed.",
          items: []
        },
        reviewQueue: [],
        reviewRoutes: { items: [] }
      },
      baseframe: null,
      nextAction: "Fix the failed command, then rerun agentflight verify -- npm test -- auth"
    });

    expect(summary).toMatchObject({
      schemaVersion: "1.0",
      kind: "agentflight-guard-summary",
      generatedAt: "2026-06-28T12:00:00.000Z",
      taskTitle: "Reset auth",
      readiness: {
        state: "blocked_by_failed_verification",
        label: "Blocked by failed verification"
      },
      changedFiles: {
        count: 2,
        paths: ["src/auth/reset.ts", "tests/auth/reset.test.ts"]
      },
      verification: {
        passed: 1,
        failed: 1,
        unresolvedFailed: 1,
        resolvedFailed: 0
      }
    });
    expect(summary.signals[0]).toMatchObject({
      id: "failed-verification",
      severity: "blocking",
      source: "agentflight",
      category: "proof-gap",
      suggestedCommand: "npm test -- auth",
      relatedFiles: ["src/auth/reset.ts"]
    });
    expect(summary.nextAction).toBe(
      "Fix the failed command, then rerun agentflight verify -- npm test -- auth"
    );
  });

  it("adds Baseframe scope drift and non-passing gate signals", () => {
    const baseframe = baseframeResult({
      scopeDrift: [
        { path: "package.json", reason: "inside-excluded-scope" },
        { path: "docs/reset.md", reason: "outside-allowed-scope" }
      ],
      gates: [
        { gateId: "typecheck", command: "npm run typecheck", status: "passed" },
        { gateId: "auth-tests", command: "npm test -- auth", status: "failed" },
        { gateId: "build", command: "npm run build", status: "missing" },
        { gateId: "lint", command: "npm run lint", status: "incomplete" },
        { gateId: "docs", command: "npm run docs:check", status: "skipped" }
      ]
    });

    const summary = createAgentFlightGuardSummary({
      generatedAt: new Date("2026-06-28T12:00:00.000Z"),
      task: { title: "Reset auth" },
      changedFiles: ["package.json", "docs/reset.md", "src/auth/reset.ts"],
      verification: {
        passed: 1,
        failed: 1,
        unresolvedFailed: 1,
        resolvedFailed: 0
      },
      review: readyReview(),
      baseframe,
      nextAction: "Fix scope drift before review."
    });

    expect(summary.baseframe).toMatchObject({
      taskId: "auth-password-reset-20260626-01",
      gateCounts: {
        passed: 1,
        failed: 1,
        incomplete: 1,
        missing: 1,
        skipped: 1
      }
    });
    expect(summary.signals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "baseframe-scope-package.json",
          severity: "blocking",
          source: "baseframe",
          category: "scope-drift"
        }),
        expect.objectContaining({
          id: "baseframe-scope-docs/reset.md",
          severity: "warning",
          source: "baseframe",
          category: "scope-drift"
        }),
        expect.objectContaining({
          id: "baseframe-gate-auth-tests",
          severity: "blocking",
          source: "baseframe",
          category: "verification-gate",
          suggestedCommand: "npm test -- auth"
        }),
        expect.objectContaining({
          id: "baseframe-gate-build",
          severity: "blocking",
          source: "baseframe",
          category: "verification-gate",
          suggestedCommand: "npm run build"
        }),
        expect.objectContaining({
          id: "baseframe-gate-lint",
          severity: "blocking",
          source: "baseframe",
          category: "verification-gate",
          suggestedCommand: "npm run lint"
        }),
        expect.objectContaining({
          id: "baseframe-gate-docs",
          severity: "warning",
          source: "baseframe",
          category: "verification-gate",
          suggestedCommand: "npm run docs:check"
        })
      ])
    );
  });

  it("renders one calm source-free guard view", () => {
    const rendered = renderAgentFlightGuardSummary(
      guardSummary({
        signals: [
          {
            id: "failed-verification",
            severity: "blocking",
            source: "agentflight",
            category: "proof-gap",
            message: "A verification command failed.",
            relatedFiles: ["src/auth/reset.ts"],
            suggestedCommand: "npm test -- auth"
          }
        ]
      })
    );

    expect(rendered).toContain("AgentFlight guard");
    expect(rendered).toContain("Trust state:\nBlocked by failed verification");
    expect(rendered).toContain("Changed files:\n2");
    expect(rendered).toContain("Verification:\n1 passed, 1 failed");
    expect(rendered).toContain("Trust signals:\n- blocking - A verification command failed.");
    expect(rendered).toContain("Files: src/auth/reset.ts");
    expect(rendered).toContain("Suggested proof: agentflight verify -- npm test -- auth");
    expect(rendered.match(/^Next action:/gm)).toHaveLength(1);
    expect(rendered).toContain("Local only: no upload, no telemetry, no automatic PR comment.");
    expect(rendered).not.toContain(process.cwd());
  });

  it("renders Review Passport and Baseframe finish targets when provided", () => {
    const rendered = renderAgentFlightGuardSummary(
      guardSummary({
        artifactHints: {
          reviewPassportJson: ".agentflight/reports/20260628-120000-review-passport.json",
          reviewPassportMarkdown: ".agentflight/reports/20260628-120000-review-passport.md",
          baseframeResult:
            ".baseframe/evidence/auth-password-reset-20260626-01/agentflight-result.json"
        }
      })
    );

    expect(rendered).toContain("Finish targets:");
    expect(rendered).toContain(
      "- Review Passport JSON: .agentflight/reports/20260628-120000-review-passport.json"
    );
    expect(rendered).toContain(
      "- Baseframe result: .baseframe/evidence/auth-password-reset-20260626-01/agentflight-result.json"
    );
  });

  it("creates a ready signal when no trust blockers exist", () => {
    const summary = createAgentFlightGuardSummary({
      generatedAt: new Date("2026-06-28T12:00:00.000Z"),
      task: { title: "Docs polish" },
      changedFiles: ["README.md"],
      verification: {
        passed: 1,
        failed: 0,
        unresolvedFailed: 0,
        resolvedFailed: 0
      },
      review: readyReview(),
      baseframe: null,
      nextAction: "Run agentflight finish to write the Review Passport."
    });

    expect(summary.signals).toEqual([
      expect.objectContaining({
        id: "ready-for-review",
        severity: "info",
        source: "agentflight",
        category: "readiness",
        message: "No blocking guard signals detected."
      })
    ]);
  });
});

function readyReview() {
  return {
    readiness: {
      state: "ready_for_review" as const,
      label: "Ready for review",
      reason: "Required proof is current.",
      nextAction: "Run agentflight finish to write the Review Passport."
    },
    proofGaps: [],
    trustDelta: {
      summary: "No blocking trust changes.",
      items: []
    },
    reviewQueue: [],
    reviewRoutes: { items: [] }
  };
}

function guardSummary(overrides: Partial<AgentFlightGuardSummary> = {}): AgentFlightGuardSummary {
  return {
    schemaVersion: "1.0",
    kind: "agentflight-guard-summary",
    generatedAt: "2026-06-28T12:00:00.000Z",
    taskTitle: "Reset auth",
    readiness: {
      state: "blocked_by_failed_verification",
      label: "Blocked by failed verification",
      reason: "A verification command failed.",
      nextAction: "Fix the failed command, then rerun agentflight verify -- npm test -- auth",
      suggestedCommand: "npm test -- auth"
    },
    changedFiles: {
      count: 2,
      paths: ["src/auth/reset.ts", "tests/auth/reset.test.ts"]
    },
    verification: {
      passed: 1,
      failed: 1,
      unresolvedFailed: 1,
      resolvedFailed: 0
    },
    signals: [],
    reviewQueue: [],
    reviewRoutes: [],
    nextAction: "Fix the failed command, then rerun agentflight verify -- npm test -- auth",
    localOnly: true,
    ...overrides
  };
}

function baseframeResult(overrides: Partial<AgentFlightResultV1> = {}): AgentFlightResultV1 {
  return {
    schemaVersion: "1.0",
    kind: "agentflight-result",
    producer: { name: "agentflight", version: "0.15.0" },
    taskId: "auth-password-reset-20260626-01",
    generatedAt: "2026-06-28T12:00:00.000Z",
    source: {},
    readiness: "blocked_by_failed_verification",
    summary: "Blocked by failed verification.",
    changedFiles: ["src/auth/reset.ts"],
    scopeDrift: [],
    verification: [],
    gates: [],
    proofGaps: [],
    reviewFocus: [],
    artifacts: [],
    ...overrides
  };
}
