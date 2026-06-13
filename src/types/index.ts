export type AgentFlightEngineMode = "npx" | "local";

export interface AgentFlightConfig {
  version: 1;
  projectName: string;
  createdAt: string;
  engines: {
    projscan: {
      enabled: boolean;
      mode: AgentFlightEngineMode;
    };
    agentloopkit: {
      enabled: boolean;
      mode: AgentFlightEngineMode;
    };
  };
  verification: {
    commands: string[];
  };
  privacy: {
    localOnly: true;
    telemetry: false;
  };
}

export interface AgentFlightPaths {
  root: string;
  config: string;
  sessions: string;
  reports: string;
  evidence: string;
  current: string;
  currentSession: string;
  currentHandoff: string;
  currentResumePrompt: string;
}

export interface GitInfo {
  branch: string | null;
  commit: string | null;
  dirty: boolean;
  changedFiles: string[];
}

export interface AgentFlightSession {
  id: string;
  task: {
    title: string;
  };
  startedAt: string;
  repoRoot: string;
  git: GitInfo;
  packageManager: string | null;
  repoSummary?: string;
  verificationCommands: string[];
  verificationRuns?: VerificationRun[];
  tools: {
    projscan: ToolAdapterResult;
    agentloopkit: ToolAdapterResult;
  };
}

export type RiskCategory =
  | "auth"
  | "billing/payments"
  | "database/migrations"
  | "security/secrets"
  | "config"
  | "tests"
  | "docs"
  | "frontend"
  | "backend/api"
  | "dependencies"
  | "unknown";

export type RiskLevel = "low" | "medium" | "high" | "unknown";

export interface RiskCategorySummary {
  category: RiskCategory;
  files: string[];
}

export interface RiskAnalysis {
  level: RiskLevel;
  changedFiles: number;
  categories: RiskCategorySummary[];
  reasons: string[];
}

export interface ToolAdapterResult {
  available: boolean;
  version?: string;
  summary?: string;
  warnings: string[];
  rawOutputPath?: string;
  taskLinked?: boolean;
}

export interface VerificationRun {
  command: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  exitCode: number | null;
  status: "passed" | "failed";
  stdoutPath: string;
  stderrPath: string;
}

export interface VerificationEvidence {
  command: string;
  status: "pass" | "fail" | "not-run";
  output?: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface DoctorCheck {
  name: string;
  status: "ok" | "warning" | "error";
  message: string;
  suggestedFix?: string;
}

export interface DoctorResult {
  status: "ok" | "warning" | "error";
  checks: DoctorCheck[];
}
