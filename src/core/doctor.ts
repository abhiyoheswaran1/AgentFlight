import type { DoctorCheck, DoctorResult } from "../types/index.js";

export interface DoctorEvaluationInput {
  nodeVersion: string;
  npmVersion: string | null;
  gitAvailable: boolean;
  packageManager: string | null;
  repoRoot: string | null;
  agentFlightExists: boolean;
  configValid: boolean;
  writable: boolean;
  currentSessionExists: boolean;
  projscanAvailable: boolean;
  agentloopkitAvailable: boolean;
  configuredVerificationCommands?: number | undefined;
  detectedVerificationCommands?: string[] | undefined;
  projscanMemoryPresent?: boolean | undefined;
  projscanMemoryIgnored?: boolean | undefined;
  scripts: {
    test: boolean;
    build: boolean;
    typecheck: boolean;
    lint: boolean;
  };
}

export function evaluateDoctorChecks(input: DoctorEvaluationInput): DoctorResult {
  const checks: DoctorCheck[] = [];
  const nodeMajor = parseNodeMajor(input.nodeVersion);

  checks.push(
    nodeMajor >= 20
      ? ok("Node.js version", `${input.nodeVersion} satisfies AgentFlight's Node.js 20+ target.`)
      : error(
          "Node.js version",
          `${input.nodeVersion} is below AgentFlight's Node.js 20+ target.`,
          "Install Node.js 20 or newer."
        )
  );

  checks.push(
    input.npmVersion
      ? ok("npm availability", `npm ${input.npmVersion} is available.`)
      : error("npm availability", "npm is not available.", "Install npm with Node.js 20 or newer.")
  );

  checks.push(
    input.gitAvailable
      ? ok("git availability", "git is available.")
      : warning(
          "git availability",
          "git is not available or this repo cannot run git commands.",
          "Install git or run AgentFlight inside a git repository."
        )
  );

  checks.push(
    input.repoRoot
      ? ok("repository root", "Repository root detected.")
      : error(
          "repository root",
          "Unable to determine repository root.",
          "Run AgentFlight from inside a git repository or project directory."
        )
  );

  checks.push(
    input.packageManager
      ? ok("package manager", input.packageManager)
      : warning(
          "package manager",
          "No package manager lockfile was detected.",
          "Run npm install or add a package manager lockfile."
        )
  );

  checks.push(
    input.agentFlightExists
      ? ok(".agentflight presence", ".agentflight exists.")
      : warning(
          ".agentflight presence",
          ".agentflight has not been initialized.",
          "Run agentflight init."
        )
  );

  checks.push(
    input.configValid
      ? ok("config validity", ".agentflight/config.json is valid.")
      : error(
          "config validity",
          ".agentflight/config.json is missing or invalid.",
          "Run agentflight init or fix config.json."
        )
  );

  checks.push(
    input.writable
      ? ok(".agentflight writable", ".agentflight is writable.")
      : error(
          ".agentflight writable",
          ".agentflight is not writable.",
          "Check filesystem permissions."
        )
  );

  checks.push(
    input.currentSessionExists
      ? ok("current session", "A current session exists.")
      : ok(
          "current session",
          'No current session is active. Run agentflight start --task "..." when you begin work.'
        )
  );

  checks.push(
    input.projscanAvailable
      ? ok("ProjScan availability", "ProjScan is available.")
      : warning(
          "ProjScan availability",
          "ProjScan is not currently available.",
          "Install projscan locally or allow AgentFlight to use npx projscan@latest."
        )
  );

  checks.push(
    input.agentloopkitAvailable
      ? ok("AgentLoopKit availability", "AgentLoopKit is available.")
      : warning(
          "AgentLoopKit availability",
          "AgentLoopKit is not currently available.",
          "Install agentloopkit locally or allow AgentFlight to use npx agentloopkit@latest."
        )
  );

  if (input.configuredVerificationCommands !== undefined) {
    checks.push(verificationCommandsCheck(input));
  }

  if (input.projscanMemoryPresent) {
    checks.push(
      input.projscanMemoryIgnored
        ? ok(
            "generated tool state",
            ".projscan-memory/memory.json is filtered by changedFileFilters.ignore."
          )
        : warning(
            "generated tool state",
            ".projscan-memory/memory.json is present and remains reviewable.",
            'If ProjScan memory is generated evidence in this repo, add ".projscan-memory/**" to changedFileFilters.ignore in .agentflight/config.json.'
          )
    );
  }

  for (const script of ["test", "build", "typecheck", "lint"] as const) {
    checks.push(
      input.scripts[script]
        ? ok(`${script} script`, `npm run ${script} is configured.`)
        : warning(
            `${script} script`,
            `npm run ${script} is not configured.`,
            `Add a ${script} script to package.json.`
          )
    );
  }

  return {
    status: checks.some((check) => check.status === "error")
      ? "error"
      : checks.some((check) => check.status === "warning")
        ? "warning"
        : "ok",
    checks
  };
}

function verificationCommandsCheck(input: DoctorEvaluationInput): DoctorCheck {
  const count = Math.max(0, input.configuredVerificationCommands ?? 0);
  if (count > 0) {
    return ok(
      "verification commands",
      `.agentflight/config.json has ${count} configured verification ${count === 1 ? "command" : "commands"}.`
    );
  }

  if (hasPackageProofScript(input.scripts)) {
    return warning(
      "verification commands",
      ".agentflight/config.json has no configured verification commands, but package proof scripts are available.",
      buildVerificationCommandsSuggestedFix(input.detectedVerificationCommands)
    );
  }

  return ok(
    "verification commands",
    "No configured verification commands and no package proof scripts detected."
  );
}

function hasPackageProofScript(input: DoctorEvaluationInput["scripts"]): boolean {
  return input.test || input.build || input.typecheck || input.lint;
}

function buildVerificationCommandsSuggestedFix(commands: string[] | undefined): string {
  const suggestions = (commands ?? [])
    .filter((command) => command.trim().length > 0)
    .slice(0, 4)
    .map((command) => `agentflight verify -- ${command}`);

  if (suggestions.length === 0) {
    return "Add commands under verification.commands or run agentflight verify -- <command> explicitly.";
  }

  return [
    "Try one of:",
    ...suggestions.map((suggestion) => `- ${suggestion}`),
    "To make one command the default, add it under verification.commands."
  ].join("\n");
}

function parseNodeMajor(version: string): number {
  const match = /^v?(\d+)/.exec(version);
  return match ? Number(match[1]) : 0;
}

function ok(name: string, message: string): DoctorCheck {
  return { name, status: "ok", message };
}

function warning(name: string, message: string, suggestedFix?: string): DoctorCheck {
  return suggestedFix
    ? { name, status: "warning", message, suggestedFix }
    : { name, status: "warning", message };
}

function error(name: string, message: string, suggestedFix?: string): DoctorCheck {
  return suggestedFix
    ? { name, status: "error", message, suggestedFix }
    : { name, status: "error", message };
}
