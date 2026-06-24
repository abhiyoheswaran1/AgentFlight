import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTempRepo } from "../helpers/temp.js";
import {
  buildProofCalibration,
  loadProofCalibrationHistory
} from "../../src/core/proof-calibration.js";
import type { AgentFlightSession, ProofSnapshot, VerificationRun } from "../../src/types/index.js";

describe("proof calibration", () => {
  it("suggests proof commands from similar ready local handoffs when current proof is weaker", () => {
    const calibration = buildProofCalibration({
      currentSessionId: "af-current",
      changedFiles: ["src/auth/session.ts"],
      verificationRuns: [verificationRun("npm test", "passed")],
      verificationCommands: ["npm test", "npm run e2e:auth"],
      historicalSessions: [
        readySession({
          id: "af-auth-1",
          changedFiles: ["src/auth/session.ts"],
          commands: ["npm test", "npm run e2e:auth"]
        }),
        readySession({
          id: "af-auth-2",
          changedFiles: ["src/auth/password.ts"],
          commands: ["npm test", "npm run e2e:auth"]
        }),
        readySession({
          id: "af-docs",
          changedFiles: ["docs/usage.md"],
          commands: ["npm test"]
        })
      ]
    });

    expect(calibration).toMatchObject({
      state: "under_proven",
      similarReadySessions: 2,
      suggestions: [
        {
          status: "under_proven",
          category: "auth",
          suggestedCommand: "npm run e2e:auth",
          similarReadySessions: 2
        }
      ]
    });
    expect(calibration.summary).toContain("Similar local ready handoffs");
    expect(calibration.suggestions[0]?.message).toContain("auth changes");
    expect(calibration.suggestions[0]?.currentProof).toEqual(["npm test"]);
    expect(calibration.suggestions[0]?.historicalProof).toEqual(["npm run e2e:auth", "npm test"]);
  });

  it("stays quiet when there are not enough similar ready handoffs", () => {
    const calibration = buildProofCalibration({
      currentSessionId: "af-current",
      changedFiles: ["src/auth/session.ts"],
      verificationRuns: [verificationRun("npm test", "passed")],
      verificationCommands: ["npm test", "npm run e2e:auth"],
      historicalSessions: [
        readySession({
          id: "af-auth-1",
          changedFiles: ["src/auth/session.ts"],
          commands: ["npm test", "npm run e2e:auth"]
        })
      ]
    });

    expect(calibration).toMatchObject({
      state: "no_history",
      similarReadySessions: 1,
      suggestions: []
    });
  });

  it("does not suggest historical commands that are not configured for current proof", () => {
    const calibration = buildProofCalibration({
      currentSessionId: "af-current",
      changedFiles: ["src/auth/session.ts"],
      verificationRuns: [verificationRun("npm test", "passed")],
      verificationCommands: ["npm test"],
      historicalSessions: [
        readySession({
          id: "af-auth-1",
          changedFiles: ["src/auth/session.ts"],
          commands: ["npm test", "npm run e2e:auth"]
        }),
        readySession({
          id: "af-auth-2",
          changedFiles: ["src/auth/password.ts"],
          commands: ["npm test", "npm run e2e:auth"]
        })
      ]
    });

    expect(calibration).toMatchObject({
      state: "aligned",
      similarReadySessions: 2,
      suggestions: []
    });
  });

  it("does not treat docs-only history as missing automated proof", () => {
    const calibration = buildProofCalibration({
      currentSessionId: "af-current",
      changedFiles: ["README.md"],
      verificationRuns: [verificationRun("npm run format:check", "passed")],
      verificationCommands: ["npm run format:check", "npm pack --dry-run"],
      historicalSessions: [
        readySession({
          id: "af-docs-1",
          changedFiles: ["README.md"],
          commands: ["npm run format:check", "npm pack --dry-run"]
        }),
        readySession({
          id: "af-docs-2",
          changedFiles: ["docs/usage.md"],
          commands: ["npm run format:check", "npm pack --dry-run"]
        })
      ]
    });

    expect(calibration).toMatchObject({
      state: "no_history",
      similarReadySessions: 0,
      suggestions: []
    });
  });

  it("loads only bounded local session metadata without copying evidence output", async () => {
    const repoRoot = await createTempRepo();
    const sessionsPath = join(repoRoot, ".agentflight", "sessions");
    const evidencePath = join(repoRoot, ".agentflight", "evidence", "af-auth-1");
    await mkdir(sessionsPath, { recursive: true });
    await mkdir(evidencePath, { recursive: true });
    await writeFile(join(evidencePath, "verification-1.stdout.txt"), "SECRET_STDOUT\n", "utf8");
    await writeFile(join(evidencePath, "verification-1.stderr.txt"), "SECRET_STDERR\n", "utf8");

    await writeSession(repoRoot, readySession({ id: "af-auth-1", commands: ["npm test"] }));
    await writeSession(repoRoot, readySession({ id: "af-auth-2", commands: ["npm test"] }));
    await writeSession(repoRoot, blockedSession({ id: "af-blocked", commands: ["npm test"] }));
    await writeSession(repoRoot, readySession({ id: "af-current", commands: ["npm test"] }));
    await writeFile(join(sessionsPath, "broken.json"), "{", "utf8");

    const history = await loadProofCalibrationHistory(repoRoot, {
      currentSessionId: "af-current",
      limit: 2
    });

    expect(history.sessions.map((session) => session.id)).toEqual(["af-auth-2", "af-auth-1"]);
    expect(history.skipped).toHaveLength(1);
    expect(JSON.stringify(history.sessions)).not.toContain("SECRET_STDOUT");
    expect(JSON.stringify(history.sessions)).not.toContain("SECRET_STDERR");
  });
});

function readySession(options: {
  id: string;
  changedFiles?: string[];
  commands: string[];
}): AgentFlightSession {
  return session({
    ...options,
    readinessState: "ready_for_review"
  });
}

function blockedSession(options: {
  id: string;
  changedFiles?: string[];
  commands: string[];
}): AgentFlightSession {
  return session({
    ...options,
    readinessState: "needs_verification"
  });
}

function session(options: {
  id: string;
  changedFiles?: string[];
  commands: string[];
  readinessState: "ready_for_review" | "needs_verification";
}): AgentFlightSession {
  const changedFiles = options.changedFiles ?? ["src/auth/session.ts"];
  return {
    id: options.id,
    task: { title: options.id },
    startedAt: `2026-06-14T12:${options.id.endsWith("2") ? "02" : "01"}:00.000Z`,
    repoRoot: "/repo",
    git: { branch: "main", commit: "abc123", dirty: true, changedFiles },
    packageManager: "npm",
    verificationCommands: options.commands,
    verificationRuns: options.commands.map((command) =>
      verificationRun(command, "passed", {
        proofSnapshot: proofSnapshot(changedFiles)
      })
    ),
    events: [
      {
        id: `evt-${options.id}-report`,
        type: "report_generated",
        timestamp: "2026-06-14T12:10:00.000Z",
        title: "Report generated",
        metadata: {
          path: `.agentflight/reports/${options.id}-proof.md`,
          readiness: {
            state: options.readinessState,
            label:
              options.readinessState === "ready_for_review"
                ? "Ready for review"
                : "Needs verification",
            riskLevel: "high",
            changedFiles: changedFiles.length,
            verificationPassed: options.commands.length,
            verificationFailed: 0
          }
        }
      }
    ],
    tools: {
      projscan: { available: false, warnings: [] },
      agentloopkit: { available: false, warnings: [] }
    }
  };
}

async function writeSession(repoRoot: string, session: AgentFlightSession): Promise<void> {
  await writeFile(
    join(repoRoot, ".agentflight", "sessions", `${session.id}.json`),
    `${JSON.stringify(session, null, 2)}\n`,
    "utf8"
  );
}

function verificationRun(
  command: string,
  status: "passed" | "failed",
  overrides: Partial<VerificationRun> = {}
): VerificationRun {
  return {
    command,
    startedAt: "2026-06-14T12:01:00.000Z",
    finishedAt: "2026-06-14T12:01:05.000Z",
    durationMs: 5000,
    exitCode: status === "passed" ? 0 : 1,
    status,
    stdoutPath: `.agentflight/evidence/af-auth-1/verification-1.stdout.txt`,
    stderrPath: `.agentflight/evidence/af-auth-1/verification-1.stderr.txt`,
    ...overrides
  };
}

function proofSnapshot(changedFiles: string[]): ProofSnapshot {
  return {
    schemaVersion: 1,
    capturedAt: "2026-06-14T12:01:05.000Z",
    gitCommit: "abc123",
    source: "git_status",
    changedFiles,
    hashAlgorithm: "sha256",
    files: changedFiles.map((file) => ({
      path: file,
      state: "present",
      size: 1,
      sha256: `${file}-hash`
    })),
    fingerprintHash: changedFiles.join("|")
  };
}
