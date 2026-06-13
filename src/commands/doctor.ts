import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { inspectAgentLoopKit } from "../adapters/agentloopkit.js";
import { inspectProjScan } from "../adapters/projscan.js";
import { evaluateDoctorChecks } from "../core/doctor.js";
import { isPathWritable, pathExists } from "../core/fs-safe.js";
import { getRepositoryRoot } from "../core/git.js";
import { renderStatus } from "../core/output.js";
import { detectPackageManager, readPackageJson } from "../core/project.js";
import { runCommand } from "../core/process.js";
import { resolveAgentFlightPaths } from "../core/paths.js";
import type { DoctorResult } from "../types/index.js";

export interface DoctorCommandOptions {
  repoRoot: string;
  nodeVersion?: string | undefined;
  npmVersion?: string | null | undefined;
  gitAvailable?: boolean | undefined;
  packageManager?: string | null | undefined;
  projscanAvailable?: boolean | undefined;
  agentloopkitAvailable?: boolean | undefined;
}

export interface DoctorCommandResult {
  output: string;
  result: DoctorResult;
}

export async function runDoctorCommand(
  options: DoctorCommandOptions
): Promise<DoctorCommandResult> {
  const paths = resolveAgentFlightPaths(options.repoRoot);
  const packageJson = await readPackageJson(options.repoRoot);
  const scripts = packageJson.scripts ?? {};
  const [npmVersion, repoRoot, packageManager, projscan, agentloopkit] = await Promise.all([
    options.npmVersion !== undefined
      ? Promise.resolve(options.npmVersion)
      : getNpmVersion(options.repoRoot),
    getRepositoryRoot(options.repoRoot),
    options.packageManager !== undefined
      ? Promise.resolve(options.packageManager)
      : detectPackageManager(options.repoRoot),
    options.projscanAvailable !== undefined
      ? Promise.resolve({ available: options.projscanAvailable })
      : inspectProjScan({ cwd: options.repoRoot }),
    options.agentloopkitAvailable !== undefined
      ? Promise.resolve({ available: options.agentloopkitAvailable })
      : inspectAgentLoopKit({ cwd: options.repoRoot })
  ]);

  const result = evaluateDoctorChecks({
    nodeVersion: options.nodeVersion ?? process.version,
    npmVersion,
    gitAvailable:
      options.gitAvailable ??
      (repoRoot !== options.repoRoot || (await pathExists(join(options.repoRoot, ".git")))),
    packageManager,
    repoRoot,
    agentFlightExists: await pathExists(paths.root),
    configValid: await isConfigValid(paths.config),
    writable: await isPathWritable(paths.root),
    currentSessionExists: await pathExists(paths.currentSession),
    projscanAvailable: projscan.available,
    agentloopkitAvailable: agentloopkit.available,
    scripts: {
      test: Boolean(scripts.test),
      build: Boolean(scripts.build),
      typecheck: Boolean(scripts.typecheck),
      lint: Boolean(scripts.lint)
    }
  });

  return {
    output: renderDoctor(result),
    result
  };
}

async function getNpmVersion(repoRoot: string): Promise<string | null> {
  const result = await runCommand("npm", ["--version"], { cwd: repoRoot, timeoutMs: 10_000 });
  return result.exitCode === 0 ? result.stdout.trim() : null;
}

async function isConfigValid(path: string): Promise<boolean> {
  try {
    JSON.parse(await readFile(path, "utf8"));
    return true;
  } catch {
    return false;
  }
}

function renderDoctor(result: DoctorResult): string {
  return `AgentFlight Doctor

Overall: ${renderStatus(result.status)}

${result.checks
  .map((check) => {
    const fix = check.suggestedFix ? `\n  Suggested fix: ${check.suggestedFix}` : "";
    return `- ${renderStatus(check.status)} ${check.name}: ${check.message}${fix}`;
  })
  .join("\n")}
`;
}
