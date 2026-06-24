import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTempRepo } from "../helpers/temp.js";
import { createDefaultConfig, initAgentFlight, loadConfig } from "../../src/core/config.js";

describe("AgentFlight config", () => {
  it("creates the default local-first config shape", () => {
    const config = createDefaultConfig({
      repoRoot: "/workspace/My Repo",
      now: new Date("2026-06-13T12:00:00.000Z")
    });

    expect(config).toMatchObject({
      version: 1,
      projectName: "My Repo",
      createdAt: "2026-06-13T12:00:00.000Z",
      engines: {
        projscan: { enabled: true, mode: "npx" },
        agentloopkit: { enabled: true, mode: "npx" }
      },
      verification: { commands: [], profiles: {} },
      changedFileFilters: { ignore: [] },
      privacy: { localOnly: true, telemetry: false }
    });
    expect(config.projectReviewContract).toMatchObject({
      enabled: true,
      rules: expect.arrayContaining([
        expect.objectContaining({
          id: "missing-auth-test-proof",
          label: "Sensitive auth, payment, or security review",
          categories: ["auth", "billing/payments", "security/secrets"],
          requiredProof: ["test"],
          manualReview: expect.arrayContaining([
            "Review session, permission, identity, payment, or credential boundaries manually."
          ])
        }),
        expect.objectContaining({
          id: "missing-source-proof",
          label: "Source behavior review",
          categories: ["source"],
          requiredProof: ["test", "typecheck", "build"]
        })
      ])
    });
  });

  it("loads older configs without changed-file filter settings", async () => {
    const repoRoot = await createTempRepo();
    const root = join(repoRoot, ".agentflight");
    const configPath = join(root, "config.json");
    await mkdir(root, { recursive: true });
    await writeFile(
      configPath,
      JSON.stringify(
        {
          version: 1,
          projectName: "old",
          createdAt: "2026-06-13T12:00:00.000Z",
          engines: {
            projscan: { enabled: true, mode: "npx" },
            agentloopkit: { enabled: true, mode: "npx" }
          },
          verification: { commands: [] },
          privacy: { localOnly: true, telemetry: false }
        },
        null,
        2
      )
    );

    await expect(loadConfig(repoRoot)).resolves.toMatchObject({
      version: 1,
      projectName: "old",
      verification: { commands: [] }
    });
  });

  it("initialises .agentflight without overwriting an existing config", async () => {
    const repoRoot = await createTempRepo();
    await writeFile(
      join(repoRoot, "package.json"),
      JSON.stringify(
        {
          scripts: {
            typecheck: "tsc --noEmit",
            test: "vitest run"
          }
        },
        null,
        2
      )
    );
    const root = join(repoRoot, ".agentflight");
    const configPath = join(root, "config.json");
    await mkdir(root, { recursive: true });
    await writeFile(configPath, JSON.stringify({ version: 99, keep: true }, null, 2));

    const result = await initAgentFlight({
      repoRoot,
      now: new Date("2026-06-13T12:00:00.000Z")
    });

    const gitignorePath = join(root, ".gitignore");

    expect(result.paths.config).toBe(configPath);
    expect(result.skipped).toContain(configPath);
    expect(result.created).toContain(gitignorePath);
    expect(result.detectedVerificationCommands).toEqual(["npm run typecheck", "npm test"]);
    expect(JSON.parse(await readFile(configPath, "utf8"))).toEqual({ version: 99, keep: true });

    await expect(readFile(gitignorePath, "utf8")).resolves.toBe(
      ["/sessions/", "/reports/", "/evidence/", "/current/", ""].join("\n")
    );
    await expect(readFile(join(root, "sessions", ".gitkeep"), "utf8")).rejects.toThrow();
    await expect(readFile(join(root, "reports", ".gitkeep"), "utf8")).rejects.toThrow();
    await expect(readFile(join(root, "evidence", ".gitkeep"), "utf8")).rejects.toThrow();
    await expect(readFile(join(root, "current", ".gitkeep"), "utf8")).rejects.toThrow();
  });

  it("seeds detected verification commands into newly created configs", async () => {
    const repoRoot = await createTempRepo();
    await writeFile(
      join(repoRoot, "package.json"),
      JSON.stringify(
        {
          scripts: {
            typecheck: "tsc --noEmit",
            test: "vitest run",
            build: "vite build"
          }
        },
        null,
        2
      )
    );

    const result = await initAgentFlight({
      repoRoot,
      now: new Date("2026-06-13T12:00:00.000Z")
    });

    expect(result.config.verification).toEqual({
      commands: ["npm run typecheck", "npm test", "npm run build"],
      profiles: {}
    });
    await expect(loadConfig(repoRoot)).resolves.toMatchObject({
      verification: {
        commands: ["npm run typecheck", "npm test", "npm run build"],
        profiles: {}
      }
    });
  });

  it("keeps verification commands empty when no proof scripts are detected", async () => {
    const repoRoot = await createTempRepo();
    await writeFile(
      join(repoRoot, "package.json"),
      JSON.stringify(
        {
          scripts: {
            dev: "vite"
          }
        },
        null,
        2
      )
    );

    const result = await initAgentFlight({
      repoRoot,
      now: new Date("2026-06-13T12:00:00.000Z")
    });

    expect(result.config.verification).toEqual({ commands: [], profiles: {} });
    await expect(loadConfig(repoRoot)).resolves.toMatchObject({
      verification: { commands: [], profiles: {} }
    });
  });
});
