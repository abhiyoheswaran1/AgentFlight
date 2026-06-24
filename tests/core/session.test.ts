import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTempRepo } from "../helpers/temp.js";
import { initAgentFlight } from "../../src/core/config.js";
import {
  addSessionEvent,
  addReviewReceipt,
  appendReviewReceipt,
  buildSessionRecord,
  getLatestReviewReceipt,
  getReviewReceipts,
  getSessionEvents,
  getVerificationRuns,
  listSessionSummaries,
  saveSession,
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
    expect(getReviewReceipts(oldSession)).toEqual([]);
    expect(getLatestReviewReceipt(oldSession)).toBeNull();
  });

  it("adds local review receipts without changing captured verification runs", async () => {
    const repoRoot = await createTempRepo();
    await initAgentFlight({ repoRoot, now: new Date("2026-06-13T12:00:00.000Z") });
    const result = await startSession({
      repoRoot,
      task: "Receipt session",
      now: new Date("2026-06-13T12:34:56.000Z"),
      git: { branch: "main", commit: "abc123", dirty: true, changedFiles: ["src/auth/reset.ts"] },
      packageManager: "npm",
      verificationCommands: ["npm test"],
      tools: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });
    const withRun = {
      ...result.session,
      verificationRuns: [
        {
          command: "npm test",
          startedAt: "2026-06-13T12:35:00.000Z",
          finishedAt: "2026-06-13T12:35:01.000Z",
          durationMs: 1000,
          exitCode: 0,
          status: "passed" as const,
          stdoutPath: ".agentflight/evidence/verification-1.stdout.txt",
          stderrPath: ".agentflight/evidence/verification-1.stderr.txt"
        }
      ]
    };

    const withReceipt = addReviewReceipt(withRun, {
      decision: "accepted",
      recordedAt: "2026-06-13T12:40:00.000Z",
      summary: "Accepted local handoff.",
      snapshot: {
        branch: "main",
        gitCommit: "abc123",
        changedFiles: ["src/auth/reset.ts"],
        readinessState: "ready_for_review",
        verificationPassed: 1,
        verificationFailed: 0,
        artifactPath: ".agentflight/reports/af-receipt-session-handoff.md"
      }
    });

    expect(getVerificationRuns(withReceipt)).toEqual(withRun.verificationRuns);
    expect(getReviewReceipts(withReceipt)).toHaveLength(1);
    expect(getLatestReviewReceipt(withReceipt)).toMatchObject({
      id: "receipt-20260613-124000-accepted-001",
      decision: "accepted",
      recordedAt: "2026-06-13T12:40:00.000Z",
      summary: "Accepted local handoff.",
      snapshot: {
        changedFiles: ["src/auth/reset.ts"],
        readinessState: "ready_for_review",
        verificationPassed: 1,
        verificationFailed: 0
      }
    });
    expect(getSessionEvents(withReceipt).at(-1)).toMatchObject({
      type: "review_receipt_recorded",
      title: "Review receipt recorded",
      metadata: {
        decision: "accepted",
        artifactPath: ".agentflight/reports/af-receipt-session-handoff.md"
      }
    });
  });

  it("persists appended local review receipts to the session and current pointer", async () => {
    const repoRoot = await createTempRepo();
    await initAgentFlight({ repoRoot, now: new Date("2026-06-13T12:00:00.000Z") });
    const result = await startSession({
      repoRoot,
      task: "Persist receipt",
      now: new Date("2026-06-13T12:34:56.000Z"),
      git: { branch: "main", commit: "abc123", dirty: true, changedFiles: ["README.md"] },
      packageManager: "npm",
      tools: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });

    await appendReviewReceipt(repoRoot, result.session, {
      decision: "accepted",
      recordedAt: "2026-06-13T12:45:00.000Z",
      summary: "Accepted docs handoff.",
      snapshot: {
        branch: "main",
        gitCommit: "abc123",
        changedFiles: ["README.md"],
        readinessState: "ready_for_review",
        verificationPassed: 0,
        verificationFailed: 0
      }
    });

    await expect(
      readFile(join(repoRoot, ".agentflight", "sessions", `${result.session.id}.json`), "utf8")
    ).resolves.toContain("Accepted docs handoff.");
    await expect(
      readFile(join(repoRoot, ".agentflight", "current", "session.json"), "utf8")
    ).resolves.toContain("review_receipt_recorded");
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

  it("escapes unsafe Markdown text in initial handoff files", async () => {
    const repoRoot = await createTempRepo();
    await initAgentFlight({ repoRoot, now: new Date("2026-06-13T12:00:00.000Z") });

    await startSession({
      repoRoot,
      task: "Review <script>alert('x')</script>\n## injected heading",
      now: new Date("2026-06-13T12:34:56.000Z"),
      git: {
        branch: "feature/<unsafe>",
        commit: "abc<123>",
        dirty: true,
        changedFiles: ["README.md"]
      },
      packageManager: "npm",
      verificationCommands: [`npm test -- --grep "auth <session>"`],
      tools: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });

    const handoff = await readFile(join(repoRoot, ".agentflight", "current", "handoff.md"), "utf8");

    expect(handoff).toContain("Review &lt;script&gt;alert('x')&lt;/script&gt; ## injected heading");
    expect(handoff).toContain("Git branch: feature/&lt;unsafe&gt;");
    expect(handoff).toContain(`- npm test -- --grep "auth &lt;session&gt;"`);
    expect(handoff).not.toContain("<script>");
    expect(handoff).not.toContain("\n## injected heading");
  });

  it("lists valid session summaries newest first and reports malformed files", async () => {
    const repoRoot = await createTempRepo();
    await initAgentFlight({ repoRoot, now: new Date("2026-06-13T12:00:00.000Z") });

    const older = await startSession({
      repoRoot,
      task: "Older task",
      now: new Date("2026-06-13T10:00:00.000Z"),
      git: { branch: "main", commit: "older", dirty: false, changedFiles: [] },
      packageManager: "npm",
      tools: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });
    const newer = await startSession({
      repoRoot,
      task: "Newer task",
      now: new Date("2026-06-13T11:00:00.000Z"),
      git: { branch: "feature/history", commit: "newer", dirty: true, changedFiles: [] },
      packageManager: "npm",
      tools: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });

    await writeFile(join(repoRoot, ".agentflight", "sessions", "broken.json"), "{", "utf8");

    const history = await listSessionSummaries(repoRoot);

    expect(history.sessions.map((session) => session.id)).toEqual([
      newer.session.id,
      older.session.id
    ]);
    expect(history.sessions[0]).toMatchObject({
      taskTitle: "Newer task",
      startedAt: "2026-06-13T11:00:00.000Z",
      branch: "feature/history",
      verificationPassed: 0,
      verificationFailed: 0
    });
    expect(history.skipped).toHaveLength(1);
    expect(history.skipped[0]?.path).toContain("broken.json");
  });

  it("extracts latest recorded artifact readiness from report and replay events", async () => {
    const repoRoot = await createTempRepo();
    await initAgentFlight({ repoRoot, now: new Date("2026-06-13T12:00:00.000Z") });

    const result = await startSession({
      repoRoot,
      task: "Review recorded readiness",
      now: new Date("2026-06-13T11:00:00.000Z"),
      git: { branch: "main", commit: "abc123", dirty: false, changedFiles: [] },
      packageManager: "npm",
      tools: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });
    const withReport = addSessionEvent(result.session, {
      type: "report_generated",
      timestamp: "2026-06-13T11:05:00.000Z",
      title: "Report generated",
      metadata: {
        path: ".agentflight/reports/af-test-proof.md",
        readiness: {
          state: "needs_verification",
          label: "Needs verification",
          riskLevel: "medium",
          changedFiles: 2,
          verificationPassed: 0,
          verificationFailed: 0
        }
      }
    });
    const withReplay = addSessionEvent(withReport, {
      type: "replay_generated",
      timestamp: "2026-06-13T11:06:00.000Z",
      title: "Replay generated",
      metadata: {
        path: ".agentflight/reports/af-test-replay.html",
        readiness: {
          state: "ready_for_review",
          label: "Ready for review",
          riskLevel: "low",
          changedFiles: 1,
          verificationPassed: 1,
          verificationFailed: 0
        }
      }
    });
    await saveSession(repoRoot, withReplay);

    const history = await listSessionSummaries(repoRoot);

    expect(history.sessions[0]?.latestReview).toEqual({
      state: "ready_for_review",
      label: "Ready for review",
      riskLevel: "low",
      changedFiles: 1,
      verificationPassed: 1,
      verificationFailed: 0,
      artifactPath: ".agentflight/reports/af-test-replay.html",
      generatedAt: "2026-06-13T11:06:00.000Z"
    });
  });

  it("preserves clean-worktree readiness from artifact metadata", async () => {
    const repoRoot = await createTempRepo();
    await initAgentFlight({ repoRoot, now: new Date("2026-06-13T12:00:00.000Z") });

    const result = await startSession({
      repoRoot,
      task: "Clean readiness",
      now: new Date("2026-06-13T11:00:00.000Z"),
      git: { branch: "main", commit: "abc123", dirty: false, changedFiles: [] },
      packageManager: "npm",
      tools: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });
    await saveSession(
      repoRoot,
      addSessionEvent(result.session, {
        type: "report_generated",
        timestamp: "2026-06-13T11:05:00.000Z",
        title: "Report generated",
        metadata: {
          path: ".agentflight/reports/af-test-proof.md",
          readiness: {
            state: "clean_worktree",
            label: "Clean worktree",
            riskLevel: "unknown",
            changedFiles: 0,
            verificationPassed: 1,
            verificationFailed: 0
          }
        }
      })
    );

    const history = await listSessionSummaries(repoRoot);

    expect(history.sessions[0]?.latestReview).toMatchObject({
      state: "clean_worktree",
      label: "Clean worktree",
      riskLevel: "unknown",
      changedFiles: 0,
      verificationPassed: 1,
      verificationFailed: 0
    });
  });

  it("prefers review-ready artifact metadata over later clean-worktree metadata", async () => {
    const repoRoot = await createTempRepo();
    await initAgentFlight({ repoRoot, now: new Date("2026-06-13T12:00:00.000Z") });

    const result = await startSession({
      repoRoot,
      task: "Prefer review artifact",
      now: new Date("2026-06-13T11:00:00.000Z"),
      git: { branch: "main", commit: "abc123", dirty: false, changedFiles: [] },
      packageManager: "npm",
      tools: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });
    const withReadyReplay = addSessionEvent(result.session, {
      type: "replay_generated",
      timestamp: "2026-06-13T11:05:00.000Z",
      title: "Replay generated",
      metadata: {
        path: ".agentflight/reports/af-test-replay.html",
        readiness: {
          state: "ready_for_review",
          label: "Ready for review",
          riskLevel: "medium",
          changedFiles: 2,
          verificationPassed: 1,
          verificationFailed: 0
        }
      }
    });
    const withCleanReport = addSessionEvent(withReadyReplay, {
      type: "report_generated",
      timestamp: "2026-06-13T11:10:00.000Z",
      title: "Report generated",
      metadata: {
        path: ".agentflight/reports/af-test-proof.md",
        readiness: {
          state: "clean_worktree",
          label: "Clean worktree",
          riskLevel: "none",
          changedFiles: 0,
          verificationPassed: 1,
          verificationFailed: 0
        }
      }
    });
    await saveSession(repoRoot, withCleanReport);

    const history = await listSessionSummaries(repoRoot);

    expect(history.sessions[0]?.latestReview).toEqual({
      state: "ready_for_review",
      label: "Ready for review",
      riskLevel: "medium",
      changedFiles: 2,
      verificationPassed: 1,
      verificationFailed: 0,
      artifactPath: ".agentflight/reports/af-test-replay.html",
      generatedAt: "2026-06-13T11:05:00.000Z"
    });
  });

  it("ignores malformed artifact readiness metadata in session summaries", async () => {
    const repoRoot = await createTempRepo();
    await initAgentFlight({ repoRoot, now: new Date("2026-06-13T12:00:00.000Z") });

    const result = await startSession({
      repoRoot,
      task: "Malformed recorded readiness",
      now: new Date("2026-06-13T11:00:00.000Z"),
      git: { branch: "main", commit: "abc123", dirty: false, changedFiles: [] },
      packageManager: "npm",
      tools: {
        projscan: { available: true, warnings: [] },
        agentloopkit: { available: true, warnings: [] }
      }
    });
    await saveSession(
      repoRoot,
      addSessionEvent(result.session, {
        type: "report_generated",
        timestamp: "2026-06-13T11:05:00.000Z",
        title: "Report generated",
        metadata: {
          path: ".agentflight/reports/af-test-proof.md",
          readiness: {
            state: "ready_for_review",
            label: "Ready for review",
            riskLevel: "low",
            changedFiles: "one",
            verificationPassed: 1,
            verificationFailed: 0
          }
        }
      })
    );

    const history = await listSessionSummaries(repoRoot);

    expect(history.sessions[0]?.latestReview).toBeUndefined();
  });
});
