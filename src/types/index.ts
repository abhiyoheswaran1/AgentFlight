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
  changedFileFilters?: {
    ignore: string[];
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
  events?: SessionEvent[];
  tools: {
    projscan: ToolAdapterResult;
    agentloopkit: ToolAdapterResult;
  };
}

export type SessionEventType =
  | "session_started"
  | "verification_started"
  | "verification_passed"
  | "verification_failed"
  | "snapshot_created"
  | "report_generated"
  | "replay_generated"
  | "resume_generated"
  | "doctor_run";

export interface SessionEvent {
  id: string;
  type: SessionEventType;
  timestamp: string;
  title: string;
  message?: string;
  metadata?: Record<string, unknown>;
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

export type VerificationProofKind = "test" | "build" | "typecheck" | "lint" | "install" | "unknown";

export type ReviewReadinessState =
  | "ready_for_review"
  | "not_ready_for_review"
  | "needs_verification"
  | "blocked_by_failed_verification"
  | "unknown";

export type ReviewProofStatus = "covered" | "missing" | "failed" | "not_required" | "unknown";

export interface ReviewFocusItem {
  rank: number;
  file: string;
  category: RiskCategory;
  riskLevel: RiskLevel;
  score: number;
  reasons: string[];
  suggestedReviewerFocus: string;
  proofStatus: ReviewProofStatus;
  suggestedCommand?: string;
  relatedProofGapIds: string[];
}

export interface ProofGap {
  id: string;
  severity: "info" | "warning" | "blocking";
  message: string;
  suggestedCommand?: string;
  relatedFiles: string[];
}

export interface ReviewReadinessDecision {
  state: ReviewReadinessState;
  label: string;
  reason: string;
  nextAction: string;
  suggestedCommand?: string;
  proofGaps: ProofGap[];
  failedVerificationSummary?: string;
}

export interface ReviewIntelligence {
  focus: ReviewFocusItem[];
  proofGaps: ProofGap[];
  readiness: ReviewReadinessDecision;
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
