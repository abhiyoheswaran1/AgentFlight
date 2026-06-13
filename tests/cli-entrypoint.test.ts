import { describe, expect, it } from "vitest";
import { isDirectCliInvocation } from "../src/cli.js";

describe("CLI entrypoint detection", () => {
  it("treats encoded file URLs and argv paths with spaces as the same entrypoint", () => {
    expect(
      isDirectCliInvocation(
        "file:///Users/example/local%20dev%20folder/Apps/AgentFlight/dist/cli.js",
        "/Users/example/local dev folder/Apps/AgentFlight/dist/cli.js"
      )
    ).toBe(true);
  });
});
