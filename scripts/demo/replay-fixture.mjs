// Realistic, deterministic input for the replay demo assets.
// Imports the compiled renderer so the screenshot/GIF always match the shipped UI.
// Run `npm run build` first; this reads from dist/.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderHtmlReplay } from "../../dist/renderers/html-replay.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

// A mid-session record with one failed then one passing run, elevated risk, and
// open proof gaps: shows the design calm in places and escalated where evidence
// is missing.
export const fixture = {
  task: "Add password reset flow with single-use tokens",
  sessionId: "af-20260616-7d3f-password-reset",
  startedAt: "2026-06-16 14:02:11",
  riskBadges: ["high", "auth"],
  reviewReadiness: "Needs verification",
  recommendation:
    "Run agentflight verify -- npm test to confirm the auth path, then re-check the migration rollback before opening for review.",
  changedFiles: [
    "src/auth/reset.ts",
    "src/auth/session.ts",
    "src/api/routes/auth.ts",
    "src/db/migrations/0007_reset_tokens.sql",
    "src/email/templates/reset.tsx",
    "package.json",
    "tests/auth/reset.test.ts"
  ],
  changedFileGroups: [
    {
      category: "auth",
      files: ["src/auth/reset.ts", "src/auth/session.ts", "src/api/routes/auth.ts"]
    },
    { category: "database", files: ["src/db/migrations/0007_reset_tokens.sql"] },
    { category: "frontend", files: ["src/email/templates/reset.tsx"] },
    { category: "dependencies", files: ["package.json"] },
    { category: "tests", files: ["tests/auth/reset.test.ts"] }
  ],
  timeline: [
    {
      type: "session_started",
      title: "Session started",
      timestamp: "14:02:11",
      message: "Branch main, npm, working tree clean."
    },
    {
      type: "verification_failed",
      title: "Verification failed",
      timestamp: "14:21:40",
      message: "2 tests failing in reset.test.ts: token reuse not rejected."
    },
    {
      type: "snapshot_created",
      title: "Snapshot: token single-use enforced",
      timestamp: "14:38:02",
      message: "Reset tokens are now invalidated on first use."
    },
    {
      type: "verification_passed",
      title: "Verification passed",
      timestamp: "14:39:55",
      message: "npm test green, 41 passed."
    },
    { type: "replay_generated", title: "Replay generated", timestamp: "14:40:10" }
  ],
  verificationEvidence: [
    {
      command: "npm test",
      startedAt: "2026-06-16T14:21:31.000Z",
      finishedAt: "2026-06-16T14:21:40.000Z",
      durationMs: 8421,
      exitCode: 1,
      status: "failed",
      stdoutPath: ".agentflight/evidence/af-7d3f/verification-1.stdout.txt",
      stderrPath: ".agentflight/evidence/af-7d3f/verification-1.stderr.txt"
    },
    {
      command: "npm test",
      startedAt: "2026-06-16T14:39:47.000Z",
      finishedAt: "2026-06-16T14:39:55.000Z",
      durationMs: 7903,
      exitCode: 0,
      status: "passed",
      stdoutPath: ".agentflight/evidence/af-7d3f/verification-2.stdout.txt",
      stderrPath: ".agentflight/evidence/af-7d3f/verification-2.stderr.txt"
    }
  ],
  review: {
    focus: [
      {
        rank: 1,
        file: "src/auth/reset.ts",
        category: "auth",
        riskLevel: "high",
        score: 130,
        reasons: ["identity/session path", "mutates the token store"],
        suggestedReviewerFocus: "Check session, permission, and identity boundaries first.",
        proofStatus: "present",
        suggestedCommand: "npm test",
        relatedProofGapIds: []
      },
      {
        rank: 2,
        file: "src/db/migrations/0007_reset_tokens.sql",
        category: "database",
        riskLevel: "medium",
        score: 84,
        reasons: ["irreversible schema change", "no rollback test"],
        suggestedReviewerFocus:
          "Confirm the migration is reversible and the new column is indexed.",
        proofStatus: "missing",
        suggestedCommand: "npm run db:test",
        relatedProofGapIds: ["missing-migration-rollback"]
      }
    ],
    proofGaps: [
      {
        id: "missing-migration-rollback",
        severity: "warning",
        message: "Database migration 0007 changed schema with no rollback test.",
        suggestedCommand: "npm run db:test",
        relatedFiles: ["src/db/migrations/0007_reset_tokens.sql"]
      }
    ],
    readiness: {
      state: "needs_verification",
      label: "Needs verification",
      reason: "A database migration changed schema without a passing rollback test.",
      nextAction: "Run agentflight verify -- npm run db:test",
      suggestedCommand: "npm run db:test",
      proofGaps: []
    }
  }
};

export function writeFixtureHtml() {
  const html = renderHtmlReplay(fixture);
  const outPath = resolve(root, "output/replay-demo.html");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html);
  return outPath;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(writeFixtureHtml());
}
