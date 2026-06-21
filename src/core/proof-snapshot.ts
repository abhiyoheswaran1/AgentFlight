import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { join } from "node:path";
import type { ProofFileFingerprint, ProofSnapshot, ProofSnapshotSource } from "../types/index.js";

export interface BuildProofSnapshotOptions {
  repoRoot: string;
  changedFiles: string[];
  capturedAt: string;
  gitCommit: string | null;
  source?: ProofSnapshotSource | undefined;
  unavailableReason?: string | undefined;
}

export interface ProofSnapshotComparison {
  current: boolean;
  staleFiles: string[];
  reason: string;
}

export async function buildProofSnapshot(
  options: BuildProofSnapshotOptions
): Promise<ProofSnapshot> {
  const changedFiles = normalizeChangedFiles(options.changedFiles);
  const files = await Promise.all(
    changedFiles.map((file) => fingerprintChangedFile(options.repoRoot, file))
  );
  const sortedFiles = files.sort((left, right) => left.path.localeCompare(right.path));

  const snapshot: ProofSnapshot = {
    schemaVersion: 1,
    capturedAt: options.capturedAt,
    gitCommit: options.gitCommit,
    source: options.source ?? "git_status",
    changedFiles,
    hashAlgorithm: "sha256",
    files: sortedFiles,
    fingerprintHash: hashFingerprintRows(sortedFiles)
  };
  if (options.unavailableReason !== undefined) {
    snapshot.unavailableReason = options.unavailableReason;
  }
  return snapshot;
}

export function compareProofSnapshotToCurrent(
  proof: ProofSnapshot,
  current: ProofSnapshot
): ProofSnapshotComparison {
  const proofFiles = new Map(proof.files.map((file) => [file.path, file]));
  const staleFiles = current.files
    .filter((file) => !fingerprintsEqual(proofFiles.get(file.path), file))
    .map((file) => file.path)
    .sort((left, right) => left.localeCompare(right));

  if (staleFiles.length === 0) {
    return {
      current: true,
      staleFiles,
      reason: "Verification proof matches the current changed-file state."
    };
  }

  return {
    current: false,
    staleFiles,
    reason: "Changed files were added or changed after proof was captured."
  };
}

function normalizeChangedFiles(files: string[]): string[] {
  return [...new Set(files.map(normalizeFilePath).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right)
  );
}

function normalizeFilePath(file: string): string {
  return file.replaceAll("\\", "/").replace(/^\.\//, "").trim();
}

async function fingerprintChangedFile(
  repoRoot: string,
  file: string
): Promise<ProofFileFingerprint> {
  const absolutePath = join(repoRoot, file);

  try {
    const stats = await stat(absolutePath);
    if (!stats.isFile()) {
      return {
        path: file,
        state: "unreadable",
        reason: "not a regular file"
      };
    }

    return {
      path: file,
      state: "present",
      size: stats.size,
      sha256: await hashFile(absolutePath)
    };
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return {
        path: file,
        state: "deleted"
      };
    }

    return {
      path: file,
      state: "unreadable",
      reason: error instanceof Error ? error.message : String(error)
    };
  }
}

function hashFile(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(path);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

function hashFingerprintRows(files: ProofFileFingerprint[]): string {
  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(JSON.stringify(normalizeFingerprintForHash(file)));
    hash.update("\n");
  }
  return hash.digest("hex");
}

function normalizeFingerprintForHash(file: ProofFileFingerprint): Record<string, unknown> {
  return {
    path: file.path,
    state: file.state,
    size: file.size ?? null,
    sha256: file.sha256 ?? null,
    reason: file.reason ?? null
  };
}

function fingerprintsEqual(
  proof: ProofFileFingerprint | undefined,
  current: ProofFileFingerprint
): boolean {
  if (!proof) return false;
  return (
    proof.path === current.path &&
    proof.state === current.state &&
    proof.size === current.size &&
    proof.sha256 === current.sha256
  );
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error;
}
