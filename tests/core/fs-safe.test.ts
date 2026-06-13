import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTempRepo } from "../helpers/temp.js";
import { writeJsonFileSafe, writeTextFileSafe } from "../../src/core/fs-safe.js";

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
});
