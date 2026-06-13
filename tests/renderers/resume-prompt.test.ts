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
    expect(prompt).toContain("src/auth/reset.ts");
    expect(prompt).toContain("Do not start unrelated work.");
    expect(prompt).toContain("Do not claim completion without proof.");
    expect(prompt).toContain("Run relevant verification before declaring success.");
  });
});
