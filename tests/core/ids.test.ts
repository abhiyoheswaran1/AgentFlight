import { describe, expect, it } from "vitest";
import { safeAnchorId, stableAnchorId } from "../../src/core/ids.js";

describe("anchor ids", () => {
  it("keeps simple safe ids readable", () => {
    expect(safeAnchorId("Proof gap: auth contract")).toBe("proof-gap-auth-contract");
  });

  it("uses collision-safe ids when punctuation changes meaning", () => {
    expect(stableAnchorId("src/a_b.ts")).toBe("src-1b-a-2n-b-1a-ts");
    expect(stableAnchorId("src/a-b.ts")).toBe("src-1b-a-19-b-1a-ts");
  });

  it("normalizes slash direction before encoding paths", () => {
    expect(stableAnchorId("src\\core\\session.ts")).toBe("src-1b-core-1b-session-1a-ts");
  });
});
