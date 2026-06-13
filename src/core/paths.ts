import { join } from "node:path";
import type { AgentFlightPaths } from "../types/index.js";

export function resolveAgentFlightPaths(repoRoot: string): AgentFlightPaths {
  const root = join(repoRoot, ".agentflight");

  return {
    root,
    config: join(root, "config.json"),
    sessions: join(root, "sessions"),
    reports: join(root, "reports"),
    evidence: join(root, "evidence"),
    current: join(root, "current"),
    currentSession: join(root, "current", "session.json"),
    currentHandoff: join(root, "current", "handoff.md"),
    currentResumePrompt: join(root, "current", "resume-prompt.md")
  };
}
