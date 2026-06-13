import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTempRepo } from "../helpers/temp.js";
import { createDefaultConfig, initAgentFlight } from "../../src/core/config.js";

describe("AgentFlight config", () => {
  it("creates the default local-first config shape", () => {
    const config = createDefaultConfig({
      repoRoot: "/workspace/My Repo",
      now: new Date("2026-06-13T12:00:00.000Z")
    });

    expect(config).toEqual({
      version: 1,
      projectName: "My Repo",
      createdAt: "2026-06-13T12:00:00.000Z",
      engines: {
        projscan: { enabled: true, mode: "npx" },
        agentloopkit: { enabled: true, mode: "npx" }
      },
      verification: { commands: [] },
      privacy: { localOnly: true, telemetry: false }
    });
  });

  it("initialises .agentflight without overwriting an existing config", async () => {
    const repoRoot = await createTempRepo();
    const root = join(repoRoot, ".agentflight");
    const configPath = join(root, "config.json");
    await mkdir(root, { recursive: true });
    await writeFile(configPath, JSON.stringify({ version: 99, keep: true }, null, 2));

    const result = await initAgentFlight({
      repoRoot,
      now: new Date("2026-06-13T12:00:00.000Z")
    });

    expect(result.paths.config).toBe(configPath);
    expect(result.skipped).toContain(configPath);
    expect(JSON.parse(await readFile(configPath, "utf8"))).toEqual({ version: 99, keep: true });

    await expect(readFile(join(root, "sessions", ".gitkeep"), "utf8")).resolves.toBe("");
    await expect(readFile(join(root, "reports", ".gitkeep"), "utf8")).resolves.toBe("");
    await expect(readFile(join(root, "current", ".gitkeep"), "utf8")).resolves.toBe("");
  });
});
