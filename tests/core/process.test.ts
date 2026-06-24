import { describe, expect, it } from "vitest";
import { runCommand } from "../../src/core/process.js";

describe("process runner", () => {
  it("does not fail a passing command that writes more than one MiB", async () => {
    const result = await runCommand(process.execPath, [
      "-e",
      "process.stdout.write('x'.repeat(2 * 1024 * 1024));"
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toHaveLength(2 * 1024 * 1024);
    expect(result.stderr).toBe("");
  });
});
