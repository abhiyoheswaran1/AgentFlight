import { describe, expect, it } from "vitest";
import { analyzeRisk, categorizeFile } from "../../src/core/risk.js";

describe("risk categorisation", () => {
  it.each([
    ["src/auth/password-reset.ts", "auth"],
    ["src/payments/stripe.ts", "billing/payments"],
    ["migrations/20260613_add_users.sql", "database/migrations"],
    [".env.example", "security/secrets"],
    [".github/workflows/ci.yml", "config"],
    [".agentflight/.gitignore", "agentflight/config"],
    [".agentloop/state.json", "docs"],
    [".agentloop/policies/secrets-policy.md", "docs"],
    ["tests/session.test.ts", "tests"],
    ["docs/roadmap.md", "docs"],
    ["src/components/LoginForm.tsx", "frontend"],
    ["src/api/users.ts", "backend/api"],
    ["src/core/review-intelligence.ts", "source"],
    ["src/commands/handoff.ts", "source"]
  ] as const)("categorises %s as %s", (file, category) => {
    expect(categorizeFile(file)).toBe(category);
  });

  it("scores docs and tests only as low risk", () => {
    expect(analyzeRisk(["docs/roadmap.md", "tests/risk.test.ts"])).toMatchObject({
      level: "low",
      changedFiles: 2
    });
  });

  it("treats AgentLoopKit workflow artifacts as low-risk dogfooding docs", () => {
    expect(
      analyzeRisk([
        ".agentloop/state.json",
        ".agentloop/tasks/2026-06-13-dogfood-agentflight-v0-2-0-core-workflow.md",
        "docs/development/verification.md"
      ])
    ).toMatchObject({
      level: "low",
      changedFiles: 3,
      reasons: ["Only low-risk docs, tests, or isolated UI files changed."]
    });
  });

  it("scores dependency and backend changes as medium risk", () => {
    expect(analyzeRisk(["package.json", "src/api/users.ts", "src/core/risk.ts"])).toMatchObject({
      level: "medium"
    });
  });

  it("scores auth, secret, config, and migration changes as high risk", () => {
    expect(analyzeRisk(["src/auth/login.ts", ".github/workflows/ci.yml"])).toMatchObject({
      level: "high"
    });
  });

  it("uses none when there are no changed files", () => {
    expect(analyzeRisk([])).toMatchObject({
      level: "none",
      changedFiles: 0,
      reasons: ["No changed files are currently detected."]
    });
  });
});
