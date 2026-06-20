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
