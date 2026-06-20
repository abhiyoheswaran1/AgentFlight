import { chmod, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTempRepo } from "../helpers/temp.js";
import {
  ensureDir,
  isPathWritable,
  readJsonFile,
  writeJsonFileSafe,
  writeTextFileSafe
} from "../../src/core/fs-safe.js";

describe("safe file writes", () => {
  it("does not overwrite JSON files unless explicitly allowed", async () => {
    const repoRoot = await createTempRepo();
    const target = join(repoRoot, "config.json");

    await expect(writeJsonFileSafe(target, { value: "first" })).resolves.toMatchObject({
      status: "created"
    });

    await expect(writeJsonFileSafe(target, { value: "second" })).resolves.toMatchObject({
      status: "skipped"
    });

    expect(JSON.parse(await readFile(target, "utf8"))).toEqual({ value: "first" });

    await expect(
      writeJsonFileSafe(target, { value: "second" }, { overwrite: true })
    ).resolves.toMatchObject({ status: "overwritten" });

    expect(JSON.parse(await readFile(target, "utf8"))).toEqual({ value: "second" });
  });

  it("creates parent directories for text writes", async () => {
    const repoRoot = await createTempRepo();
    const target = join(repoRoot, "nested", "handoff.md");

    await expect(writeTextFileSafe(target, "hello")).resolves.toMatchObject({
      status: "created"
    });

    expect(await readFile(target, "utf8")).toBe("hello");
  });

  it("checks write permission instead of only existence", async () => {
    const repoRoot = await createTempRepo();
    const target = join(repoRoot, ".agentflight");
    await ensureDir(target);
    await chmod(target, 0o555);

    try {
      await expect(isPathWritable(target)).resolves.toBe(false);
    } finally {
      await chmod(target, 0o755);
    }
  });

  it("keeps JSON readable while overwrite writes are in flight", async () => {
    const repoRoot = await createTempRepo();
    const target = join(repoRoot, ".agentflight", "current", "session.json");

    await writeJsonFileSafe(target, { version: 0, payload: "a".repeat(512_000) });

    let reading = true;
    const parseErrors: string[] = [];
    const reader = (async () => {
      while (reading) {
        try {
          await readJsonFile(target);
        } catch (error) {
          parseErrors.push(error instanceof Error ? error.message : String(error));
        }
      }
    })();

    for (let index = 1; index <= 40; index += 1) {
      await writeJsonFileSafe(
        target,
        { version: index, payload: String(index % 10).repeat(1_500_000) },
        { overwrite: true }
      );
    }

    reading = false;
    await reader;

    expect(parseErrors).toEqual([]);
  });
});
