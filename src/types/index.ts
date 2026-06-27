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
    profiles?: Record<string, string[]>;
  };
  changedFileFilters?: {
    ignore: string[];
  };
  projectReviewContract?: ProjectReviewContractConfig;
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
  baseframeIntegration?: BaseframeIntegrationContext;
  verificationRuns?: VerificationRun[];
  reviewReceipts?: ReviewReceipt[];
  events?: SessionEvent[];
  tools: {
    projscan: ToolAdapterResult;
    agentloopkit: ToolAdapterResult;
  };
}

export interface ReviewPassportArtifact {
  kind:
    | "passport-json"
    | "passport-markdown"
    | "handoff"
    | "report"
    | "replay"
    | "resume"
    | "baseframe-result";
  path: string;
}

export interface ReviewPassportIntegrityInput {
  kind: "session" | "changed-files" | "verification" | "review" | "baseframe" | "artifacts";
  sha256: string;
}

export interface ReviewPassportIntegrity {
  hashAlgorithm: "sha256";
  inputs: ReviewPassportIntegrityInput[];
  fingerprintHash: string;
}

export interface ReviewPassportV1 {
  schemaVersion: "1.0";
  kind: "agentflight-review-passport";
  producer: {
    name: "agentflight";
    version: string;
  };
  generatedAt: string;
  session: {
    id: string;
    task: string;
    startedAt: string;
    branch: string | null;
    commit: string | null;
    packageManager: string | null;
  };
  readiness: {
    state: ReviewReadinessState;
    label: string;
    reason: string;
    nextAction: string;
    suggestedCommand?: string;
  };
  summary: string;
  changedFiles: string[];
  risk: {
    level: RiskLevel;
    reasons: string[];
    categories: RiskCategorySummary[];
  };
  verification: {
    passed: number;
    failed: number;
    unresolvedFailed: number;
    resolvedFailed: number;
    runs: Array<{
      id?: string;
      command: string;
      status: "passed" | "failed";
      exitCode: number | null;
      startedAt: string;
      finishedAt: string;
      durationMs: number;
    }>;
  };
  proofGaps: Array<{
    id: string;
    severity: "info" | "warning" | "blocking";
    message: string;
    suggestedCommand?: string;
    relatedFiles: string[];
  }>;
  reviewFocus: Array<{
    rank: number;
    path: string;
    category: RiskCategory;
    proofStatus: ReviewProofStatus;
    reasons: string[];
    suggestedReviewerFocus: string;
    suggestedCommand?: string;
  }>;
  reviewQueue: Array<{
    rank: number;
    action: ReviewQueueAction;
    label: string;
    detail: string;
    relatedFiles: string[];
    suggestedCommand?: string;
  }>;
  reviewRoutes: Array<{
    role: ReviewRouteRole;
    label: string;
    status: ReviewRouteStatus;
    summary: string;
    relatedFiles: string[];
    suggestedCommand?: string;
  }>;
  trustDelta: {
    summary: string;
    items: Array<{
      kind: TrustDeltaItemKind;
      severity: "info" | "warning" | "blocking";
      message: string;
      relatedFiles: string[];
      suggestedCommand?: string;
    }>;
  };
  baseframe?: {
    taskId: string;
    readiness: AgentFlightResultV1["readiness"];
    resultPath: string;
    gates: AgentFlightResultV1["gates"];
    scopeDrift: AgentFlightResultV1["scopeDrift"];
  };
  artifacts: ReviewPassportArtifact[];
  integrity: ReviewPassportIntegrity;
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
  | "baseframe_result_generated"
  | "review_passport_generated"
  | "review_receipt_recorded"
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
  | "agentflight/config"
  | "config"
  | "tests"
  | "docs"
  | "frontend"
  | "backend/api"
  | "dependencies"
  | "source"
  | "unknown";

export type RiskLevel = "none" | "low" | "medium" | "high" | "unknown";

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

export type ProofSnapshotSource = "git_status" | "session_git" | "unavailable";

export type ProofFileState = "present" | "deleted" | "unreadable";

export interface ProofFileFingerprint {
  path: string;
  state: ProofFileState;
  size?: number;
  sha256?: string;
  reason?: string;
}

export interface ProofSnapshot {
  schemaVersion: 1;
  capturedAt: string;
  gitCommit: string | null;
  source: ProofSnapshotSource;
  unavailableReason?: string;
  changedFiles: string[];
  hashAlgorithm: "sha256";
  files: ProofFileFingerprint[];
  fingerprintHash: string;
}

export interface VerificationRun {
  id?: string;
  command: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  exitCode: number | null;
  status: "passed" | "failed";
  stdoutPath: string;
  stderrPath: string;
  /**
   * Short tail of the command output (stderr preferred, else stdout), captured at
   * run time so a reviewer can see what happened without opening the evidence file.
   * Local-only, never uploaded. Omitted when there is no output.
   */
  outputExcerpt?: string;
  /**
   * Source-free fingerprints of the changed files at verification time. Stores
   * file paths, sizes, and hashes only; raw stdout/stderr evidence remains in
   * the evidence files above.
   */
  proofSnapshot?: ProofSnapshot;
}

export interface ProjScanAssessmentV1 {
  schemaVersion: "1.0";
  kind: "projscan-assessment";
  producer: {
    name: "projscan";
    version: string;
  };
  taskId: string;
  intent: string;
  generatedAt: string;
  repository: {
    root: string;
    branch?: string;
    commit?: string;
  };
  verdict: "proceed" | "caution" | "block" | "unknown";
  summary: string;
  repositoryType?: string;
  impactedAreas: Array<{
    name: string;
    paths: string[];
    reason: string;
  }>;
  reviewFocus: Array<{
    path: string;
    priority: "high" | "medium" | "low";
    reasons: string[];
  }>;
  risks: Array<{
    id: string;
    severity: "info" | "warning" | "blocking";
    category: string;
    message: string;
    files?: string[];
    suggestedAction?: string;
  }>;
  suggestedChecks: Array<{
    command: string;
    reason: string;
    required: boolean;
  }>;
  artifacts?: Array<{
    kind: "report" | "scan" | "log";
    path: string;
  }>;
}

export interface AgentLoopKitTaskContractV1 {
  schemaVersion: "1.0";
  kind: "agentloopkit-task";
  producer: {
    name: "agentloopkit";
    version: string;
  };
  taskId: string;
  intent: string;
  title: string;
  createdAt: string;
  sourceAssessment: {
    path: string;
    producerVersion: string;
    verdict: "proceed" | "caution" | "block" | "unknown";
  };
  scope: {
    allowedPaths: string[];
    reviewFirst: Array<{
      path: string;
      reasons: string[];
    }>;
    excludedPaths: string[];
  };
  acceptanceCriteria: Array<{
    id: string;
    text: string;
    status: "pending" | "satisfied" | "failed" | "unknown";
  }>;
  verificationGates: Array<{
    id: string;
    command: string;
    reason: string;
    required: boolean;
    status: "pending" | "passed" | "failed" | "skipped";
  }>;
  risks: Array<{
    id: string;
    severity: "info" | "warning" | "blocking";
    message: string;
    files?: string[];
  }>;
  status: "draft" | "active" | "blocked" | "complete";
  nativeTaskPath?: string;
}

export interface BaseframeIntegrationContext {
  schemaVersion: "1.0";
  taskId: string;
  projscanAssessmentPath?: string;
  agentloopkitTaskPath?: string;
  expectedScope: {
    allowedPaths: string[];
    excludedPaths: string[];
  };
  requiredVerification: Array<{
    id: string;
    command: string;
    reason: string;
    required: boolean;
  }>;
  importedReviewFocus: Array<{
    path: string;
    priority: "high" | "medium" | "low";
    reasons: string[];
    source: "projscan" | "agentloopkit";
  }>;
}

export interface ScopeDriftFinding {
  path: string;
  reason: "outside-allowed-scope" | "inside-excluded-scope" | "unclassified";
  severity: "warning" | "blocking";
}

export interface GateEvidenceStatus {
  gateId: string;
  command: string;
  status: "passed" | "failed" | "incomplete" | "missing" | "skipped";
  matchingVerificationRunId?: string;
}

export interface AgentFlightResultV1 {
  schemaVersion: "1.0";
  kind: "agentflight-result";
  producer: {
    name: "agentflight";
    version: string;
  };
  taskId: string;
  generatedAt: string;
  source: {
    projscanAssessmentPath?: string;
    agentloopkitTaskPath?: string;
  };
  readiness:
    | "ready_for_review"
    | "not_ready_for_review"
    | "needs_verification"
    | "blocked_by_failed_verification"
    | "unknown";
  summary: string;
  changedFiles: string[];
  scopeDrift: Array<{
    path: string;
    reason: string;
  }>;
  verification: Array<{
    command: string;
    status: "passed" | "failed" | "incomplete";
    exitCode?: number;
  }>;
  gates: Array<{
    gateId: string;
    command: string;
    status: "passed" | "failed" | "incomplete" | "missing" | "skipped";
    verificationRunId?: string;
  }>;
  proofGaps: Array<{
    severity: "info" | "warning" | "blocking";
    message: string;
    suggestedCommand?: string;
    relatedFiles?: string[];
  }>;
  reviewFocus: Array<{
    path: string;
    priority: "high" | "medium" | "low";
    reasons: string[];
    sources: Array<"projscan" | "agentloopkit" | "agentflight">;
  }>;
  artifacts: Array<{
    kind: "report" | "replay" | "resume" | "log";
    path: string;
  }>;
}

export type ReviewReceiptDecision = "accepted" | "needs_changes" | "blocked" | "superseded";

export interface ReviewReceiptSnapshot {
  branch: string | null;
  gitCommit: string | null;
  changedFiles: string[];
  readinessState: ReviewReadinessState;
  verificationPassed: number;
  verificationFailed: number;
  artifactPath?: string;
  proofSnapshot?: ProofSnapshot;
}

export interface ReviewReceipt {
  id: string;
  decision: ReviewReceiptDecision;
  recordedAt: string;
  summary: string;
  snapshot: ReviewReceiptSnapshot;
}

export type VerificationProofKind = "test" | "build" | "typecheck" | "lint" | "install" | "unknown";

export interface ProjectReviewContractConfig {
  enabled: boolean;
  rules: ProjectReviewContractRule[];
}

export interface ProjectReviewContractRule {
  id: string;
  label: string;
  categories: RiskCategory[];
  requiredProof?: VerificationProofKind[];
  manualReview?: string[];
  severity?: ProofGap["severity"];
  message?: string;
}

export interface ProjectReviewMatchedCategory {
  category: RiskCategory;
  files: string[];
}

export interface ProjectReviewSatisfiedProof {
  kind: VerificationProofKind;
  command: string;
  finishedAt?: string;
}

export type ReviewReadinessState =
  | "ready_for_review"
  | "not_ready_for_review"
  | "needs_verification"
  | "blocked_by_failed_verification"
  | "clean_worktree"
  | "unknown";

export type ReviewProofStatus =
  | "current"
  | "stale"
  | "covered"
  | "missing"
  | "failed"
  | "not_required"
  | "unknown";

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

export interface ProjScanReviewHint {
  file: string;
  /**
   * Optional local ProjScan score for this file. AgentFlight treats it as a
   * capped ranking hint, not as proof or a merge decision.
   */
  riskScore?: number;
  reason?: string;
}

export interface ProofGap {
  id: string;
  severity: "info" | "warning" | "blocking";
  message: string;
  suggestedCommand?: string;
  relatedFiles: string[];
}

export type ProofFreshnessState = "current" | "stale" | "legacy" | "unavailable" | "none";

export interface ProofFreshnessCategory {
  category: RiskCategory;
  files: string[];
  proofRequired: boolean;
}

export interface ProofFreshnessAttribution {
  state: ProofFreshnessState;
  reason: string;
  staleFiles: string[];
  staleCategories: ProofFreshnessCategory[];
}

export type ProjectReviewRequirementState =
  | "supported"
  | "needs_review"
  | "missing"
  | "failed"
  | "stale"
  | "not_required"
  | "unknown";

export interface ProjectReviewRequirementStatus {
  id: string;
  label: string;
  status: ProjectReviewRequirementState;
  proofStatus: ReviewProofStatus;
  severity: ProofGap["severity"];
  requiredProof: VerificationProofKind[];
  manualReview: string[];
  relatedFiles: string[];
  matchedCategories?: ProjectReviewMatchedCategory[];
  matchReason?: string;
  proofReason?: string;
  satisfiedProof?: ProjectReviewSatisfiedProof;
  remainingReview?: string[];
  relatedProofGapIds: string[];
  suggestedCommand?: string;
  message?: string;
}

export interface ProjectReviewContractSummary {
  total: number;
  supported: number;
  needsReview: number;
  missing: number;
  failed: number;
  stale: number;
  manualReview: number;
  notRequired: number;
  unknown: number;
}

export interface ProjectReviewContractEvaluation {
  enabled: boolean;
  requirements: ProjectReviewRequirementStatus[];
  summary: ProjectReviewContractSummary;
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

export type ProofCalibrationState = "no_history" | "aligned" | "under_proven";

export interface ProofCalibrationSuggestion {
  id: string;
  status: "under_proven";
  category: RiskCategory;
  message: string;
  currentProof: string[];
  historicalProof: string[];
  suggestedCommand: string;
  similarReadySessions: number;
  matchedSessionIds: string[];
}

export interface ProofCalibration {
  source: "local_session_history";
  state: ProofCalibrationState;
  summary: string;
  scannedSessions: number;
  similarReadySessions: number;
  suggestions: ProofCalibrationSuggestion[];
}

export type TrustDeltaItemKind =
  | "failed_proof"
  | "stale_proof"
  | "stale_receipt"
  | "review_receipt"
  | "missing_proof"
  | "manual_review"
  | "repo_calibration"
  | "ready"
  | "clean";

export interface TrustDeltaItem {
  kind: TrustDeltaItemKind;
  severity: ProofGap["severity"];
  message: string;
  relatedFiles: string[];
  suggestedCommand?: string;
  relatedProofGapIds: string[];
}

export interface TrustDelta {
  summary: string;
  items: TrustDeltaItem[];
}

export type ReviewQueueAction =
  | "fix_failed_proof"
  | "rerun_stale_proof"
  | "refresh_review_receipt"
  | "run_missing_proof"
  | "inspect_manual_review"
  | "consider_repo_calibration"
  | "inspect_file";

export interface ReviewQueueItem {
  rank: number;
  action: ReviewQueueAction;
  label: string;
  detail: string;
  relatedFiles: string[];
  suggestedCommand?: string;
  relatedProofGapIds: string[];
}

export type ReviewRouteRole = "maintainer" | "verification" | "security" | "docs_dx" | "release";

export type ReviewRouteStatus = "clear" | "needs_review" | "blocked";

export interface ReviewRouteItem {
  role: ReviewRouteRole;
  label: string;
  status: ReviewRouteStatus;
  priority: number;
  summary: string;
  reason: string;
  relatedFiles: string[];
  suggestedCommand?: string;
  relatedProofGapIds: string[];
}

export interface ReviewRoutes {
  summary: string;
  items: ReviewRouteItem[];
}

export type ReviewReceiptEvaluationState =
  | "none"
  | "current"
  | "stale"
  | "needs_changes"
  | "blocked"
  | "superseded";

export interface ReviewReceiptEvaluation {
  state: ReviewReceiptEvaluationState;
  label: string;
  summary: string;
  nextAction: string;
  staleFiles: string[];
  receipt?: ReviewReceipt;
}

export type ReviewContractClaimStatus =
  | "supported"
  | "needs_review"
  | "unsupported"
  | "failed"
  | "stale"
  | "not_testable"
  | "unknown";

export type ReviewContractClaimSource =
  | "task"
  | "project_requirement"
  | "file"
  | "proof_gap"
  | "readiness";

export type ReviewContractProofReferenceKind =
  | "changed_file"
  | "failure_excerpt"
  | "proof_gap"
  | "proof_snapshot"
  | "readiness_reason"
  | "suggested_command"
  | "verification_run";

export interface ReviewContractProofReference {
  kind: ReviewContractProofReferenceKind;
  label: string;
  target?: string;
}

export interface ReviewContractClaim {
  id: string;
  text: string;
  status: ReviewContractClaimStatus;
  source: ReviewContractClaimSource;
  reason: string;
  files: string[];
  evidence: string[];
  proofReferences?: ReviewContractProofReference[];
  relatedProofGapIds: string[];
  suggestedCommand?: string;
  nextAction?: string;
}

export interface ReviewContractSummary {
  total: number;
  supported: number;
  needsReview: number;
  unsupported: number;
  failed: number;
  stale: number;
  notTestable: number;
  unknown: number;
}

export interface ReviewContract {
  summary: ReviewContractSummary;
  reviewPath?: {
    summary: string;
    nextAction: string;
    inspectClaimIds: string[];
  };
  claims: ReviewContractClaim[];
}

export interface ReviewIntelligence {
  focus: ReviewFocusItem[];
  projectReviewContract?: ProjectReviewContractEvaluation;
  calibration?: ProofCalibration;
  reviewReceipt?: ReviewReceiptEvaluation;
  trustDelta?: TrustDelta;
  reviewQueue?: ReviewQueueItem[];
  reviewRoutes?: ReviewRoutes;
  proofFreshness?: ProofFreshnessAttribution;
  proofGaps: ProofGap[];
  readiness: ReviewReadinessDecision;
  contract?: ReviewContract;
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
