import type { RiskAnalysis, RiskCategory, RiskCategorySummary, RiskLevel } from "../types/index.js";

const highRiskCategories = new Set<RiskCategory>([
  "auth",
  "billing/payments",
  "database/migrations",
  "security/secrets",
  "config"
]);

const mediumRiskCategories = new Set<RiskCategory>(["backend/api", "dependencies"]);

export function categorizeFile(file: string): RiskCategory {
  const normalized = file.replaceAll("\\", "/").toLowerCase();

  if (/(^|\/)\.env($|\.)/.test(normalized)) {
    return "security/secrets";
  }
  if (/^\.agentloop\//.test(normalized)) {
    return "docs";
  }
  if (normalized === ".agentflight/config.json") {
    return "agentflight/config";
  }
  if (/(^|\/)(test|tests|__tests__|spec)(\/|$)|\.(test|spec)\.[cm]?[jt]sx?$/.test(normalized)) {
    return "tests";
  }
  if (/(^|\/)(doc|docs)(\/|$)|\.(md|mdx|txt)$/.test(normalized)) {
    return "docs";
  }
  if (/(^|\/)(auth|authentication|oauth|permission|permissions)(\/|[-_.])/.test(normalized)) {
    return "auth";
  }
  if (/(payment|payments|billing|stripe|checkout|invoice|invoices)/.test(normalized)) {
    return "billing/payments";
  }
  if (/(^|\/)(migration|migrations|db\/migrate|database\/migrations)(\/|$)/.test(normalized)) {
    return "database/migrations";
  }
  if (/secret|secrets|credential|credentials|token|tokens/.test(normalized)) {
    return "security/secrets";
  }
  if (
    /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|package\.json)$/.test(normalized) ||
    /(^|\/)(deps|dependencies)(\/|$)/.test(normalized)
  ) {
    return "dependencies";
  }
  if (
    /(^|\/)(\.github|\.gitlab|ci|config|configs)(\/|$)/.test(normalized) ||
    /(tsconfig|eslint|prettier|vite|vitest|rollup|webpack|babel|dockerfile)/.test(normalized)
  ) {
    return "config";
  }
  if (/(^|\/)(components|ui|pages|app|styles)(\/|$)|\.(tsx|jsx|css|scss)$/.test(normalized)) {
    return "frontend";
  }
  if (/(^|\/)(api|routes|controllers|server|backend)(\/|$)/.test(normalized)) {
    return "backend/api";
  }

  return "unknown";
}

export function analyzeRisk(files: string[]): RiskAnalysis {
  if (files.length === 0) {
    return {
      level: "unknown",
      changedFiles: 0,
      categories: [],
      reasons: ["No changed files detected yet."]
    };
  }

  const grouped = new Map<RiskCategory, string[]>();
  for (const file of files) {
    const category = categorizeFile(file);
    grouped.set(category, [...(grouped.get(category) ?? []), file]);
  }

  const categories: RiskCategorySummary[] = [...grouped.entries()].map(
    ([category, categoryFiles]) => ({
      category,
      files: categoryFiles
    })
  );

  const level = determineRiskLevel(categories);
  return {
    level,
    changedFiles: files.length,
    categories,
    reasons: buildReasons(categories, level)
  };
}

function determineRiskLevel(categories: RiskCategorySummary[]): RiskLevel {
  if (categories.some((summary) => highRiskCategories.has(summary.category))) return "high";
  if (categories.some((summary) => mediumRiskCategories.has(summary.category))) return "medium";
  if (
    categories.every(
      (summary) =>
        summary.category === "docs" ||
        summary.category === "tests" ||
        summary.category === "frontend"
    )
  ) {
    return "low";
  }
  return "medium";
}

function buildReasons(categories: RiskCategorySummary[], level: RiskLevel): string[] {
  const present = new Set(categories.map((summary) => summary.category));
  const reasons: string[] = [];

  if (present.has("auth")) reasons.push("Authentication-sensitive files changed.");
  if (present.has("billing/payments")) reasons.push("Billing or payment files changed.");
  if (present.has("database/migrations")) reasons.push("Database migration files changed.");
  if (present.has("security/secrets")) reasons.push("Secret or credential-adjacent files changed.");
  if (present.has("agentflight/config")) reasons.push("AgentFlight project configuration changed.");
  if (present.has("config")) reasons.push("Configuration or CI files changed.");
  if (present.has("backend/api")) reasons.push("Backend or API files changed.");
  if (present.has("dependencies")) reasons.push("Dependency or package metadata changed.");

  if (reasons.length === 0) {
    reasons.push(
      level === "low"
        ? "Only low-risk docs, tests, or isolated UI files changed."
        : "Risk is based on changed file categories."
    );
  }

  return reasons;
}
