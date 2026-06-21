import { loadConfig } from "../core/config.js";
import { readPackageJson } from "../core/project.js";
import { appendSessionEvent, appendVerificationRun } from "../core/session.js";
import {
  detectVerificationCommands,
  formatCommand,
  parseCommandLine,
  runVerificationCommand
} from "../core/verification.js";
import { readCurrentSession } from "./status.js";
import type { AgentFlightSession, VerificationRun } from "../types/index.js";
import type { CommandRunner } from "../core/process.js";

export interface VerifyCommandOptions {
  repoRoot: string;
  commandArgs?: string[] | undefined;
  profile?: string | undefined;
  now?: (() => Date) | undefined;
  commandRunner?: CommandRunner | undefined;
  heartbeatIntervalMs?: number | undefined;
  onHeartbeat?: ((message: string) => void) | undefined;
}

export interface VerifyCommandResult {
  output: string;
  exitCode: number;
  runs: VerificationRun[];
}

export async function runVerifyCommand(
  options: VerifyCommandOptions
): Promise<VerifyCommandResult> {
  const session = await readCurrentSession(options.repoRoot);
  const commandResolution = await resolveCommandSets(options);
  const resolutionError = buildResolutionErrorResult(commandResolution.error);
  if (resolutionError) return resolutionError;

  const missingCommand = buildMissingCommandResult(commandResolution);
  if (missingCommand) return missingCommand;

  const { output, runs } = await runResolvedVerificationCommands(
    options,
    session,
    commandResolution
  );

  return {
    output: `${output.join("\n")}\n`,
    exitCode: allRunsPassed(runs) ? 0 : 1,
    runs
  };
}

async function runResolvedVerificationCommands(
  options: VerifyCommandOptions,
  initialSession: AgentFlightSession,
  commandResolution: CommandSetResolution
): Promise<{ output: string[]; runs: VerificationRun[] }> {
  let session = initialSession;
  const output = buildVerificationOutputHeader(commandResolution.profileName);
  const runs: VerificationRun[] = [];
  const config = await loadConfig(options.repoRoot);
  const changedFileIgnore = config?.changedFileFilters?.ignore ?? [];

  for (const commandArgs of commandResolution.commandSets) {
    const result = await runSingleVerificationCommand(
      options,
      session,
      commandArgs,
      changedFileIgnore
    );
    session = result.session;
    runs.push(result.run);
    appendVerificationOutput(output, result.run);
  }

  return { output, runs };
}

function buildVerificationOutputHeader(profileName: string | undefined): string[] {
  const output: string[] = ["AgentFlight verification", ""];
  if (profileName) {
    output.push(`Profile: ${profileName}`);
    output.push("");
  }
  return output;
}

async function runSingleVerificationCommand(
  options: VerifyCommandOptions,
  session: AgentFlightSession,
  commandArgs: string[],
  changedFileIgnore: string[]
): Promise<{ session: AgentFlightSession; run: VerificationRun }> {
  const command = formatCommand(commandArgs);
  let updatedSession = await appendSessionEvent(options.repoRoot, session, {
    type: "verification_started",
    timestamp: options.now?.() ?? new Date(),
    title: "Verification started",
    metadata: { command }
  });

  const run = await runWithHeartbeat(
    runVerificationCommand({
      repoRoot: options.repoRoot,
      session: updatedSession,
      commandArgs,
      now: options.now,
      commandRunner: options.commandRunner,
      changedFileIgnore
    }),
    options
  );
  updatedSession = await appendVerificationRun(options.repoRoot, updatedSession, run);
  updatedSession = await appendSessionEvent(options.repoRoot, updatedSession, {
    type: run.status === "passed" ? "verification_passed" : "verification_failed",
    timestamp: run.finishedAt,
    title: run.status === "passed" ? "Verification passed" : "Verification failed",
    metadata: {
      command: run.command,
      exitCode: run.exitCode,
      stdoutPath: run.stdoutPath,
      stderrPath: run.stderrPath
    }
  });

  return { session: updatedSession, run };
}

function appendVerificationOutput(output: string[], run: VerificationRun): void {
  output.push(`${run.status}: ${run.command}`);
  output.push("Evidence saved:");
  output.push(`- stdout: ${run.stdoutPath}`);
  output.push(`- stderr: ${run.stderrPath}`);

  if (run.outputExcerpt) {
    output.push(run.outputExcerpt);
  }

  if (run.status === "failed") {
    output.push(`Next action: fix the command, then rerun agentflight verify -- ${run.command}`);
  }
}

function allRunsPassed(runs: VerificationRun[]): boolean {
  return runs.every((run) => run.status === "passed");
}

function buildResolutionErrorResult(error: string | undefined): VerifyCommandResult | null {
  if (!error) return null;
  return {
    output: `AgentFlight verify

${error}
`,
    exitCode: 1,
    runs: []
  };
}

function buildMissingCommandResult(
  commandResolution: CommandSetResolution
): VerifyCommandResult | null {
  if (commandResolution.commandSets.length > 0) return null;
  const suggestedCommands = commandResolution.suggestedCommands ?? [];
  const suggestions =
    suggestedCommands.length > 0
      ? `

Try one of:
${suggestedCommands.map((command) => `- agentflight verify -- ${command}`).join("\n")}

To make this the default, add commands under verification.commands in .agentflight/config.json.`
      : "";
  return {
    output: `AgentFlight verify

No verification command was provided and no commands are configured in .agentflight/config.json.${suggestions}
`,
    exitCode: 1,
    runs: []
  };
}

async function runWithHeartbeat(
  promise: Promise<VerificationRun>,
  options: VerifyCommandOptions
): Promise<VerificationRun> {
  const onHeartbeat = options.onHeartbeat;
  if (!onHeartbeat) return promise;

  const intervalMs = options.heartbeatIntervalMs ?? 30_000;
  if (intervalMs <= 0) return promise;

  const startedAt = Date.now();
  const timer = setInterval(() => {
    const elapsedSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    onHeartbeat(`AgentFlight verify still running after ${elapsedSeconds}s...`);
  }, intervalMs);
  timer.unref?.();

  try {
    return await promise;
  } finally {
    clearInterval(timer);
  }
}

interface CommandSetResolution {
  commandSets: string[][];
  profileName?: string | undefined;
  error?: string | undefined;
  suggestedCommands?: string[] | undefined;
}

async function resolveCommandSets(options: VerifyCommandOptions): Promise<CommandSetResolution> {
  const profile = normalizeProfileOption(options.profile);
  if (profile.error) return { commandSets: [], error: profile.error };

  if (profile.name && hasExplicitCommandArgs(options)) {
    return {
      commandSets: [],
      error: "Cannot combine --profile with an explicit verification command."
    };
  }

  if (hasExplicitCommandArgs(options)) {
    return { commandSets: [options.commandArgs] };
  }

  const config = await loadConfig(options.repoRoot);

  if (profile.name) {
    return resolveProfileCommandSets(config?.verification, profile.name);
  }

  return resolveConfiguredCommandSets(options.repoRoot, config?.verification.commands);
}

function hasExplicitCommandArgs(options: VerifyCommandOptions): options is VerifyCommandOptions & {
  commandArgs: string[];
} {
  return Array.isArray(options.commandArgs) && options.commandArgs.length > 0;
}

function normalizeProfileOption(profile: string | undefined): { name?: string; error?: string } {
  const name = profile?.trim();
  if (profile !== undefined && !name)
    return { error: "Verification profile name cannot be empty." };
  return name ? { name } : {};
}

async function resolveConfiguredCommandSets(
  repoRoot: string,
  commands: string[] | undefined
): Promise<CommandSetResolution> {
  const commandSets = parseConfiguredCommands(commands ?? []);
  if (commandSets.length > 0) return { commandSets };

  return {
    commandSets,
    suggestedCommands: detectVerificationCommands(await readPackageJson(repoRoot))
  };
}

function resolveProfileCommandSets(
  verification: unknown,
  profileName: string
): CommandSetResolution {
  const profile = readProfileCommands(verification, profileName);
  if (profile.status === "unknown") return unknownProfile(profileName);
  if (profile.status === "invalid") {
    return {
      commandSets: [],
      error: `Verification profile ${profileName} is invalid. Expected an array of command strings in .agentflight/config.json.`
    };
  }

  const commandSets = parseConfiguredCommands(profile.commands);
  if (commandSets.length === 0) {
    return {
      commandSets: [],
      error: `Verification profile ${profileName} is empty. Add at least one command string in .agentflight/config.json.`
    };
  }

  return { commandSets, profileName };
}

type ProfileCommands =
  | { status: "found"; commands: string[] }
  | { status: "unknown" }
  | { status: "invalid" };

function readProfileCommands(verification: unknown, profileName: string): ProfileCommands {
  if (!verification || typeof verification !== "object") return { status: "unknown" };

  const profiles = (verification as { profiles?: unknown }).profiles;
  if (!isProfileRecord(profiles)) return { status: "unknown" };

  const profile = profiles[profileName];
  if (profile === undefined) return { status: "unknown" };
  if (!isStringArray(profile)) return { status: "invalid" };

  return { status: "found", commands: profile };
}

function isProfileRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((command) => typeof command === "string");
}

function parseConfiguredCommands(commands: string[]): string[][] {
  return commands.map((command) => parseCommandLine(command)).filter((args) => args.length > 0);
}

function unknownProfile(profileName: string): CommandSetResolution {
  return {
    commandSets: [],
    error: `Verification profile ${profileName} was not found in .agentflight/config.json.`
  };
}
