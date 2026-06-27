import { describe, expect, it } from "vitest";
import {
  filterAgentFlightRuntimePaths,
  filterBuiltInRuntimePaths,
  filterChangedFiles,
  isBaseframeAgentFlightOutputPath,
  isAgentLoopKitEvidencePath,
  isAgentFlightRuntimePath
} from "../../src/core/changed-files.js";

describe("changed-file filtering", () => {
  it("keeps AgentFlight runtime filters always on while leaving config visible", () => {
    const files = [
      ".agentflight/current/session.json",
      ".agentflight/evidence/af-test/verification-1.stdout.txt",
      ".agentflight/reports/af-test-proof.md",
      ".agentflight/sessions/af-test.json",
      ".agentflight/config.json",
      "src/auth/session.ts"
    ];

    expect(filterAgentFlightRuntimePaths(files)).toEqual([
      ".agentflight/config.json",
      "src/auth/session.ts"
    ]);
    expect(isAgentFlightRuntimePath(".agentflight/config.json")).toBe(false);
  });

  it("keeps AgentLoopKit evidence filters always on while leaving contracts and policy visible", () => {
    const files = [
      ".agentloop/state.json",
      ".agentloop/reports/2026-06-19-verification-report.md",
      ".agentloop/handoffs/2026-06-19-pr-summary.md",
      ".agentloop/runs/2026-06-19-handoff/metadata.json",
      ".agentloop/tasks/2026-06-19-implementation.md",
      ".agentloop/policies/security.md",
      ".agentloop/harness/commands.json",
      ".agentloop/gates/review.md",
      "src/auth/session.ts"
    ];

    expect(filterBuiltInRuntimePaths(files)).toEqual([
      ".agentloop/tasks/2026-06-19-implementation.md",
      ".agentloop/policies/security.md",
      ".agentloop/harness/commands.json",
      ".agentloop/gates/review.md",
      "src/auth/session.ts"
    ]);
    expect(isAgentLoopKitEvidencePath(".agentloop/state.json")).toBe(true);
    expect(isAgentLoopKitEvidencePath(".agentloop/tasks/2026-06-19-implementation.md")).toBe(false);
  });

  it("filters AgentFlight-owned Baseframe output while leaving source contracts visible", () => {
    const files = [
      ".baseframe/agent-workflow.json",
      ".baseframe/evidence/auth-password-reset-20260626-01/agentflight-result.json",
      ".baseframe/evidence/auth-password-reset-20260626-01/agentloopkit-task.json",
      ".baseframe/evidence/auth-password-reset-20260626-01/projscan-assessment.json",
      "src/auth/session.ts"
    ];

    expect(filterBuiltInRuntimePaths(files)).toEqual([
      ".baseframe/evidence/auth-password-reset-20260626-01/agentloopkit-task.json",
      ".baseframe/evidence/auth-password-reset-20260626-01/projscan-assessment.json",
      "src/auth/session.ts"
    ]);
    expect(
      isBaseframeAgentFlightOutputPath(
        ".baseframe/evidence/auth-password-reset-20260626-01/agentflight-result.json"
      )
    ).toBe(true);
    expect(
      isBaseframeAgentFlightOutputPath(
        ".baseframe/evidence/auth-password-reset-20260626-01/agentloopkit-task.json"
      )
    ).toBe(false);
  });

  it("applies user-configured generated/internal ignore patterns after built-in filters", () => {
    expect(
      filterChangedFiles(
        [
          ".agentflight/current/session.json",
          ".projscan-memory/memory.json",
          "coverage/lcov.info",
          "dist/cli.js",
          "src/auth/session.ts"
        ],
        {
          ignore: [".projscan-memory/**", "coverage/**", "dist/**"]
        }
      )
    ).toEqual(["src/auth/session.ts"]);
  });

  it("supports exact paths, simple basename wildcards, and Windows-style separators", () => {
    expect(
      filterChangedFiles(
        [".projscan-memory\\memory.json", "debug.log", "src/server.log", "src/auth/session.ts"],
        {
          ignore: [".projscan-memory/**", "*.log"]
        }
      )
    ).toEqual(["src/auth/session.ts"]);
  });

  it("ignores empty or malformed ignore patterns without hiding normal files", () => {
    expect(
      filterChangedFiles(["src/auth/session.ts", "README.md"], {
        ignore: ["", "   ", "../outside/**"]
      })
    ).toEqual(["src/auth/session.ts", "README.md"]);
  });

  it("ignores a malformed ignore list value without crashing", () => {
    expect(
      filterChangedFiles([".projscan-memory/memory.json", "src/auth/session.ts"], {
        ignore: ".projscan-memory/**" as unknown as string[]
      })
    ).toEqual([".projscan-memory/memory.json", "src/auth/session.ts"]);
  });
});
