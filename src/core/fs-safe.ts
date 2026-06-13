import { constants } from "node:fs";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

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
  await mkdir(dirname(path), { recursive: true });

  const exists = await pathExists(path);
  if (exists && options.overwrite !== true) {
    return { path, status: "skipped" };
  }

  await writeFile(path, value, "utf8");
  return { path, status: exists ? "overwritten" : "created" };
}
