import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const publicCopyFiles = [
  "README.md",
  "CHANGELOG.md",
  "package.json",
  "src/cli.ts",
  "src/commands/start.ts",
  "src/adapters/projscan.ts",
  "src/core/session.ts",
  "docs/architecture/overview.md",
  "docs/development/product-direction.md",
  "docs/roadmap/index.md",
  "docs/marketing/agentflight-v0.6.0-website-update-prompt.md"
];

const stalePositioningPatterns = [
  /\bAI-assisted\b/i,
  /\bAI coding\b/i,
  /\bAI-agent\b/i,
  /\bcoding assistant\b/i
];

describe("public positioning copy", () => {
  it("keeps current public surfaces aligned with coding-agent positioning", async () => {
    const matches: string[] = [];

    for (const file of publicCopyFiles) {
      const content = await readFile(file, "utf8");
      for (const pattern of stalePositioningPatterns) {
        if (pattern.test(content)) {
          matches.push(`${file}: ${pattern.source}`);
        }
      }
    }

    expect(matches).toEqual([]);
  });
});
