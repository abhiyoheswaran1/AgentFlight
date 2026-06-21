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

  it("uses path-safe wording when repository root is detected", () => {
    const result = evaluateDoctorChecks({
      nodeVersion: "v20.11.0",
      npmVersion: "10.5.0",
      gitAvailable: true,
      packageManager: "npm",
      repoRoot: "/Users/alice/local/private-app",
      agentFlightExists: true,
      configValid: true,
      writable: true,
      currentSessionExists: true,
      projscanAvailable: true,
      agentloopkitAvailable: true,
      scripts: { test: true, build: true, typecheck: true, lint: true }
    });

    expect(result.checks).toContainEqual(
      expect.objectContaining({
        name: "repository root",
        status: "ok",
        message: "Repository root detected."
      })
    );
    expect(result.checks).not.toContainEqual(
      expect.objectContaining({
        name: "repository root",
        message: "/Users/alice/local/private-app"
      })
    );
  });

  it("keeps missing repository root errors actionable", () => {
    const result = evaluateDoctorChecks({
      nodeVersion: "v20.11.0",
      npmVersion: "10.5.0",
      gitAvailable: false,
      packageManager: "npm",
      repoRoot: null,
      agentFlightExists: true,
      configValid: true,
      writable: true,
      currentSessionExists: true,
      projscanAvailable: true,
      agentloopkitAvailable: true,
      scripts: { test: true, build: true, typecheck: true, lint: true }
    });

    expect(result.checks).toContainEqual(
      expect.objectContaining({
        name: "repository root",
        status: "error",
        message: "Unable to determine repository root.",
        suggestedFix: "Run AgentFlight from inside a git repository or project directory."
      })
    );
  });

  it("warns when generated ProjScan memory is present but not filtered", () => {
    const result = evaluateDoctorChecks({
      nodeVersion: "v20.11.0",
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
      projscanMemoryPresent: true,
      projscanMemoryIgnored: false,
      scripts: { test: true, build: true, typecheck: true, lint: true }
    });

    expect(result.status).toBe("warning");
    expect(result.checks).toContainEqual(
      expect.objectContaining({
        name: "generated tool state",
        status: "warning",
        message: ".projscan-memory/memory.json is present and remains reviewable.",
        suggestedFix:
          'If ProjScan memory is generated evidence in this repo, add ".projscan-memory/**" to changedFileFilters.ignore in .agentflight/config.json.'
      })
    );
  });

  it("reports OK when generated ProjScan memory is already filtered", () => {
    const result = evaluateDoctorChecks({
      nodeVersion: "v20.11.0",
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
      projscanMemoryPresent: true,
      projscanMemoryIgnored: true,
      scripts: { test: true, build: true, typecheck: true, lint: true }
    });

    expect(result.status).toBe("ok");
    expect(result.checks).toContainEqual(
      expect.objectContaining({
        name: "generated tool state",
        status: "ok",
        message: ".projscan-memory/memory.json is filtered by changedFileFilters.ignore."
      })
    );
  });
});
