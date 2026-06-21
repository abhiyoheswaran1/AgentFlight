import { pathExists } from "./fs-safe.js";
import { formatRepoRelativePath, resolveAgentFlightPaths } from "./paths.js";
import type { ReviewReadinessState } from "../types/index.js";

export interface ReviewArtifacts {
  handoff: string;
  report: string;
  replay: string;
  resume: string;
}

type PrimaryArtifact = "handoff" | "report" | "replay";

export async function readReviewArtifacts(
  repoRoot: string,
  sessionId: string
): Promise<ReviewArtifacts> {
  return {
    handoff: await formatArtifactPath(repoRoot, sessionId, "handoff.md"),
    report: await formatArtifactPath(repoRoot, sessionId, "proof.md"),
    replay: await formatArtifactPath(repoRoot, sessionId, "replay.html"),
    resume: await formatArtifactPath(repoRoot, sessionId, "resume.md")
  };
}

export async function readOpenFirstArtifact(
  repoRoot: string,
  sessionId: string,
  readiness: ReviewReadinessState | undefined
): Promise<string | null> {
  const artifacts = await readReviewArtifacts(repoRoot, sessionId);
  const openFirst = chooseOpenFirstArtifact(readiness, artifacts);
  return openFirst === "none yet" ? null : openFirst;
}

export function chooseOpenFirstArtifact(
  readiness: ReviewReadinessState | undefined,
  artifacts: ReviewArtifacts
): string {
  if (readiness === "ready_for_review") {
    return formatOpenFirstArtifact(
      firstExistingArtifact(["handoff", "replay", "report"], artifacts),
      artifacts
    );
  }

  if (readiness) {
    return formatOpenFirstArtifact(
      firstExistingArtifact(["report", "handoff", "replay"], artifacts),
      artifacts
    );
  }

  return formatOpenFirstArtifact(
    firstExistingArtifact(["handoff", "replay", "report"], artifacts),
    artifacts
  );
}

function firstExistingArtifact(
  order: PrimaryArtifact[],
  artifacts: ReviewArtifacts
): PrimaryArtifact | null {
  return order.find((artifact) => artifacts[artifact] !== "missing") ?? null;
}

function formatOpenFirstArtifact(
  artifact: PrimaryArtifact | null,
  artifacts: ReviewArtifacts
): string {
  if (!artifact) return "none yet";
  return `${artifact} ${artifacts[artifact]}`;
}

async function formatArtifactPath(
  repoRoot: string,
  sessionId: string,
  suffix: "handoff.md" | "proof.md" | "replay.html" | "resume.md"
): Promise<string> {
  const artifactPath = `${resolveAgentFlightPaths(repoRoot).reports}/${sessionId}-${suffix}`;
  return (await pathExists(artifactPath))
    ? formatRepoRelativePath(repoRoot, artifactPath)
    : "missing";
}
