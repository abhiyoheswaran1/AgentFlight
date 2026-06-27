import { createAgentFlightResult } from "../core/baseframe.js";
import { filterChangedFiles } from "../core/changed-files.js";
import { loadConfig } from "../core/config.js";
import { listChangedFiles } from "../core/git.js";
import type { AgentFlightResultV1, AgentFlightSession } from "../types/index.js";

export interface RefreshBaseframeResultOptions {
  repoRoot: string;
  session: AgentFlightSession;
  changedFiles?: string[] | undefined;
  now?: Date | undefined;
  artifacts?: AgentFlightResultV1["artifacts"] | undefined;
}

export async function refreshBaseframeResultIfPresent(
  options: RefreshBaseframeResultOptions
): Promise<AgentFlightResultV1 | null> {
  if (!options.session.baseframeIntegration) return null;
  const config = await loadConfig(options.repoRoot);
  const changedFiles = filterChangedFiles(
    options.changedFiles ?? (await readChangedFilesWithFallback(options.repoRoot, options.session)),
    { ignore: config?.changedFileFilters?.ignore }
  );
  return createAgentFlightResult({
    repoRoot: options.repoRoot,
    session: options.session,
    changedFiles,
    now: options.now,
    artifacts: options.artifacts
  });
}

async function readChangedFilesWithFallback(
  repoRoot: string,
  session: AgentFlightSession
): Promise<string[]> {
  try {
    return await listChangedFiles(repoRoot);
  } catch {
    return session.git.changedFiles;
  }
}
