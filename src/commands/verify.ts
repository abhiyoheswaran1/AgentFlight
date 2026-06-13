import { loadConfig } from "../core/config.js";
import { appendVerificationRun } from "../core/session.js";
import {
  parseCommandLine,
  readVerificationStdout,
  runVerificationCommand
} from "../core/verification.js";
import { readCurrentSession } from "./status.js";
import type { VerificationRun } from "../types/index.js";

export interface VerifyCommandOptions {
  repoRoot: string;
  commandArgs?: string[] | undefined;
  now?: (() => Date) | undefined;
}

export interface VerifyCommandResult {
  output: string;
  exitCode: number;
  runs: VerificationRun[];
}

export async function runVerifyCommand(
  options: VerifyCommandOptions
): Promise<VerifyCommandResult> {
  let session = await readCurrentSession(options.repoRoot);
  const commandSets = await resolveCommandSets(options);

  if (commandSets.length === 0) {
    return {
      output: `AgentFlight verify

No verification command was provided and no commands are configured in .agentflight/config.json.
`,
      exitCode: 1,
      runs: []
    };
  }

  const output: string[] = ["AgentFlight verification", ""];
  const runs: VerificationRun[] = [];

  for (const commandArgs of commandSets) {
    const run = await runVerificationCommand({
      repoRoot: options.repoRoot,
      session,
      commandArgs,
      now: options.now
    });
    session = await appendVerificationRun(options.repoRoot, session, run);
    runs.push(run);

    output.push(`${run.status}: ${run.command}`);

    const stdout = await readVerificationStdout(options.repoRoot, run);
    if (stdout.trim().length > 0) {
      output.push(stdout.trimEnd());
    }
  }

  return {
    output: `${output.join("\n")}\n`,
    exitCode: runs.every((run) => run.status === "passed") ? 0 : 1,
    runs
  };
}

async function resolveCommandSets(options: VerifyCommandOptions): Promise<string[][]> {
  if (options.commandArgs && options.commandArgs.length > 0) {
    return [options.commandArgs];
  }

  const config = await loadConfig(options.repoRoot);
  return (config?.verification.commands ?? [])
    .map((command) => parseCommandLine(command))
    .filter((args) => args.length > 0);
}
