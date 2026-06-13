import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runSnapshotCommand } from "../../src/commands/snapshot.js";
import { initAgentFlight } from "../../src/core/config.js";
import { startSession } from "../../src/core/session.js";
import { createTempRepo } from "../helpers/temp.js";

describe("snapshot command", () => {
  it("requires an active session", async () => {
    const repoRoot = await createTempRepo();
    await initAgentFlight({ repoRoot, now: new Date("2026-06-13T12:00:00.000Z") });

    await expect(runSnapshotCommand({ repoRoot })).rejects.toThrow();
  });

  it("records a snapshot event with the supplied note", async () => {
    const repoRoot = await startedRepo();

    const result = await runSnapshotCommand({
      repoRoot,
      note: "Initial implementation completed",
      now: new Date("2026-06-13T12:30:00.000Z"),
      git: {
        branch: "main",
        commit: "abc123",
        dirty: true,
        changedFiles: ["docs/development/verification.md", "docs/roadmap.md"]
      }
    });

    expect(result.output).toContain("Snapshot recorded");
    expect(result.output).toContain("Initial implementation completed");
    expect(result.output).toContain("Risk: low");

    const current = JSON.parse(
      await readFile(join(repoRoot, ".agentflight", "current", "session.json"), "utf8")
    );
    const snapshot = current.events.find(
      (event: { type: string }) => event.type === "snapshot_created"
    );

    expect(snapshot).toMatchObject({
      type: "snapshot_created",
      timestamp: "2026-06-13T12:30:00.000Z",
      title: "Snapshot created",
      message: "Initial implementation completed",
      metadata: {
        git: {
          branch: "main",
          commit: "abc123",
          dirty: true,
          changedFiles: ["docs/development/verification.md", "docs/roadmap.md"]
        },
        risk: {
          level: "low",
          changedFiles: 2
        },
        verification: {
          passed: 0,
          failed: 0,
          readiness: "Not ready for review"
        }
      }
    });
  });
});

async function startedRepo(): Promise<string> {
  const repoRoot = await createTempRepo();
  await initAgentFlight({ repoRoot, now: new Date("2026-06-13T11:00:00.000Z") });
  await startSession({
    repoRoot,
    task: "Capture snapshots",
    now: new Date("2026-06-13T11:30:00.000Z"),
    git: { branch: "main", commit: "abc123", dirty: false, changedFiles: [] },
    packageManager: "npm",
    verificationCommands: ["npm test"],
    tools: {
      projscan: { available: true, warnings: [] },
      agentloopkit: { available: true, warnings: [] }
    }
  });
  return repoRoot;
}
