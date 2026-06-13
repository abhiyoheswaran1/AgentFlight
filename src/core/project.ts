import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathExists } from "./fs-safe.js";
import type { PackageJsonLike } from "./verification.js";

export async function readPackageJson(repoRoot: string): Promise<PackageJsonLike> {
  try {
    return JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8")) as PackageJsonLike;
  } catch {
    return {};
  }
}

export async function detectPackageManager(repoRoot: string): Promise<string | null> {
  if (await pathExists(join(repoRoot, "package-lock.json"))) return "npm";
  if (await pathExists(join(repoRoot, "pnpm-lock.yaml"))) return "pnpm";
  if (await pathExists(join(repoRoot, "yarn.lock"))) return "yarn";
  if (await pathExists(join(repoRoot, "bun.lockb"))) return "bun";
  if (await pathExists(join(repoRoot, "package.json"))) return "npm";
  return null;
}
