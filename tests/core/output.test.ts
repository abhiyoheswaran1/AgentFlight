import { describe, expect, it } from "vitest";
import {
  AGENTFLIGHT_PROJECT_CONFIG_GUIDANCE,
  AGENTFLIGHT_RUNTIME_EVIDENCE_GUIDANCE,
  formatAgentFlightGeneratedFileList,
  formatAgentFlightLocalFilesGuidance
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
});
