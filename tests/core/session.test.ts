import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTempRepo } from "../helpers/temp.js";
import { initAgentFlight } from "../../src/core/config.js";
import {
  buildSessionRecord,
  getSessionEvents,
  getVerificationRuns,
  startSession
} from "../../src/core/session.js";

describe("session records", () => {
  it("builds deterministic human-readable session metadata", () => {
    const session = buildSessionRecord({
      repoRoot: "/workspace/agentflight",
      task: "Add password reset flow",
      now: new Date("2026-06-13T12:34:56.000Z"),
      git: {
        branch: "main",
        commit: "abc123",
        dirty: true,
        changedFiles: ["src/auth/reset.ts"]
      },
      packageManager: "npm",
      repoSummary: "TypeScript CLI"
    });

    expect(session.id).toBe("af-20260613-123456-add-password-reset-flow");
    expect(session.task.title).toBe("Add password reset flow");
    expect(session.git.branch).toBe("main");
    expect(session.git.dirty).toBe(true);
    expect(session.packageManager).toBe("npm");
    expect(session.repoSummary).toBe("TypeScript CLI");
    expect(session.verificationRuns).toEqual([]);
    const events = session.events ?? [];
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      id: "evt-20260613-123456-session-started-001",
      type: "session_started",
      timestamp: "2026-06-13T12:34:56.000Z",
      title: "Session started"
    });
  });

  it("treats v0.1 sessions without verificationRuns or events as empty arrays", () => {
    const oldSession = {
      id: "af-old",
      task: { title: "Old session" },
      startedAt: "2026-06-13T12:00:00.000Z",
      repoRoot: "/workspace/agentflight",
      git: { branch: "main", commit: "abc123", dirty: false, changedFiles: [] },
      packageManager: "npm",
      verificationCommands: ["npm test"],
      tools: {
        projscan: { available: false, warnings: [] },
        agentloopkit: { available: false, warnings: [] }
      }
    };

    expect(getVerificationRuns(oldSession)).toEqual([]);
    expect(getSessionEvents(oldSession)).toEqual([]);
  });

  it("writes session, current pointer, and handoff files", async () => {
    const repoRoot = await createTempRepo();
    await initAgentFlight({ repoRoot, now: new Date("2026-06-13T12:00:00.000Z") });

    const result = await startSession({
      repoRoot,
      task: "Dogfood AgentFlight MVP",
      now: new Date("2026-06-13T12:34:56.000Z"),
      git: { branch: "main", commit: "abc123", dirty: false, changedFiles: [] },
      packageManager: "npm",
      verificationCommands: ["npm run typecheck", "npm test", "npm run build"],
      tools: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });

    expect(result.session.id).toBe("af-20260613-123456-dogfood-agentflight-mvp");
    await expect(
      readFile(join(repoRoot, ".agentflight", "sessions", `${result.session.id}.json`), "utf8")
    ).resolves.toContain("Dogfood AgentFlight MVP");
    await expect(
      readFile(join(repoRoot, ".agentflight", "current", "session.json"), "utf8")
    ).resolves.toContain("session_started");
    await expect(
      readFile(join(repoRoot, ".agentflight", "current", "handoff.md"), "utf8")
    ).resolves.toContain("Suggested proof");
  });
});
