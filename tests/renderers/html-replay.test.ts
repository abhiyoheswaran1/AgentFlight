import { describe, expect, it } from "vitest";
import { renderHtmlReplay } from "../../src/renderers/html-replay.js";

describe("HTML replay", () => {
  it("renders a self-contained escaped replay artifact", () => {
    const html = renderHtmlReplay({
      task: "Fix <auth> flow",
      sessionId: "af-1",
      startedAt: "2026-06-13T12:00:00.000Z",
      timeline: [{ label: "Session started", timestamp: "2026-06-13T12:00:00.000Z" }],
      changedFiles: ["src/auth/reset.ts"],
      riskBadges: ["high", "auth"],
      verificationEvidence: [],
      recommendation: "Run npm test."
    });

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Fix &lt;auth&gt; flow");
    expect(html).not.toMatch(/https?:\/\//);
    expect(html).not.toContain("<script");
  });
});
