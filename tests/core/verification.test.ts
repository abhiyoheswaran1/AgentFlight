import { describe, expect, it } from "vitest";
import { detectVerificationCommands } from "../../src/core/verification.js";

describe("verification command detection", () => {
  it("prefers typecheck, lint, test, and build scripts when present", () => {
    expect(
      detectVerificationCommands({
        scripts: {
          test: "vitest run",
          build: "tsc -p tsconfig.build.json",
          typecheck: "tsc --noEmit",
          lint: "eslint .",
          dev: "tsx src/cli.ts"
        }
      })
    ).toEqual(["npm run typecheck", "npm run lint", "npm test", "npm run build"]);
  });

  it("returns an empty list when no proof scripts exist", () => {
    expect(detectVerificationCommands({ scripts: { dev: "tsx src/cli.ts" } })).toEqual([]);
  });
});
