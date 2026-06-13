import type { RiskLevel } from "../types/index.js";

export interface ResumePromptInput {
  task: string;
  sessionId: string;
  branch: string | null;
  changedFiles: string[];
  riskLevel: RiskLevel;
  riskReasons: string[];
  verificationGaps: string[];
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

## Verification Gaps
${renderList(input.verificationGaps, "No verification gaps recorded.")}

## Next Recommended Action
${input.nextAction}

## Constraints
- Do not start unrelated work.
- Do not claim completion without running proof.
- Run relevant verification.
- Keep changes scoped.
`;
}

function renderList(items: string[], empty: string): string {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : empty;
}
