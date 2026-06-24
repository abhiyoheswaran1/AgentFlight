import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTempRepo } from "../helpers/temp.js";
import { initAgentFlight } from "../../src/core/config.js";
import { saveSession, startSession } from "../../src/core/session.js";
import { runHandoffCommand } from "../../src/commands/handoff.js";
import { runHistoryCommand } from "../../src/commands/history.js";
import { runReplayCommand } from "../../src/commands/replay.js";
import { runReportCommand } from "../../src/commands/report.js";
import { runResumeCommand } from "../../src/commands/resume.js";
import { runSnapshotCommand } from "../../src/commands/snapshot.js";
import { runStatusCommand } from "../../src/commands/status.js";
import { runVerifyCommand } from "../../src/commands/verify.js";
import type { AgentFlightSession, ProofSnapshot, VerificationRun } from "../../src/types/index.js";

describe("evidence-aware session outputs", () => {
  it("shows verification evidence and readiness in status", async () => {
    const command = `${process.execPath} -e "console.log('proof ok')"`;
    const repoRoot = await startedRepo([command]);
    await runVerifyCommand({
      repoRoot,
      commandArgs: [process.execPath, "-e", "console.log('proof ok')"],
      now: () => new Date("2026-06-13T12:00:00.000Z")
    });

    const status = await runStatusCommand({
      repoRoot,
      changedFiles: ["docs/development/verification.md"],
      now: new Date("2026-06-13T12:05:00.000Z")
    });

    expect(status.output).toContain("Changed areas:");
    expect(status.output).toContain("- docs: docs/development/verification.md");
    expect(status.output).toContain("Verification Evidence:");
    expect(status.output).toContain("1 passed, 0 failed");
    expect(status.output).toContain("Review first:");
    expect(status.output).toContain("docs/development/verification.md");
    expect(status.output).toContain("Review Contract:");
    expect(status.output).toContain("Session task: Capture verification");
    expect(status.output).toContain("Changed file reviewed: docs/development/verification.md");
    expect(status.output).toContain("Readiness: Ready for review");
    expect(status.output).toContain("Proof gaps:");
    expect(status.output).toContain("- none");
  });

  it("compacts long verification evidence commands in status without changing stored evidence", async () => {
    const longScript = `${"console.log('status command noise'); ".repeat(10)}process.exit(0);`;
    const repoRoot = await startedRepo([]);
    await runVerifyCommand({
      repoRoot,
      commandArgs: [process.execPath, "-e", longScript],
      now: () => new Date("2026-06-13T12:00:00.000Z")
    });

    const session = JSON.parse(
      await readFile(join(repoRoot, ".agentflight", "current", "session.json"), "utf8")
    );
    const [run] = session.verificationRuns;
    const fullCommand = run.command;
    const stdoutEvidence = await readFile(join(repoRoot, run.stdoutPath), "utf8");

    const status = await runStatusCommand({
      repoRoot,
      changedFiles: ["src/core/verification.ts"],
      now: new Date("2026-06-13T12:05:00.000Z")
    });

    expect(fullCommand).toContain("status command noise");
    expect(stdoutEvidence).toContain("status command noise");
    expect(status.output).toContain("Verification Evidence:");
    expect(status.output).toContain("- passed:");
    expect(status.output).toContain("status command noise");
    expect(status.output).toContain("…");
    expect(status.output).not.toContain(fullCommand);
  });

  it("compacts long verification run lists in status text without changing JSON or evidence", async () => {
    const repoRoot = await startedRepo([]);
    const session = JSON.parse(
      await readFile(join(repoRoot, ".agentflight", "current", "session.json"), "utf8")
    ) as AgentFlightSession;
    const evidenceDir = join(repoRoot, ".agentflight", "evidence", session.id);
    await mkdir(evidenceDir, { recursive: true });

    const runs: VerificationRun[] = [];
    for (let index = 1; index <= 10; index += 1) {
      const suffix = String(index).padStart(2, "0");
      const stdoutPath = `.agentflight/evidence/${session.id}/verification-${suffix}.stdout.txt`;
      const stderrPath = `.agentflight/evidence/${session.id}/verification-${suffix}.stderr.txt`;
      await writeFile(join(repoRoot, stdoutPath), `stdout for proof-run-${suffix}\n`, "utf8");
      await writeFile(join(repoRoot, stderrPath), "", "utf8");
      runs.push({
        command: `npm run proof-run-${suffix}`,
        startedAt: `2026-06-13T12:${suffix}:00.000Z`,
        finishedAt: `2026-06-13T12:${suffix}:01.000Z`,
        durationMs: 1000 + index,
        exitCode: 0,
        status: "passed",
        stdoutPath,
        stderrPath
      });
    }
    await saveSession(repoRoot, { ...session, verificationRuns: runs });

    const status = await runStatusCommand({
      repoRoot,
      changedFiles: ["src/core/status.ts"],
      now: new Date("2026-06-13T12:15:00.000Z")
    });

    expect(status.output).toContain("10 passed, 0 failed");
    expect(status.output).toContain("- Showing latest 8 of 10 verification runs.");
    expect(status.output).toContain(
      "- 2 earlier verification runs remain in report/replay and JSON output."
    );
    expect(status.output).not.toContain("proof-run-01");
    expect(status.output).not.toContain("proof-run-02");
    expect(status.output).toContain("proof-run-03");
    expect(status.output).toContain("proof-run-10");

    const jsonStatus = await runStatusCommand({
      repoRoot,
      changedFiles: ["src/core/status.ts"],
      format: "json"
    });
    const payload = JSON.parse(jsonStatus.output);
    expect(payload.verification.runs).toHaveLength(10);
    expect(payload.verification.runs[0].command).toBe("npm run proof-run-01");
    await expect(readFile(join(repoRoot, runs[0]!.stdoutPath), "utf8")).resolves.toContain(
      "stdout for proof-run-01"
    );
  });

  it("emits parseable local JSON status for scripts", async () => {
    const command = `${process.execPath} -e "console.log('proof ok')"`;
    const repoRoot = await startedRepo([command]);
    await runVerifyCommand({
      repoRoot,
      commandArgs: [process.execPath, "-e", "console.log('proof ok')"],
      now: () => new Date("2026-06-13T12:00:00.000Z")
    });

    const status = await runStatusCommand({
      repoRoot,
      changedFiles: ["docs/development/verification.md"],
      now: new Date("2026-06-13T12:05:00.000Z"),
      format: "json"
    });
    const payload = JSON.parse(status.output);

    expect(payload).toMatchObject({
      task: { title: "Capture verification" },
      session: { id: expect.stringContaining("af-") },
      changedFiles: ["docs/development/verification.md"],
      risk: { level: "low", changedFiles: 1 },
      verification: { passed: 1, failed: 0 },
      review: {
        readiness: { state: "ready_for_review", label: "Ready for review" },
        proofGaps: [],
        contract: {
          summary: {
            total: 4,
            supported: 2,
            needsReview: 2
          }
        },
        projectReviewContract: {
          enabled: true,
          requirements: [
            expect.objectContaining({
              id: "docs-manual-review",
              status: "needs_review",
              proofStatus: "not_required"
            })
          ]
        }
      }
    });
    expect(payload.review.focus[0]).toMatchObject({
      file: "docs/development/verification.md",
      proofStatus: "not_required"
    });
    expect(payload.nextAction).toContain("agentflight handoff");
    expect(status.output).not.toContain("diff --git");
  });

  it("marks stale proof in status and handoff when files changed after verification", async () => {
    const repoRoot = await startedRepo(["npm test"]);
    const changedFile = "src/auth/reset.ts";
    await mkdir(join(repoRoot, "src", "auth"), { recursive: true });
    await writeFile(join(repoRoot, changedFile), "new proof state\n", "utf8");

    const session = JSON.parse(
      await readFile(join(repoRoot, ".agentflight", "current", "session.json"), "utf8")
    ) as AgentFlightSession;
    const stdoutPath = `.agentflight/evidence/${session.id}/verification-1.stdout.txt`;
    const stderrPath = `.agentflight/evidence/${session.id}/verification-1.stderr.txt`;
    await mkdir(join(repoRoot, ".agentflight", "evidence", session.id), { recursive: true });
    await writeFile(join(repoRoot, stdoutPath), "old proof ok\n", "utf8");
    await writeFile(join(repoRoot, stderrPath), "", "utf8");
    await saveSession(repoRoot, {
      ...session,
      verificationRuns: [
        {
          command: "npm test",
          startedAt: "2026-06-13T12:00:00.000Z",
          finishedAt: "2026-06-13T12:00:05.000Z",
          durationMs: 5000,
          exitCode: 0,
          status: "passed",
          stdoutPath,
          stderrPath,
          proofSnapshot: proofSnapshot({ [changedFile]: "old" })
        }
      ]
    });

    const status = await runStatusCommand({
      repoRoot,
      changedFiles: [changedFile],
      now: new Date("2026-06-13T12:05:00.000Z")
    });

    expect(status.output).toContain("Proof: stale");
    expect(status.output).toContain("Required proof:");
    expect(status.output).toContain("stale - Sensitive auth, payment, or security review");
    expect(status.output).toContain("Review Contract:");
    expect(status.output).toContain(
      "Review path: Review 3 stale claims and 2 unsupported claims before sharing."
    );
    expect(status.output).toContain("stale - Changed file reviewed: src/auth/reset.ts");
    expect(status.output).toContain("Verification proof is stale");
    expect(status.output).toContain("Readiness: Needs verification");
    expect(status.output).toContain("agentflight verify -- npm test");

    const jsonStatus = await runStatusCommand({
      repoRoot,
      changedFiles: [changedFile],
      format: "json"
    });
    const payload = JSON.parse(jsonStatus.output);
    expect(payload.review.focus[0]).toMatchObject({
      file: changedFile,
      proofStatus: "stale"
    });
    expect(payload.review.proofGaps[0]).toMatchObject({
      id: "stale-verification-proof",
      relatedFiles: [changedFile]
    });

    const snapshot = await runSnapshotCommand({
      repoRoot,
      git: {
        branch: "main",
        commit: "abc123",
        dirty: true,
        changedFiles: [changedFile]
      },
      now: new Date("2026-06-13T12:05:30.000Z")
    });
    expect(snapshot.event.metadata?.review).toMatchObject({
      readiness: "needs_verification",
      proofGapCount: 1
    });

    const handoff = await runHandoffCommand({
      repoRoot,
      changedFiles: [changedFile],
      now: new Date("2026-06-13T12:05:00.000Z")
    });
    expect(handoff.exitCode).toBe(1);
    expect(handoff.output).toContain("Proof: stale");
    expect(handoff.output).toContain("Review contract:");
    expect(handoff.output).toContain(
      "Review path: Review 3 stale claims and 2 unsupported claims before sharing."
    );
    expect(handoff.output).toContain("stale - Changed file reviewed: src/auth/reset.ts");
    expect(handoff.output).toContain("Verification proof is stale");
    expect(handoff.output).toContain("Fix before sharing:");
    await expect(readFile(handoff.reportPath, "utf8")).resolves.toContain("- Proof: stale");
    await expect(readFile(handoff.replayPath, "utf8")).resolves.toContain("Proof:</span> stale");
    await expect(readFile(handoff.sessionResumePath, "utf8")).resolves.toContain("- Proof: stale");

    const history = await runHistoryCommand({ repoRoot, limit: 1 });
    expect(history.output).toContain("Recorded readiness: Needs verification");
  });

  it("rejects unsupported status formats", async () => {
    const repoRoot = await startedRepo([]);

    await expect(
      runStatusCommand({
        repoRoot,
        changedFiles: ["README.md"],
        format: "yaml"
      })
    ).rejects.toThrow("Unsupported status format");
  });

  it("fails honestly when changed-file detection is unavailable", async () => {
    const repoRoot = await startedRepo([]);

    await expect(runStatusCommand({ repoRoot })).rejects.toThrow(
      "Unable to inspect changed files with git status"
    );

    const status = await runStatusCommand({ repoRoot, changedFiles: [] });
    expect(status.output).toContain("Changed files:\n0");
  });

  it("shows clean worktree readiness in status text and JSON", async () => {
    const command = `${process.execPath} -e "console.log('proof ok')"`;
    const repoRoot = await startedRepo([command]);
    await runVerifyCommand({
      repoRoot,
      commandArgs: [process.execPath, "-e", "console.log('proof ok')"],
      now: () => new Date("2026-06-13T12:00:00.000Z")
    });
    const handoff = await runHandoffCommand({
      repoRoot,
      changedFiles: ["docs/development/verification.md"],
      now: new Date("2026-06-13T12:04:00.000Z")
    });
    const handoffPath = `.agentflight/reports/${basename(handoff.sessionHandoffPath)}`;

    const status = await runStatusCommand({
      repoRoot,
      changedFiles: [],
      now: new Date("2026-06-13T12:05:00.000Z")
    });

    expect(status.output).toContain("Changed files:\n0");
    expect(status.output).toContain("Risk: none");
    expect(status.output).not.toContain("No changed files detected yet.");
    expect(status.output).toContain("Verification Evidence:\n1 passed, 0 failed");
    expect(status.output).toContain(
      "- Verification run details are tucked because the worktree is clean; open handoff/report/replay or JSON output for the full ledger."
    );
    expect(status.output).not.toContain("- passed:");
    expect(status.output).not.toContain("proof ok");
    expect(status.output).toContain("Readiness: Clean worktree");
    expect(status.output).toContain("Reason: No changed files are currently detected.");
    expect(status.output).toContain(`Open first: handoff ${handoffPath}`);
    expect(status.output).not.toContain(handoff.sessionHandoffPath);
    expect(status.output).toContain("Next action:\nOpen first: handoff .agentflight/reports/");
    expect(status.output).toContain(
      "Start a new AgentFlight session when you begin the next task."
    );

    const resume = await runResumeCommand({
      repoRoot,
      changedFiles: [],
      now: new Date("2026-06-13T12:06:00.000Z")
    });
    expect(resume.output).toContain(`- Open first: handoff ${handoffPath}`);
    expect(resume.output).toContain(`## Next Recommended Action
Open first: handoff ${handoffPath}
Start a new AgentFlight session when you begin the next task.`);
    expect(resume.output).not.toContain(handoff.sessionHandoffPath);
    expect(resume.output).toContain("Start a new AgentFlight session before unrelated work.");
    expect(resume.output).not.toContain("- Do not start unrelated work.");

    const jsonStatus = await runStatusCommand({
      repoRoot,
      changedFiles: [],
      now: new Date("2026-06-13T12:05:00.000Z"),
      format: "json"
    });
    const payload = JSON.parse(jsonStatus.output);

    expect(payload.risk).toMatchObject({
      level: "none",
      changedFiles: 0,
      reasons: ["No changed files are currently detected."]
    });
    expect(payload.review.readiness).toMatchObject({
      state: "clean_worktree",
      label: "Clean worktree"
    });
    expect(payload.verification.runs).toHaveLength(1);
    expect(payload.verification.runs[0].command).toContain("proof ok");
    expect(payload.nextAction).toBe(
      "Start a new AgentFlight session when you begin the next task."
    );
  });

  it("preserves artifact events when report replay and resume run concurrently", async () => {
    const repoRoot = await startedRepo(["npm test"]);

    const [report, replay, resume] = await Promise.all([
      runReportCommand({
        repoRoot,
        changedFiles: [],
        now: new Date("2026-06-13T12:05:00.000Z")
      }),
      runReplayCommand({
        repoRoot,
        changedFiles: [],
        now: new Date("2026-06-13T12:06:00.000Z")
      }),
      runResumeCommand({
        repoRoot,
        changedFiles: [],
        now: new Date("2026-06-13T12:07:00.000Z")
      })
    ]);

    expect(report.reportPath).toContain(".agentflight/reports/");
    expect(replay.replayPath).toContain(".agentflight/reports/");
    expect(resume.sessionResumePath).toContain(".agentflight/reports/");

    const session = JSON.parse(
      await readFile(join(repoRoot, ".agentflight", "current", "session.json"), "utf8")
    ) as AgentFlightSession;
    const artifactEvents = (session.events ?? [])
      .filter((event) =>
        ["report_generated", "replay_generated", "resume_generated"].includes(event.type)
      )
      .map((event) => event.type)
      .sort();

    expect(artifactEvents).toEqual(["replay_generated", "report_generated", "resume_generated"]);
  });

  it("keeps unresolved failed verification details visible in clean status", async () => {
    const repoRoot = await startedRepo([`${process.execPath} -e "process.exit(4)"`]);
    await runVerifyCommand({
      repoRoot,
      commandArgs: [process.execPath, "-e", "process.exit(4)"],
      now: () => new Date("2026-06-13T12:00:00.000Z")
    });

    const status = await runStatusCommand({
      repoRoot,
      changedFiles: [],
      now: new Date("2026-06-13T12:05:00.000Z")
    });

    expect(status.output).toContain("Readiness: Blocked by failed verification");
    expect(status.output).toContain("- failed:");
    expect(status.output).toContain("process.exit(4)");
    expect(status.output).not.toContain("Verification run details are tucked");

    const resume = await runResumeCommand({
      repoRoot,
      changedFiles: [],
      now: new Date("2026-06-13T12:06:00.000Z")
    });
    expect(resume.output).toContain("Unresolved failed runs: 1.");
  });

  it("does not call status clean while verification is incomplete", async () => {
    const repoRoot = await startedRepo(["npm test"]);
    const session = JSON.parse(
      await readFile(join(repoRoot, ".agentflight", "current", "session.json"), "utf8")
    ) as AgentFlightSession;
    await saveSession(repoRoot, {
      ...session,
      events: [
        ...(session.events ?? []),
        {
          id: "evt-20260613-120000-verification-started-999",
          type: "verification_started",
          timestamp: "2026-06-13T12:00:00.000Z",
          title: "Verification started",
          metadata: { command: "npm test" }
        }
      ]
    });

    const status = await runStatusCommand({
      repoRoot,
      changedFiles: [],
      now: new Date("2026-06-13T12:05:00.000Z")
    });

    expect(status.output).toContain("Changed files:\n0");
    expect(status.output).toContain("Readiness: Needs verification");
    expect(status.output).toContain(
      "Verification is still running or did not record a completed result: npm test"
    );
    expect(status.output).toContain(
      "Wait for the command to finish; if no result appears, rerun agentflight verify -- npm test"
    );
    expect(status.output).toContain("agentflight verify -- npm test");
    expect(status.output).not.toContain("Readiness: Clean worktree");
  });

  it("shows the latest snapshot in status", async () => {
    const repoRoot = await startedRepo([]);
    await runSnapshotCommand({
      repoRoot,
      note: "Initial implementation completed",
      now: new Date("2026-06-13T12:00:00.000Z"),
      git: {
        branch: "main",
        commit: "abc123",
        dirty: true,
        changedFiles: ["docs/development/verification.md"]
      }
    });

    const status = await runStatusCommand({
      repoRoot,
      changedFiles: ["docs/development/verification.md"],
      now: new Date("2026-06-13T12:05:00.000Z")
    });

    expect(status.output).toContain("Latest snapshot:");
    expect(status.output).toContain("Initial implementation completed");
    expect(status.output).toContain("Risk: low");
  });

  it("marks failed verification as blocked in status", async () => {
    const repoRoot = await startedRepo([`${process.execPath} -e "process.exit(4)"`]);
    await runVerifyCommand({
      repoRoot,
      commandArgs: [process.execPath, "-e", "process.exit(4)"],
      now: () => new Date("2026-06-13T12:00:00.000Z")
    });

    const status = await runStatusCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"],
      now: new Date("2026-06-13T12:05:00.000Z")
    });

    expect(status.output).toContain("1 failed");
    expect(status.output).toContain("Readiness: Blocked by failed verification");
    expect(status.output).toContain("A verification command failed");
    expect(status.output).toContain("Fix the failed command, then rerun agentflight verify --");
  });

  it("includes verification evidence and recommendation in report and replay", async () => {
    const command = `${process.execPath} -e "console.log('proof ok')"`;
    const repoRoot = await startedRepo([command]);
    await runVerifyCommand({
      repoRoot,
      commandArgs: [process.execPath, "-e", "console.log('proof ok')"],
      now: () => new Date("2026-06-13T12:00:00.000Z")
    });
    await runSnapshotCommand({
      repoRoot,
      note: "Ready for report",
      now: new Date("2026-06-13T12:02:00.000Z"),
      git: {
        branch: "main",
        commit: "abc123",
        dirty: true,
        changedFiles: ["src/auth/reset.ts"]
      }
    });

    const report = await runReportCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"]
    });
    const markdown = await readFile(report.reportPath, "utf8");
    expect(markdown).toContain("Needs verification");
    expect(markdown).toContain(command);
    expect(markdown).toContain(".agentflight/evidence/");
    expect(markdown).toContain("## Timeline");
    expect(markdown).toContain("## Review First");
    expect(markdown).toContain("## Review Contract");
    expect(markdown).toContain("Changed file reviewed: src/auth/reset.ts");
    expect(markdown).toContain("## Proof Gaps");
    expect(markdown).toContain("## Review Readiness");
    expect(markdown).toContain("Session started");
    expect(markdown).toContain("Snapshot created");
    expect(markdown).toContain("Ready for report");
    expect(markdown).toContain("Verification passed");
    expect(markdown).toContain("Report generated");
    expect(markdown).toContain("1. src/auth/reset.ts");
    expect(markdown).toContain("identity/session path");
    expect(markdown).toContain("Sensitive auth, payment, or security files changed");
    expect(markdown).not.toContain("Generate a report and");

    const replay = await runReplayCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"]
    });
    const html = await readFile(replay.replayPath, "utf8");
    expect(html).toContain("summary-grid");
    expect(html).toContain("timeline");
    expect(html).toContain("Ready for report");
    expect(html).toContain("Changed File Groups");
    expect(html).toContain("1 passed / 0 failed");
    expect(html).toContain("Needs verification");
    expect(html).toContain("Review Focus");
    expect(html).toContain("Review Contract");
    expect(html).toContain("Changed file reviewed: src/auth/reset.ts");
    expect(html).toContain("Proof Gaps");
    expect(html).toContain("Evidence files");
    expect(html).toContain("passed");
    expect(html).toContain("Generated by AgentFlight");
    expect(html).not.toContain("Generate a report and");
    expect(html).not.toMatch(/https?:\/\//);
  });

  it("stores compact review readiness metadata for report and replay artifacts", async () => {
    const repoRoot = await startedRepo(["npm test"]);
    await runVerifyCommand({
      repoRoot,
      commandArgs: [process.execPath, "-e", "console.log('proof ok')"],
      now: () => new Date("2026-06-13T12:00:00.000Z")
    });

    const report = await runReportCommand({
      repoRoot,
      changedFiles: ["docs/development/verification.md"],
      now: new Date("2026-06-13T12:05:00.000Z")
    });
    const afterReport = JSON.parse(
      await readFile(join(repoRoot, ".agentflight", "current", "session.json"), "utf8")
    );
    const reportEvent = afterReport.events.find(
      (event: { type: string }) => event.type === "report_generated"
    );
    expect(reportEvent.metadata).toMatchObject({
      path: `.agentflight/reports/${afterReport.id}-proof.md`,
      readiness: {
        state: "ready_for_review",
        label: "Ready for review",
        riskLevel: "low",
        changedFiles: 1,
        verificationPassed: 1,
        verificationFailed: 0
      }
    });
    expect(report.reportPath).toContain(`${afterReport.id}-proof.md`);

    const replay = await runReplayCommand({
      repoRoot,
      changedFiles: ["docs/development/verification.md"],
      now: new Date("2026-06-13T12:06:00.000Z")
    });
    const afterReplay = JSON.parse(
      await readFile(join(repoRoot, ".agentflight", "current", "session.json"), "utf8")
    );
    const replayEvent = afterReplay.events.find(
      (event: { type: string }) => event.type === "replay_generated"
    );
    expect(replayEvent.metadata).toMatchObject({
      path: `.agentflight/reports/${afterReplay.id}-replay.html`,
      readiness: {
        state: "ready_for_review",
        label: "Ready for review",
        riskLevel: "low",
        changedFiles: 1,
        verificationPassed: 1,
        verificationFailed: 0
      }
    });
    expect(replay.replayPath).toContain(`${afterReplay.id}-replay.html`);
  });

  it("writes a compact Markdown report without changing the full report default", async () => {
    const repoRoot = await startedRepo(["npm test"]);
    await runVerifyCommand({
      repoRoot,
      commandArgs: [
        process.execPath,
        "-e",
        "console.error('compact failure excerpt'); process.exit(1)"
      ],
      now: () => new Date("2026-06-13T12:00:00.000Z")
    });

    const compact = await runReportCommand({
      repoRoot,
      changedFiles: ["src/api/users.ts"],
      mode: "compact"
    });
    const compactMarkdown = await readFile(compact.reportPath, "utf8");
    expect(compact.reportPath).toContain("-proof-compact.md");
    expect(compactMarkdown).toContain("# AgentFlight Compact Report");
    expect(compactMarkdown).toContain("compact failure excerpt");
    expect(compactMarkdown).toContain(".agentflight/evidence/");
    expect(compactMarkdown).not.toContain("## Timeline");

    const full = await runReportCommand({
      repoRoot,
      changedFiles: ["src/api/users.ts"]
    });
    const fullMarkdown = await readFile(full.reportPath, "utf8");
    expect(full.reportPath).toContain("-proof.md");
    expect(full.reportPath).not.toContain("-compact");
    expect(fullMarkdown).toContain("# AgentFlight Proof Report");
    expect(fullMarkdown).toContain("## Timeline");
  });

  it("rejects invalid report modes before writing a report", async () => {
    const repoRoot = await startedRepo([]);

    await expect(
      runReportCommand({
        repoRoot,
        changedFiles: ["README.md"],
        mode: "pdf"
      })
    ).rejects.toThrow("Unsupported report mode");

    await expect(readdir(join(repoRoot, ".agentflight", "reports"))).resolves.toEqual([]);
  });

  it("writes a local PR comment draft report mode without posting anywhere", async () => {
    const repoRoot = await startedRepo(["npm test"]);
    await runVerifyCommand({
      repoRoot,
      commandArgs: [process.execPath, "-e", "console.log('pr comment proof')"],
      now: () => new Date("2026-06-13T12:00:00.000Z")
    });

    const report = await runReportCommand({
      repoRoot,
      changedFiles: ["src/api/users.ts"],
      mode: "pr-comment"
    });
    const markdown = await readFile(report.reportPath, "utf8");

    expect(report.reportPath).toContain("-pr-comment.md");
    expect(markdown).toContain("## AgentFlight Review Summary");
    expect(markdown).toContain("Generated locally by AgentFlight. Not posted automatically.");
    expect(markdown).toContain("Readiness:");
    expect(markdown).toContain("Review first");
    expect(markdown).toContain("Proof gaps:");
    expect(markdown).toContain("npm test");
    expect(markdown).toContain(".agentflight/evidence/");
    expect(markdown).not.toContain("## Timeline");
    expect(markdown).not.toContain("## Tooling");
  });

  it("uses stderr-preferred failed excerpts in local PR comment drafts", async () => {
    const repoRoot = await startedRepo(["npm test"]);
    const scriptPath = join(repoRoot, "failing-pr-draft.js");
    await writeFile(
      scriptPath,
      "console.log('stdout noise for pr draft'); console.error('stderr pr failure excerpt'); process.exit(1);"
    );
    await runVerifyCommand({
      repoRoot,
      commandArgs: [process.execPath, scriptPath],
      now: () => new Date("2026-06-13T12:00:00.000Z")
    });

    const report = await runReportCommand({
      repoRoot,
      changedFiles: ["src/api/users.ts"],
      mode: "pr-comment"
    });
    const markdown = await readFile(report.reportPath, "utf8");
    const session = JSON.parse(
      await readFile(join(repoRoot, ".agentflight", "current", "session.json"), "utf8")
    );
    const [run] = session.verificationRuns;
    const stdoutEvidence = await readFile(join(repoRoot, run.stdoutPath), "utf8");
    const stderrEvidence = await readFile(join(repoRoot, run.stderrPath), "utf8");

    expect(markdown).toContain("stderr pr failure excerpt");
    expect(markdown).not.toContain("stdout noise for pr draft");
    expect(stdoutEvidence).toContain("stdout noise for pr draft");
    expect(stderrEvidence).toContain("stderr pr failure excerpt");
  });

  it("uses handoff-focused next actions in resume when proof is complete", async () => {
    const command = `${process.execPath} -e "console.log('proof ok')"`;
    const repoRoot = await startedRepo([command]);
    await runVerifyCommand({
      repoRoot,
      commandArgs: [process.execPath, "-e", "console.log('proof ok')"],
      now: () => new Date("2026-06-13T12:00:00.000Z")
    });
    await runSnapshotCommand({
      repoRoot,
      note: "Ready to hand off",
      now: new Date("2026-06-13T12:02:00.000Z"),
      git: {
        branch: "main",
        commit: "abc123",
        dirty: true,
        changedFiles: ["docs/development/verification.md"]
      }
    });

    const resume = await runResumeCommand({
      repoRoot,
      changedFiles: ["docs/development/verification.md"]
    });
    const session = JSON.parse(
      await readFile(join(repoRoot, ".agentflight", "current", "session.json"), "utf8")
    );
    const sessionResumePath = join(repoRoot, ".agentflight", "reports", `${session.id}-resume.md`);

    expect(resume.sessionResumePath).toBe(sessionResumePath);
    await expect(readFile(resume.resumePath, "utf8")).resolves.toContain(
      "Continue this AgentFlight-recorded coding session safely."
    );
    await expect(readFile(resume.sessionResumePath, "utf8")).resolves.toContain(
      "Continue this AgentFlight-recorded coding session safely."
    );
    expect(resume.output).toContain("Latest Snapshot");
    expect(resume.output).toContain("Ready to hand off");
    expect(resume.output).toContain("Verification State");
    expect(resume.output).toContain("1 passed, 0 failed");
    expect(resume.output).toContain("Review Focus");
    expect(resume.output).toContain("Review Contract");
    expect(resume.output).toContain("Changed file reviewed: docs/development/verification.md");
    expect(resume.output).toContain("Run agentflight handoff to generate the local review packet");
    expect(resume.output).not.toContain("Generate a report and");
    expect(resume.output).not.toContain("Use the generated report or replay");
  });

  it("points ready resume prompts at an existing handoff artifact", async () => {
    const command = `${process.execPath} -e "console.log('proof ok')"`;
    const repoRoot = await startedRepo([command]);
    const changedFiles = ["docs/development/verification.md"];
    await runVerifyCommand({
      repoRoot,
      commandArgs: [process.execPath, "-e", "console.log('proof ok')"],
      now: () => new Date("2026-06-13T12:00:00.000Z")
    });
    const handoff = await runHandoffCommand({
      repoRoot,
      changedFiles,
      now: new Date("2026-06-13T12:05:00.000Z")
    });
    const handoffPath = `.agentflight/reports/${basename(handoff.sessionHandoffPath)}`;

    const resume = await runResumeCommand({
      repoRoot,
      changedFiles,
      now: new Date("2026-06-13T12:06:00.000Z")
    });

    expect(resume.output).toContain(`- Open first: handoff ${handoffPath}`);
    expect(resume.output).toContain(`## Next Recommended Action
Open first: handoff ${handoffPath}`);
    expect(resume.output).not.toContain(
      "Run agentflight handoff to generate the local review packet."
    );
    expect(resume.output).not.toContain(handoff.sessionHandoffPath);
  });

  it("points ready status output at an existing handoff artifact", async () => {
    const command = `${process.execPath} -e "console.log('proof ok')"`;
    const repoRoot = await startedRepo([command]);
    const changedFiles = ["docs/development/verification.md"];
    await runVerifyCommand({
      repoRoot,
      commandArgs: [process.execPath, "-e", "console.log('proof ok')"],
      now: () => new Date("2026-06-13T12:00:00.000Z")
    });
    const handoff = await runHandoffCommand({
      repoRoot,
      changedFiles,
      now: new Date("2026-06-13T12:05:00.000Z")
    });
    const handoffPath = `.agentflight/reports/${basename(handoff.sessionHandoffPath)}`;

    const status = await runStatusCommand({
      repoRoot,
      changedFiles,
      now: new Date("2026-06-13T12:06:00.000Z")
    });

    expect(status.output).toContain(`Next action:\nOpen first: handoff ${handoffPath}`);
    expect(status.output).not.toContain(
      "Run agentflight handoff to generate the local review packet."
    );
    expect(status.output).not.toContain(handoff.sessionHandoffPath);
  });

  it("points ready report and replay recommendations to the handoff packet", async () => {
    const command = `${process.execPath} -e "console.log('proof ok')"`;
    const repoRoot = await startedRepo([command]);
    await runVerifyCommand({
      repoRoot,
      commandArgs: [process.execPath, "-e", "console.log('proof ok')"],
      now: () => new Date("2026-06-13T12:00:00.000Z")
    });

    const report = await runReportCommand({
      repoRoot,
      changedFiles: ["docs/development/verification.md"]
    });
    const markdown = await readFile(report.reportPath, "utf8");

    expect(markdown).toContain("Ready for review");
    expect(markdown).toContain("Run agentflight handoff to generate the local review packet");
    expect(markdown).not.toContain("Share this report with the reviewer");

    const replay = await runReplayCommand({
      repoRoot,
      changedFiles: ["docs/development/verification.md"]
    });
    const html = await readFile(replay.replayPath, "utf8");

    expect(html).toContain("Ready for review");
    expect(html).toContain("Run agentflight handoff to generate the local review packet");
    expect(html).not.toContain("Use this replay for review and handoff");
  });

  it("generates a local review handoff when proof is complete", async () => {
    const command = `${process.execPath} -e "console.log('proof ok')"`;
    const repoRoot = await startedRepo([command]);
    await runVerifyCommand({
      repoRoot,
      commandArgs: [process.execPath, "-e", "console.log('proof ok')"],
      now: () => new Date("2026-06-13T12:00:00.000Z")
    });

    const handoff = await runHandoffCommand({
      repoRoot,
      changedFiles: ["docs/development/verification.md"],
      now: new Date("2026-06-13T12:05:00.000Z")
    });

    expect(handoff.exitCode).toBe(0);
    expect(handoff.reportPath).toContain("-proof.md");
    expect(handoff.replayPath).toContain("-replay.html");
    expect(handoff.resumePath).toContain(".agentflight/current/resume-prompt.md");
    expect(handoff.sessionHandoffPath).toContain("-handoff.md");
    expect(handoff.sessionResumePath).toContain("-resume.md");
    await expect(readFile(handoff.handoffPath, "utf8")).resolves.toContain("AgentFlight handoff");
    await expect(readFile(handoff.sessionHandoffPath, "utf8")).resolves.toContain(
      "AgentFlight handoff"
    );
    expect(handoff.output).toContain("AgentFlight handoff");
    expect(handoff.output).toContain("Decision:");
    expect(handoff.output).toContain(
      "Ready for review; manual checks remain before trusting the change."
    );
    expect(handoff.output).toContain("Why:");
    expect(handoff.output).toContain("- 1 manual-review requirement remains.");
    expect(handoff.output).toContain("- No failed, stale, or missing required proof.");
    expect(handoff.output).toContain("Readiness: Ready for review");
    expect(handoff.output).toContain("Open first: handoff");
    expect(handoff.output).toContain("Open first: handoff .agentflight/reports/");
    expect(handoff.output).toContain("-handoff.md");
    expect(handoff.output).toContain(
      "Share the local handoff packet for scoped review; use report/replay for details."
    );
    expect(handoff.output).not.toContain("Share this handoff with the report/replay");
    expect(handoff.output).toContain("No failed verification excerpts recorded.");
    expect(handoff.output).not.toContain("Run agentflight handoff");
    expect(handoff.output).toContain("Review first:");
    expect(handoff.output).toContain("Review contract:");
    expect(handoff.output).toContain("Session task: Capture verification");
    expect(handoff.output).toContain("docs/development/verification.md");
    expect(handoff.output).toContain("Artifacts:");
    expect(handoff.output).toContain("Report:");
    expect(handoff.output).toContain("Replay:");
    expect(handoff.output).toContain("Resume:");
    expect(handoff.output).toContain("- Handoff: .agentflight/reports/");
    expect(handoff.output).toContain("- Current handoff: .agentflight/current/handoff.md");
    expect(handoff.output).toContain("- Resume: .agentflight/reports/");
    expect(handoff.output).toContain("- Current resume: .agentflight/current/resume-prompt.md");
    expect(handoff.output).toContain(".agentflight/current/handoff.md");
    expect(handoff.output).toContain(".agentflight/reports/");
    expect(handoff.output).not.toContain(repoRoot);
    expect(handoff.output).toContain(
      "Local only: no upload, no telemetry, no automatic PR comment."
    );
  });

  it("exits successfully for clean-worktree local handoffs", async () => {
    const repoRoot = await startedRepo([]);

    const handoff = await runHandoffCommand({
      repoRoot,
      changedFiles: [],
      now: new Date("2026-06-13T12:05:00.000Z")
    });

    expect(handoff.exitCode).toBe(0);
    expect(handoff.output).toContain("Readiness: Clean worktree");
    expect(handoff.output).toContain(
      "Start a new AgentFlight session when you begin the next task."
    );
    expect(handoff.output).not.toContain("Fix before sharing:");
  });

  it("preserves existing review artifacts when clean-worktree handoff runs later", async () => {
    const command = `${process.execPath} -e "console.log('proof ok')"`;
    const repoRoot = await startedRepo([command]);
    await runVerifyCommand({
      repoRoot,
      commandArgs: [process.execPath, "-e", "console.log('proof ok')"],
      now: () => new Date("2026-06-13T12:00:00.000Z")
    });

    const readyHandoff = await runHandoffCommand({
      repoRoot,
      changedFiles: ["src/commands/handoff.ts"],
      now: new Date("2026-06-13T12:05:00.000Z")
    });
    const originalReport = await readFile(readyHandoff.reportPath, "utf8");
    const originalReplay = await readFile(readyHandoff.replayPath, "utf8");
    const originalResume = await readFile(readyHandoff.sessionResumePath, "utf8");
    const originalSessionHandoff = await readFile(readyHandoff.sessionHandoffPath, "utf8");

    const cleanHandoff = await runHandoffCommand({
      repoRoot,
      changedFiles: [],
      now: new Date("2026-06-13T12:10:00.000Z")
    });

    expect(cleanHandoff.exitCode).toBe(0);
    await expect(readFile(readyHandoff.reportPath, "utf8")).resolves.toBe(originalReport);
    await expect(readFile(readyHandoff.replayPath, "utf8")).resolves.toBe(originalReplay);
    await expect(readFile(readyHandoff.sessionResumePath, "utf8")).resolves.toBe(originalResume);
    await expect(readFile(readyHandoff.sessionHandoffPath, "utf8")).resolves.toBe(
      originalSessionHandoff
    );
    await expect(readFile(cleanHandoff.handoffPath, "utf8")).resolves.toContain(
      "Readiness: Clean worktree"
    );
  });

  it("blocks local handoffs when required proof is missing", async () => {
    const repoRoot = await startedRepo(["npm test"]);

    const handoff = await runHandoffCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"],
      now: new Date("2026-06-13T12:05:00.000Z")
    });

    expect(handoff.exitCode).toBe(1);
    expect(handoff.output).toContain("Readiness: Needs verification");
    expect(handoff.output).toContain("No verification runs recorded.");
    expect(handoff.output).not.toContain("No failed verification excerpts recorded.");
    expect(handoff.output).toContain("Fix before sharing:");
    expect(handoff.output).toContain("agentflight verify -- npm test");
    expect(handoff.output).toContain("Open first: report");
    expect(handoff.output).toContain("Open first: report .agentflight/reports/");
    expect(handoff.output).toContain("-proof.md");
    expect(handoff.output).not.toContain("Share this handoff with the report/replay");
    expect(handoff.output).not.toContain("Share the local handoff packet for scoped review");
  });

  it("suggests test proof first when source and test files both need proof", async () => {
    const repoRoot = await startedRepo(["npm run typecheck", "npm test", "npm run build"]);

    const handoff = await runHandoffCommand({
      repoRoot,
      changedFiles: ["src/core/output.ts", "tests/core/output.test.ts"],
      now: new Date("2026-06-13T12:05:00.000Z")
    });

    expect(handoff.exitCode).toBe(1);
    expect(handoff.output).toContain("Readiness: Needs verification");
    expect(handoff.output).toContain("Run agentflight verify -- npm test");
    expect(handoff.output).not.toContain("Run agentflight verify -- npm run typecheck");
  });

  it("shows stderr-preferred failure excerpts in blocked local handoffs", async () => {
    const repoRoot = await startedRepo(["npm test"]);
    const scriptPath = join(repoRoot, "failing-handoff.js");
    await writeFile(
      scriptPath,
      "console.log('stdout noise for handoff'); console.error('stderr handoff failure excerpt'); process.exit(1);"
    );
    await runVerifyCommand({
      repoRoot,
      commandArgs: [process.execPath, scriptPath],
      now: () => new Date("2026-06-13T12:00:00.000Z")
    });

    const handoff = await runHandoffCommand({
      repoRoot,
      changedFiles: ["src/api/users.ts"],
      now: new Date("2026-06-13T12:05:00.000Z")
    });
    const session = JSON.parse(
      await readFile(join(repoRoot, ".agentflight", "current", "session.json"), "utf8")
    );
    const [run] = session.verificationRuns;
    const stdoutEvidence = await readFile(join(repoRoot, run.stdoutPath), "utf8");
    const stderrEvidence = await readFile(join(repoRoot, run.stderrPath), "utf8");

    expect(handoff.exitCode).toBe(1);
    expect(handoff.output).toContain("Readiness: Blocked by failed verification");
    expect(handoff.output).toContain("Failed verification excerpt:");
    expect(handoff.output).toContain("stderr handoff failure excerpt");
    expect(handoff.output).not.toContain("stdout noise for handoff");
    expect(handoff.output).toContain("Fix before sharing:");
    expect(handoff.output).toContain("Open first: report");
    expect(stdoutEvidence).toContain("stdout noise for handoff");
    expect(stderrEvidence).toContain("stderr handoff failure excerpt");
  });

  it("keeps resolved failed verification excerpts out of ready local handoffs", async () => {
    const repoRoot = await startedRepo([]);
    const scriptPath = join(repoRoot, "eventual-pass.js");
    await writeFile(
      scriptPath,
      "console.error('historical failure excerpt'); process.exit(1);",
      "utf8"
    );
    await runVerifyCommand({
      repoRoot,
      commandArgs: [process.execPath, scriptPath],
      now: () => new Date("2026-06-13T12:00:00.000Z")
    });
    await writeFile(scriptPath, "console.log('fixed proof');", "utf8");
    await runVerifyCommand({
      repoRoot,
      commandArgs: [process.execPath, scriptPath],
      now: () => new Date("2026-06-13T12:03:00.000Z")
    });

    const status = await runStatusCommand({
      repoRoot,
      changedFiles: ["docs/development/verification.md"],
      now: new Date("2026-06-13T12:04:00.000Z")
    });
    expect(status.output).toContain("1 passed, 1 failed (0 unresolved, 1 resolved)");
    expect(status.output).toContain("Historical failed runs: 1 resolved by later passing runs.");

    const report = await runReportCommand({
      repoRoot,
      changedFiles: ["docs/development/verification.md"],
      now: new Date("2026-06-13T12:04:30.000Z")
    });
    const markdown = await readFile(report.reportPath, "utf8");
    expect(markdown).toContain("1 passed, 1 failed (0 unresolved, 1 resolved)");
    expect(markdown).toContain("Historical failed runs: 1 resolved by later passing runs.");
    expect(markdown).toContain("historical failure excerpt");

    const replay = await runReplayCommand({
      repoRoot,
      changedFiles: ["docs/development/verification.md"],
      now: new Date("2026-06-13T12:04:45.000Z")
    });
    const html = await readFile(replay.replayPath, "utf8");
    expect(html).toContain("1 passed / 0 unresolved failed / 1 historical failed");
    expect(html).toContain("historical failure excerpt");

    const resume = await runResumeCommand({
      repoRoot,
      changedFiles: ["docs/development/verification.md"],
      now: new Date("2026-06-13T12:04:50.000Z")
    });
    expect(resume.output).toContain("1 passed, 1 failed (0 unresolved, 1 resolved)");
    expect(resume.output).toContain("Historical failed runs: 1 resolved by later passing runs.");
    expect(resume.output).not.toContain("## Verification State\n1 passed, 1 failed\n");

    const handoff = await runHandoffCommand({
      repoRoot,
      changedFiles: ["docs/development/verification.md"],
      now: new Date("2026-06-13T12:05:00.000Z")
    });

    expect(handoff.exitCode).toBe(0);
    expect(handoff.output).toContain("Readiness: Ready for review");
    expect(handoff.output).toContain("1 passed, 1 failed (0 unresolved, 1 resolved)");
    expect(handoff.output).toContain(
      "Historical failed verification excerpts remain in report/replay; no unresolved failed verification remains."
    );
    expect(handoff.output).not.toContain("historical failure excerpt");
  });

  it("includes verification gaps and the exact next command in resume prompts", async () => {
    const repoRoot = await startedRepo(["npm test"]);

    const resume = await runResumeCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"]
    });

    expect(resume.output).toContain("Proof Gaps");
    expect(resume.output).toContain("Review Focus");
    expect(resume.output).toContain("npm test");
    expect(resume.output).toContain("Stay scoped to the current task.");
    expect(resume.output).toContain("Do not start unrelated work.");
    expect(resume.output).toContain("Do not claim completion without proof.");
    expect(resume.output).toContain("Run relevant verification before declaring success.");
  });

  it("excludes AgentFlight runtime artifacts from status, report, replay, and resume changed files", async () => {
    const repoRoot = await startedRepo([]);
    const changedFiles = [
      ".agentflight/current/session.json",
      ".agentflight/evidence/af-test/verification-1.stdout.txt",
      ".agentflight/reports/af-test-proof.md",
      ".agentflight/sessions/af-test.json",
      ".agentflight/config.json",
      "src/auth/reset.ts"
    ];

    const status = await runStatusCommand({
      repoRoot,
      changedFiles
    });
    expect(status.output).toContain("Changed files:\n2");
    expect(status.output).toContain(".agentflight/config.json");
    expect(status.output).toContain("src/auth/reset.ts");
    expect(status.output).not.toContain(".agentflight/current/session.json");
    expect(status.output).not.toContain(".agentflight/evidence/");
    expect(status.output).not.toContain(".agentflight/reports/");
    expect(status.output).not.toContain(".agentflight/sessions/");

    const report = await runReportCommand({
      repoRoot,
      changedFiles
    });
    const markdown = await readFile(report.reportPath, "utf8");
    expect(markdown).toContain(".agentflight/config.json");
    expect(markdown).toContain("src/auth/reset.ts");
    expect(markdown).not.toContain(".agentflight/current/session.json");
    expect(markdown).not.toContain(".agentflight/evidence/");
    expect(markdown).not.toContain(".agentflight/reports/");
    expect(markdown).not.toContain(".agentflight/sessions/");

    const replay = await runReplayCommand({
      repoRoot,
      changedFiles
    });
    const html = await readFile(replay.replayPath, "utf8");
    expect(html).toContain(".agentflight/config.json");
    expect(html).toContain("src/auth/reset.ts");
    expect(html).not.toContain(".agentflight/current/session.json");
    expect(html).not.toContain(".agentflight/evidence/");
    expect(html).not.toContain(".agentflight/reports/");
    expect(html).not.toContain(".agentflight/sessions/");

    const resume = await runResumeCommand({
      repoRoot,
      changedFiles
    });
    expect(resume.output).toContain(".agentflight/config.json");
    expect(resume.output).toContain("src/auth/reset.ts");
    expect(resume.output).not.toContain(".agentflight/current/session.json");
    expect(resume.output).not.toContain(".agentflight/evidence/");
    expect(resume.output).not.toContain(".agentflight/reports/");
    expect(resume.output).not.toContain(".agentflight/sessions/");
  });

  it("excludes AgentLoopKit evidence while keeping reviewable AgentLoopKit files visible", async () => {
    const repoRoot = await startedRepo([]);
    const changedFiles = [
      ".agentloop/state.json",
      ".agentloop/reports/2026-06-19-verification-report.md",
      ".agentloop/handoffs/2026-06-19-pr-summary.md",
      ".agentloop/runs/2026-06-19-handoff/metadata.json",
      ".agentloop/tasks/2026-06-19-implementation.md",
      ".agentloop/policies/security.md",
      ".agentloop/harness/commands.json",
      ".agentloop/gates/review.md",
      "src/auth/reset.ts"
    ];

    const status = await runStatusCommand({ repoRoot, changedFiles });
    expect(status.output).toContain("Changed files:\n5");
    expect(status.output).toContain(".agentloop/tasks/2026-06-19-implementation.md");
    expect(status.output).toContain(".agentloop/policies/security.md");
    expect(status.output).toContain(".agentloop/harness/commands.json");
    expect(status.output).toContain(".agentloop/gates/review.md");
    expect(status.output).toContain("src/auth/reset.ts");
    expect(status.output).not.toContain(".agentloop/state.json");
    expect(status.output).not.toContain(".agentloop/reports/");
    expect(status.output).not.toContain(".agentloop/handoffs/");
    expect(status.output).not.toContain(".agentloop/runs/");

    const report = await runReportCommand({ repoRoot, changedFiles });
    const markdown = await readFile(report.reportPath, "utf8");
    expect(markdown).toContain(".agentloop/tasks/2026-06-19-implementation.md");
    expect(markdown).toContain(".agentloop/policies/security.md");
    expect(markdown).not.toContain(".agentloop/reports/");
    expect(markdown).not.toContain(".agentloop/handoffs/");
    expect(markdown).not.toContain(".agentloop/runs/");
    expect(markdown).not.toContain(".agentloop/state.json");

    const replay = await runReplayCommand({ repoRoot, changedFiles });
    const html = await readFile(replay.replayPath, "utf8");
    expect(html).toContain(".agentloop/tasks/2026-06-19-implementation.md");
    expect(html).toContain(".agentloop/gates/review.md");
    expect(html).not.toContain(".agentloop/reports/");
    expect(html).not.toContain(".agentloop/handoffs/");
    expect(html).not.toContain(".agentloop/runs/");
    expect(html).not.toContain(".agentloop/state.json");

    const resume = await runResumeCommand({ repoRoot, changedFiles });
    expect(resume.output).toContain(".agentloop/tasks/2026-06-19-implementation.md");
    expect(resume.output).toContain(".agentloop/harness/commands.json");
    expect(resume.output).not.toContain(".agentloop/reports/");
    expect(resume.output).not.toContain(".agentloop/handoffs/");
    expect(resume.output).not.toContain(".agentloop/runs/");
    expect(resume.output).not.toContain(".agentloop/state.json");

    const snapshot = await runSnapshotCommand({
      repoRoot,
      git: {
        branch: "main",
        commit: "abc123",
        dirty: true,
        changedFiles
      }
    });
    expect(snapshot.output).toContain("Changed files: 5");
  });

  it("applies configured generated-file filters in status, report, replay, resume, and snapshot", async () => {
    const repoRoot = await startedRepo([]);
    const configPath = join(repoRoot, ".agentflight", "config.json");
    const config = JSON.parse(await readFile(configPath, "utf8"));
    config.changedFileFilters = { ignore: [".projscan-memory/**"] };
    await writeFile(configPath, JSON.stringify(config, null, 2));
    const changedFiles = [".projscan-memory/memory.json", "src/auth/reset.ts"];

    const status = await runStatusCommand({ repoRoot, changedFiles });
    expect(status.output).toContain("Changed files:\n1");
    expect(status.output).toContain("src/auth/reset.ts");
    expect(status.output).not.toContain(".projscan-memory");

    const report = await runReportCommand({ repoRoot, changedFiles });
    await expect(readFile(report.reportPath, "utf8")).resolves.not.toContain(".projscan-memory");

    const replay = await runReplayCommand({ repoRoot, changedFiles });
    await expect(readFile(replay.replayPath, "utf8")).resolves.not.toContain(".projscan-memory");

    const resume = await runResumeCommand({ repoRoot, changedFiles });
    expect(resume.output).not.toContain(".projscan-memory");

    const snapshot = await runSnapshotCommand({
      repoRoot,
      git: {
        branch: "main",
        commit: "abc123",
        dirty: true,
        changedFiles
      }
    });
    expect(snapshot.output).toContain("Changed files: 1");
  });

  it("surfaces incomplete verification consistently and removes legacy report gap conflicts", async () => {
    const repoRoot = await startedRepo(["npm test"]);
    const session = JSON.parse(
      await readFile(join(repoRoot, ".agentflight", "current", "session.json"), "utf8")
    ) as AgentFlightSession;
    await saveSession(repoRoot, {
      ...session,
      events: [
        ...(session.events ?? []),
        {
          id: "evt-incomplete-verification",
          type: "verification_started",
          timestamp: "2026-06-13T12:00:00.000Z",
          title: "Verification started",
          metadata: { command: "npm test" }
        }
      ]
    });

    const status = await runStatusCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"]
    });
    expect(status.output).toContain("Readiness: Needs verification");
    expect(status.output).toContain(
      "Verification is still running or did not record a completed result: npm test"
    );
    expect(status.output).toContain(
      "Wait for the command to finish; if no result appears, rerun agentflight verify -- npm test"
    );
    expect(status.output).toContain("agentflight verify -- npm test");

    const report = await runReportCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"]
    });
    const markdown = await readFile(report.reportPath, "utf8");
    expect(markdown).toContain(
      "Verification is still running or did not record a completed result: npm test"
    );
    expect(markdown).toContain(
      "Wait for the command to finish; if no result appears, rerun agentflight verify -- npm test"
    );
    expect(markdown).toContain("agentflight verify -- npm test");
    expect(markdown).not.toContain("Missing passing verification evidence for");

    const replay = await runReplayCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"]
    });
    await expect(readFile(replay.replayPath, "utf8")).resolves.toContain(
      "Verification is still running or did not record a completed result: npm test"
    );

    const resume = await runResumeCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"]
    });
    expect(resume.output).toContain(
      "Verification is still running or did not record a completed result: npm test"
    );
    expect(resume.output).toContain(
      "Wait for the command to finish; if no result appears, rerun agentflight verify -- npm test"
    );
    expect(resume.output).toContain("agentflight verify -- npm test");
  });

  it("suggests a ProjScan memory ignore pattern without filtering it by default", async () => {
    const repoRoot = await startedRepo([]);
    const changedFiles = [".projscan-memory/memory.json", ".agentflight/config.json", "README.md"];

    const status = await runStatusCommand({ repoRoot, changedFiles });
    expect(status.output).toContain(".projscan-memory/memory.json");
    expect(status.output).toContain(".agentflight/config.json");
    expect(status.output).toContain(".projscan-memory/**");
    expect(status.output).toContain("changedFileFilters.ignore");

    const report = await runReportCommand({ repoRoot, changedFiles });
    const markdown = await readFile(report.reportPath, "utf8");
    expect(markdown).toContain(".projscan-memory/memory.json");
    expect(markdown).toContain(".agentflight/config.json");
    expect(markdown).toContain(".projscan-memory/**");
    expect(markdown).toContain("changedFileFilters.ignore");

    const handoff = await runHandoffCommand({ repoRoot, changedFiles });
    const handoffReviewFirst = handoff.output.slice(
      handoff.output.indexOf("Review first:"),
      handoff.output.indexOf("Proof gaps:")
    );
    expect(handoffReviewFirst.indexOf(".agentflight/config.json")).toBeLessThan(
      handoffReviewFirst.indexOf(".projscan-memory/memory.json")
    );
    expect(handoffReviewFirst.indexOf("README.md")).toBeLessThan(
      handoffReviewFirst.indexOf(".projscan-memory/memory.json")
    );
    expect(handoffReviewFirst).toContain("generated tool state");
    expect(handoffReviewFirst).toContain("add .projscan-memory/** to changedFileFilters.ignore");
    expect(handoffReviewFirst).not.toContain(
      "Inspect manually because AgentFlight could not classify this file."
    );

    const resume = await runResumeCommand({ repoRoot, changedFiles });
    expect(resume.output).toContain(".projscan-memory/memory.json");
    expect(resume.output).toContain(".agentflight/config.json");
    expect(resume.output).toContain(".projscan-memory/**");
    expect(resume.output).toContain("changedFileFilters.ignore");
  });

  it("keeps generated AgentFlight gitignore below real app changes in handoff focus", async () => {
    const repoRoot = await startedRepo([]);
    const changedFiles = [
      ".agentflight/.gitignore",
      ".agentflight/config.json",
      "README.md",
      ".projscan-memory/memory.json"
    ];

    const handoff = await runHandoffCommand({ repoRoot, changedFiles });
    const handoffReviewFirst = handoff.output.slice(
      handoff.output.indexOf("Review first:"),
      handoff.output.indexOf("Proof gaps:")
    );

    expect(handoffReviewFirst.indexOf(".agentflight/config.json")).toBeLessThan(
      handoffReviewFirst.indexOf(".agentflight/.gitignore")
    );
    expect(handoffReviewFirst.indexOf("README.md")).toBeLessThan(
      handoffReviewFirst.indexOf(".agentflight/.gitignore")
    );
    expect(handoffReviewFirst).toContain(
      "Check that AgentFlight runtime evidence stays ignored while config.json remains visible."
    );
  });

  it("keeps status, report, replay, and resume compatible with older session shapes", async () => {
    const repoRoot = await createTempRepo();
    await initAgentFlight({ repoRoot, now: new Date("2026-06-13T11:00:00.000Z") });

    for (const session of legacySessions(repoRoot)) {
      await writeFile(
        join(repoRoot, ".agentflight", "current", "session.json"),
        JSON.stringify(session, null, 2)
      );

      const status = await runStatusCommand({
        repoRoot,
        changedFiles: ["src/auth/reset.ts"]
      });
      expect(status.output).toContain(session.task.title);
      expect(status.output).toContain("Review first:");

      const report = await runReportCommand({
        repoRoot,
        changedFiles: ["src/auth/reset.ts"]
      });
      await expect(readFile(report.reportPath, "utf8")).resolves.toContain("## Review First");

      const replay = await runReplayCommand({
        repoRoot,
        changedFiles: ["src/auth/reset.ts"]
      });
      await expect(readFile(replay.replayPath, "utf8")).resolves.toContain("Review Focus");

      const resume = await runResumeCommand({
        repoRoot,
        changedFiles: ["src/auth/reset.ts"]
      });
      expect(resume.output).toContain("Review Focus");
    }
  });
});

async function startedRepo(verificationCommands: string[]): Promise<string> {
  const repoRoot = await createTempRepo();
  await initAgentFlight({ repoRoot, now: new Date("2026-06-13T11:00:00.000Z") });
  await startSession({
    repoRoot,
    task: "Capture verification",
    now: new Date("2026-06-13T11:30:00.000Z"),
    git: { branch: "main", commit: "abc123", dirty: false, changedFiles: [] },
    packageManager: "npm",
    verificationCommands,
    tools: {
      projscan: { available: true, warnings: [] },
      agentloopkit: { available: true, warnings: [] }
    }
  });
  return repoRoot;
}

function legacySessions(repoRoot: string): Array<{
  id: string;
  task: { title: string };
  [key: string]: unknown;
}> {
  const base = {
    startedAt: "2026-06-13T12:00:00.000Z",
    repoRoot,
    git: { branch: "main", commit: "abc123", dirty: true, changedFiles: ["src/auth/reset.ts"] },
    packageManager: "npm",
    verificationCommands: ["npm test"],
    tools: {
      projscan: { available: false, warnings: [] },
      agentloopkit: { available: false, warnings: [] }
    }
  };
  const passedRun = {
    command: "npm test",
    startedAt: "2026-06-13T12:01:00.000Z",
    finishedAt: "2026-06-13T12:01:05.000Z",
    durationMs: 5000,
    exitCode: 0,
    status: "passed",
    stdoutPath: ".agentflight/evidence/af-legacy/verification-1.stdout.txt",
    stderrPath: ".agentflight/evidence/af-legacy/verification-1.stderr.txt"
  };

  return [
    {
      ...base,
      id: "af-v0-1",
      task: { title: "v0.1 legacy session" }
    },
    {
      ...base,
      id: "af-v0-2",
      task: { title: "v0.2 legacy session" },
      verificationRuns: [passedRun]
    },
    {
      ...base,
      id: "af-v0-3",
      task: { title: "v0.3 legacy session" },
      verificationRuns: [passedRun],
      events: [
        {
          id: "evt-20260613-120000-session-started-001",
          type: "session_started",
          timestamp: "2026-06-13T12:00:00.000Z",
          title: "Session started"
        },
        {
          id: "evt-20260613-120100-snapshot-created-002",
          type: "snapshot_created",
          timestamp: "2026-06-13T12:01:00.000Z",
          title: "Snapshot created",
          message: "Legacy snapshot",
          metadata: {
            risk: { level: "high", changedFiles: 1 },
            review: {
              readiness: "ready_for_review",
              topFocusFiles: ["src/auth/reset.ts"],
              proofGapCount: 0
            }
          }
        }
      ]
    }
  ];
}

function proofSnapshot(fileHashes: Record<string, string>): ProofSnapshot {
  const changedFiles = Object.keys(fileHashes).sort((left, right) => left.localeCompare(right));
  return {
    schemaVersion: 1,
    capturedAt: "2026-06-13T12:00:05.000Z",
    gitCommit: "abc123",
    source: "git_status",
    changedFiles,
    hashAlgorithm: "sha256",
    files: changedFiles.map((file) => ({
      path: file,
      state: "present",
      size: 1,
      sha256: fileHashes[file]!
    })),
    fingerprintHash: changedFiles.map((file) => `${file}:${fileHashes[file]}`).join("|")
  };
}
