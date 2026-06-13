import { describe, expect, it } from "vitest";
import { evaluateDoctorChecks } from "../../src/core/doctor.js";

describe("doctor checks", () => {
  it("reports actionable warnings for missing optional proof scripts and tools", () => {
    const result = evaluateDoctorChecks({
      nodeVersion: "v20.11.0",
      npmVersion: "10.5.0",
      gitAvailable: true,
      packageManager: "npm",
      repoRoot: "/repo",
      agentFlightExists: true,
      configValid: true,
      writable: true,
      currentSessionExists: false,
      projscanAvailable: false,
      agentloopkitAvailable: true,
      scripts: { test: true, build: false, typecheck: false, lint: false }
    });

    expect(result.status).toBe("warning");
    expect(result.checks).toContainEqual(
      expect.objectContaining({
        name: "ProjScan availability",
        status: "warning",
        suggestedFix: "Install projscan locally or allow AgentFlight to use npx projscan@latest."
      })
    );
    expect(result.checks).toContainEqual(
      expect.objectContaining({
        name: "build script",
        status: "warning"
      })
    );
  });

  it("reports an error when Node is below version 20", () => {
    const result = evaluateDoctorChecks({
      nodeVersion: "v18.20.0",
      npmVersion: "10.5.0",
      gitAvailable: true,
      packageManager: "npm",
      repoRoot: "/repo",
      agentFlightExists: true,
      configValid: true,
      writable: true,
      currentSessionExists: true,
      projscanAvailable: true,
      agentloopkitAvailable: true,
      scripts: { test: true, build: true, typecheck: true, lint: true }
    });

    expect(result.status).toBe("error");
    expect(result.checks).toContainEqual(
      expect.objectContaining({
        name: "Node.js version",
        status: "error"
      })
    );
  });
});
