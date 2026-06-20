import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTempRepo } from "../helpers/temp.js";
import { initAgentFlight } from "../../src/core/config.js";
import { startSession } from "../../src/core/session.js";
import { runHandoffCommand } from "../../src/commands/handoff.js";
import { runReplayCommand } from "../../src/commands/replay.js";
import { runReportCommand } from "../../src/commands/report.js";
import { runResumeCommand } from "../../src/commands/resume.js";
import { runSnapshotCommand } from "../../src/commands/snapshot.js";
import { runStatusCommand } from "../../src/commands/status.js";
import { runVerifyCommand } from "../../src/commands/verify.js";

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
        proofGaps: []
      }
    });
    expect(payload.review.focus[0]).toMatchObject({
      file: "docs/development/verification.md",
      proofStatus: "not_required"
    });
    expect(payload.nextAction).toContain("agentflight handoff");
    expect(status.output).not.toContain("diff --git");
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
    expect(html).toContain("Proof Gaps");
    expect(html).toContain("Evidence files");
    expect(html).toContain("passed");
    expect(html).toContain("Generated by AgentFlight");
    expect(html).not.toContain("Generate a report and");
    expect(html).not.toMatch(/https?:\/\//);
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

    expect(resume.output).toContain("Latest Snapshot");
    expect(resume.output).toContain("Ready to hand off");
    expect(resume.output).toContain("Verification State");
    expect(resume.output).toContain("1 passed, 0 failed");
    expect(resume.output).toContain("Review Focus");
    expect(resume.output).toContain("Run agentflight handoff to generate the local review packet");
    expect(resume.output).not.toContain("Generate a report and");
    expect(resume.output).not.toContain("Use the generated report or replay");
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
    expect(handoff.output).toContain("AgentFlight handoff");
    expect(handoff.output).toContain("Readiness: Ready for review");
    expect(handoff.output).toContain("Open first: replay");
    expect(handoff.output).toContain("Share this handoff with the report/replay");
    expect(handoff.output).toContain("No failed verification excerpts recorded.");
    expect(handoff.output).not.toContain("Run agentflight handoff");
    expect(handoff.output).toContain("Review first:");
    expect(handoff.output).toContain("docs/development/verification.md");
    expect(handoff.output).toContain("Artifacts:");
    expect(handoff.output).toContain("Report:");
    expect(handoff.output).toContain("Replay:");
    expect(handoff.output).toContain("Resume:");
    expect(handoff.output).toContain(".agentflight/current/handoff.md");
    expect(handoff.output).toContain(".agentflight/reports/");
    expect(handoff.output).not.toContain(repoRoot);
    expect(handoff.output).toContain(
      "Local only: no upload, no telemetry, no automatic PR comment."
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
    expect(handoff.output).not.toContain("Share this handoff with the report/replay");
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
    const currentSessionPath = join(repoRoot, ".agentflight", "current", "session.json");
    const session = JSON.parse(await readFile(currentSessionPath, "utf8"));
    session.events.push({
      id: "evt-incomplete-verification",
      type: "verification_started",
      timestamp: "2026-06-13T12:00:00.000Z",
      title: "Verification started",
      metadata: { command: "npm test" }
    });
    await writeFile(currentSessionPath, JSON.stringify(session, null, 2));

    const status = await runStatusCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"]
    });
    expect(status.output).toContain("Readiness: Needs verification");
    expect(status.output).toContain(
      "Verification was started but no completed result was recorded"
    );
    expect(status.output).toContain("agentflight verify -- npm test");

    const report = await runReportCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"]
    });
    const markdown = await readFile(report.reportPath, "utf8");
    expect(markdown).toContain("Verification was started but no completed result was recorded");
    expect(markdown).toContain("agentflight verify -- npm test");
    expect(markdown).not.toContain("Missing passing verification evidence for");

    const replay = await runReplayCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"]
    });
    await expect(readFile(replay.replayPath, "utf8")).resolves.toContain(
      "Verification was started but no completed result was recorded"
    );

    const resume = await runResumeCommand({
      repoRoot,
      changedFiles: ["src/auth/reset.ts"]
    });
    expect(resume.output).toContain(
      "Verification was started but no completed result was recorded"
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
