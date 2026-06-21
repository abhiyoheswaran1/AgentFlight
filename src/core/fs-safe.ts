import { constants } from "node:fs";
import { access, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { basename, dirname, join } from "node:path";

export type SafeWriteStatus = "created" | "overwritten" | "skipped";

export interface SafeWriteResult {
  path: string;
  status: SafeWriteStatus;
}

export interface SafeWriteOptions {
  overwrite?: boolean;
}

export interface FileLockOptions {
  timeoutMs?: number;
  pollMs?: number;
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function isPathWritable(path: string): Promise<boolean> {
  try {
    await access(path, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function readJsonFile<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

export async function writeJsonFileSafe(
  path: string,
  value: unknown,
  options: SafeWriteOptions = {}
): Promise<SafeWriteResult> {
  return writeTextFileSafe(path, `${JSON.stringify(value, null, 2)}\n`, options);
}

export async function writeTextFileSafe(
  path: string,
  value: string,
  options: SafeWriteOptions = {}
): Promise<SafeWriteResult> {
  const directory = dirname(path);
  await mkdir(directory, { recursive: true });

  const exists = await pathExists(path);
  if (exists && options.overwrite !== true) {
    return { path, status: "skipped" };
  }

  const tempPath = join(directory, `.${basename(path)}.${process.pid}.${randomUUID()}.tmp`);
  try {
    await writeFile(tempPath, value, "utf8");
    await rename(tempPath, path);
  } catch (error) {
    await rm(tempPath, { force: true });
    throw error;
  }

  return { path, status: exists ? "overwritten" : "created" };
}

export async function tryWriteTextFileExclusive(path: string, value: string): Promise<boolean> {
  const directory = dirname(path);
  await mkdir(directory, { recursive: true });

  try {
    await writeFile(path, value, { encoding: "utf8", flag: "wx" });
    return true;
  } catch (error) {
    if (isNodeError(error) && error.code === "EEXIST") return false;
    throw error;
  }
}

export async function withFileLock<T>(
  lockPath: string,
  callback: () => Promise<T>,
  options: FileLockOptions = {}
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 5000;
  const pollMs = options.pollMs ?? 10;
  const startedAt = Date.now();

  while (!(await tryWriteTextFileExclusive(lockPath, `${process.pid}\n`))) {
    if (Date.now() - startedAt >= timeoutMs) {
      throw new Error("Timed out waiting for AgentFlight local file lock.");
    }

    await sleep(pollMs);
  }

  try {
    return await callback();
  } finally {
    await rm(lockPath, { force: true });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error;
}
