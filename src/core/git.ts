import type { CommandRunner } from "./process.js";
import { runCommand } from "./process.js";
import type { GitInfo } from "../types/index.js";
import { filterBuiltInRuntimePaths } from "./changed-files.js";

export async function getRepositoryRoot(
  cwd: string,
  run: CommandRunner = runCommand
): Promise<string> {
  const result = await run("git", ["rev-parse", "--show-toplevel"], { cwd, timeoutMs: 10_000 });
  return result.exitCode === 0 && result.stdout.trim() ? result.stdout.trim() : cwd;
}

export async function getGitInfo(
  repoRoot: string,
  run: CommandRunner = runCommand
): Promise<GitInfo> {
  const [branch, commit, status] = await Promise.all([
    run("git", ["branch", "--show-current"], { cwd: repoRoot, timeoutMs: 10_000 }),
    run("git", ["rev-parse", "--short", "HEAD"], { cwd: repoRoot, timeoutMs: 10_000 }),
    run("git", ["status", "--porcelain", "-uall"], { cwd: repoRoot, timeoutMs: 10_000 })
  ]);

  const changedFiles =
    status.exitCode === 0 ? filterBuiltInRuntimePaths(parseGitStatusFiles(status.stdout)) : [];

  return {
    branch: branch.exitCode === 0 && branch.stdout.trim() ? branch.stdout.trim() : null,
    commit: commit.exitCode === 0 && commit.stdout.trim() ? commit.stdout.trim() : null,
    dirty: changedFiles.length > 0,
    changedFiles
  };
}

export async function listChangedFiles(
  repoRoot: string,
  run: CommandRunner = runCommand
): Promise<string[]> {
  const result = await run("git", ["status", "--porcelain", "-uall"], {
    cwd: repoRoot,
    timeoutMs: 10_000
  });
  if (result.exitCode !== 0) {
    throw new Error(
      `Unable to inspect changed files with git status: ${formatGitStatusFailure(result)}`
    );
  }
  return filterBuiltInRuntimePaths(parseGitStatusFiles(result.stdout));
}

export function parseGitStatusFiles(output: string): string[] {
  return output
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const pathPart = line.slice(3).trim();
      const renameMatch = /.+ -> (.+)$/.exec(pathPart);
      if (renameMatch?.[1]) return renameMatch[1];
      return pathPart;
    })
    .filter(Boolean);
}

function formatGitStatusFailure(result: { stdout: string; stderr: string }): string {
  return (result.stderr || result.stdout || "git status exited without output").trim();
}
