import type { RiskLevel } from "../types/index.js";

export interface ResumePromptInput {
  task: string;
  sessionId: string;
  branch: string | null;
  changedFiles: string[];
  riskLevel: RiskLevel;
  riskReasons: string[];
  verificationGaps: string[];
  latestSnapshotNote?: string | undefined;
  verificationState?: string | undefined;
  nextAction: string;
}

export function renderResumePrompt(input: ResumePromptInput): string {
  return `Continue this AgentFlight-recorded coding session safely.

## Task
${input.task}

## Current State
- Session: ${input.sessionId}
- Git branch: ${input.branch ?? "unknown"}
- Risk level: ${input.riskLevel}

## Changed Files
${renderList(input.changedFiles, "No changed files detected.")}

## Risks
${renderList(input.riskReasons, "No specific risks detected yet.")}

## Latest Snapshot
${input.latestSnapshotNote ?? "No snapshot recorded."}

## Verification State
${input.verificationState ?? "No verification state recorded."}

## Verification Gaps
${renderList(input.verificationGaps, "No verification gaps recorded.")}

## Next Recommended Action
${input.nextAction}

## Constraints
- Stay scoped to the current task.
- Do not start unrelated work.
- Do not claim completion without proof.
- Run relevant verification before declaring success.
- Keep changes scoped.
`;
}

function renderList(items: string[], empty: string): string {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : empty;
}
