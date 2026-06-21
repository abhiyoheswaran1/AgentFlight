import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildProofSnapshot,
  compareProofSnapshotToCurrent
} from "../../src/core/proof-snapshot.js";
import { createTempRepo } from "../helpers/temp.js";

describe("proof snapshots", () => {
  it("builds deterministic source-free fingerprints for changed files", async () => {
    const repoRoot = await createTempRepo();
    await mkdir(join(repoRoot, "src"), { recursive: true });
    await writeFile(join(repoRoot, "src", "alpha.ts"), "const secret = 'alpha';\n", "utf8");
    await writeFile(join(repoRoot, "src", "beta.ts"), "const secret = 'beta';\n", "utf8");

    const first = await buildProofSnapshot({
      repoRoot,
      changedFiles: ["src/beta.ts", "src/alpha.ts"],
      capturedAt: "2026-06-21T12:00:00.000Z",
      gitCommit: "abc123"
    });
    const second = await buildProofSnapshot({
      repoRoot,
      changedFiles: ["src/alpha.ts", "src/beta.ts"],
      capturedAt: "2026-06-21T12:00:00.000Z",
      gitCommit: "abc123"
    });

    expect(first.fingerprintHash).toBe(second.fingerprintHash);
    expect(first.changedFiles).toEqual(["src/alpha.ts", "src/beta.ts"]);
    expect(first.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "src/alpha.ts",
          state: "present",
          size: "const secret = 'alpha';\n".length
        }),
        expect.objectContaining({
          path: "src/beta.ts",
          state: "present",
          size: "const secret = 'beta';\n".length
        })
      ])
    );

    const serialized = JSON.stringify(first);
    expect(serialized).not.toContain("const secret");
    expect(serialized).not.toContain("alpha';");
    expect(serialized).not.toContain("beta';");
  });

  it("detects when a file changes after proof was captured", async () => {
    const repoRoot = await createTempRepo();
    await mkdir(join(repoRoot, "src"), { recursive: true });
    await writeFile(join(repoRoot, "src", "proof.ts"), "export const value = 1;\n", "utf8");
    const proof = await buildProofSnapshot({
      repoRoot,
      changedFiles: ["src/proof.ts"],
      capturedAt: "2026-06-21T12:00:00.000Z",
      gitCommit: "abc123"
    });

    await writeFile(join(repoRoot, "src", "proof.ts"), "export const value = 2;\n", "utf8");
    const current = await buildProofSnapshot({
      repoRoot,
      changedFiles: ["src/proof.ts"],
      capturedAt: "2026-06-21T12:05:00.000Z",
      gitCommit: "abc123"
    });

    const comparison = compareProofSnapshotToCurrent(proof, current);

    expect(comparison.current).toBe(false);
    expect(comparison.staleFiles).toEqual(["src/proof.ts"]);
    expect(comparison.reason).toContain("changed after proof was captured");
  });

  it("marks newly changed files as stale when they were absent from proof", async () => {
    const repoRoot = await createTempRepo();
    await mkdir(join(repoRoot, "src"), { recursive: true });
    await writeFile(join(repoRoot, "src", "covered.ts"), "export const covered = true;\n", "utf8");
    const proof = await buildProofSnapshot({
      repoRoot,
      changedFiles: ["src/covered.ts"],
      capturedAt: "2026-06-21T12:00:00.000Z",
      gitCommit: "abc123"
    });

    await writeFile(join(repoRoot, "src", "new.ts"), "export const newer = true;\n", "utf8");
    const current = await buildProofSnapshot({
      repoRoot,
      changedFiles: ["src/covered.ts", "src/new.ts"],
      capturedAt: "2026-06-21T12:05:00.000Z",
      gitCommit: "abc123"
    });

    const comparison = compareProofSnapshotToCurrent(proof, current);

    expect(comparison.current).toBe(false);
    expect(comparison.staleFiles).toEqual(["src/new.ts"]);
  });

  it("represents deleted and unreadable files without crashing", async () => {
    const repoRoot = await createTempRepo();
    await mkdir(join(repoRoot, "src"), { recursive: true });
    await writeFile(join(repoRoot, "src", "deleted.ts"), "gone\n", "utf8");
    await writeFile(join(repoRoot, "src", "unreadable.ts"), "locked\n", "utf8");
    await rm(join(repoRoot, "src", "deleted.ts"));
    await chmod(join(repoRoot, "src", "unreadable.ts"), 0o000);

    try {
      const snapshot = await buildProofSnapshot({
        repoRoot,
        changedFiles: ["src/deleted.ts", "src/unreadable.ts"],
        capturedAt: "2026-06-21T12:00:00.000Z",
        gitCommit: "abc123"
      });

      expect(snapshot.files).toContainEqual(
        expect.objectContaining({
          path: "src/deleted.ts",
          state: "deleted"
        })
      );
      expect(snapshot.files).toContainEqual(
        expect.objectContaining({
          path: "src/unreadable.ts",
          state: expect.stringMatching(/present|unreadable/)
        })
      );
    } finally {
      await chmod(join(repoRoot, "src", "unreadable.ts"), 0o600).catch(() => undefined);
      await readFile(join(repoRoot, "src", "unreadable.ts"), "utf8").catch(() => undefined);
    }
  });
});
