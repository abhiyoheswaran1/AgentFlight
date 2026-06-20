import { basename } from "node:path";
import {
  ensureDir,
  pathExists,
  readJsonFile,
  writeJsonFileSafe,
  writeTextFileSafe
} from "./fs-safe.js";
import { resolveAgentFlightPaths } from "./paths.js";
import type { AgentFlightConfig, AgentFlightPaths } from "../types/index.js";

const runtimeGitignore = ["/sessions/", "/reports/", "/evidence/", "/current/", ""].join("\n");

export interface CreateDefaultConfigOptions {
  repoRoot: string;
  now?: Date | undefined;
}

export interface InitAgentFlightOptions {
  repoRoot: string;
  now?: Date | undefined;
}

export interface InitAgentFlightResult {
  paths: AgentFlightPaths;
  config: AgentFlightConfig;
  created: string[];
  skipped: string[];
  detections: {
    agentloopkit: boolean;
    projscan: boolean;
  };
}

export function createDefaultConfig(options: CreateDefaultConfigOptions): AgentFlightConfig {
  const now = options.now ?? new Date();

  return {
    version: 1,
    projectName: basename(options.repoRoot),
    createdAt: now.toISOString(),
    engines: {
      projscan: {
        enabled: true,
        mode: "npx"
      },
      agentloopkit: {
        enabled: true,
        mode: "npx"
      }
    },
    verification: {
      commands: [],
      profiles: {}
    },
    changedFileFilters: {
      ignore: []
    },
    privacy: {
      localOnly: true,
      telemetry: false
    }
  };
}

export async function initAgentFlight(
  options: InitAgentFlightOptions
): Promise<InitAgentFlightResult> {
  const paths = resolveAgentFlightPaths(options.repoRoot);
  const created: string[] = [];
  const skipped: string[] = [];

  await ensureDir(paths.root);
  await ensureDir(paths.sessions);
  await ensureDir(paths.reports);
  await ensureDir(paths.evidence);
  await ensureDir(paths.current);

  const runtimeIgnoreWrite = await writeTextFileSafe(`${paths.root}/.gitignore`, runtimeGitignore);
  if (runtimeIgnoreWrite.status === "created") created.push(runtimeIgnoreWrite.path);
  if (runtimeIgnoreWrite.status === "skipped") skipped.push(runtimeIgnoreWrite.path);

  const defaultConfig = createDefaultConfig({ repoRoot: options.repoRoot, now: options.now });
  const configWrite = await writeJsonFileSafe(paths.config, defaultConfig);
  if (configWrite.status === "created") created.push(configWrite.path);
  if (configWrite.status === "skipped") skipped.push(configWrite.path);

  const config =
    configWrite.status === "skipped"
      ? await readJsonFile<AgentFlightConfig>(paths.config)
      : defaultConfig;

  return {
    paths,
    config,
    created,
    skipped,
    detections: {
      agentloopkit: await pathExists(`${options.repoRoot}/.agentloop`),
      projscan: await pathExists(`${options.repoRoot}/.projscanrc.json`)
    }
  };
}

export async function loadConfig(repoRoot: string): Promise<AgentFlightConfig | null> {
  const paths = resolveAgentFlightPaths(repoRoot);
  if (!(await pathExists(paths.config))) return null;
  return readJsonFile<AgentFlightConfig>(paths.config);
}
