import { describe, expect, it } from "vitest";
import { parseGitStatusFiles } from "../../src/core/git.js";

describe("git status parsing", () => {
  it("preserves filenames from porcelain status output", () => {
    expect(parseGitStatusFiles("?? README.md\n M src/cli.ts\nR  old.ts -> new.ts\n")).toEqual([
      "README.md",
      "src/cli.ts",
      "new.ts"
    ]);
  });
});
