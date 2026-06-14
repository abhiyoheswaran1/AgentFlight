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
      recommendation: "Run npm test."
    });

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Fix &lt;auth&gt; flow");
    expect(html).toContain("summary-grid");
    expect(html).toContain("Changed Files");
    expect(html).toContain("1");
    expect(html).toContain("1 passed / 0 failed");
    expect(html).toContain("Not ready for review");
    expect(html).toContain("Evidence files");
    expect(html).toContain(".agentflight/evidence/verification-1.stdout.txt");
    expect(html).not.toMatch(/https?:\/\//);
    expect(html).not.toContain("<script");
  });
});
