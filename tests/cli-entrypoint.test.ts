import { describe, expect, it } from "vitest";
import { createCli, isDirectCliInvocation } from "../src/cli.js";
import { mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createTempRepo } from "./helpers/temp.js";

describe("CLI entrypoint detection", () => {
  it("reports the package version", async () => {
    const packageJson = JSON.parse(await readFile("package.json", "utf8"));

    expect(createCli().version()).toBe(packageJson.version);
  });

  it("treats encoded file URLs and argv paths with spaces as the same entrypoint", () => {
    expect(
      isDirectCliInvocation(
        "file:///Users/example/local%20dev%20folder/Apps/AgentFlight/dist/cli.js",
        "/Users/example/local dev folder/Apps/AgentFlight/dist/cli.js"
      )
    ).toBe(true);
  });

  it("treats npm .bin symlinks as direct CLI invocations", async () => {
    const repoRoot = await createTempRepo("agentflight-bin-test-");
    const realCliPath = join(repoRoot, "node_modules", "agentflight", "dist", "cli.js");
    const binPath = join(repoRoot, "node_modules", ".bin", "agentflight");

    await mkdir(join(repoRoot, "node_modules", "agentflight", "dist"), { recursive: true });
    await mkdir(join(repoRoot, "node_modules", ".bin"), { recursive: true });
    await writeFile(realCliPath, "#!/usr/bin/env node\n");
    await symlink("../agentflight/dist/cli.js", binPath);

    expect(isDirectCliInvocation(pathToFileURL(realCliPath).href, binPath)).toBe(true);
  });
});
