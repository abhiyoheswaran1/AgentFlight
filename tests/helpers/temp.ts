import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export async function createTempRepo(prefix = "agentflight-test-"): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix));
}
