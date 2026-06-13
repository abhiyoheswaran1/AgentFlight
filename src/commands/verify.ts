import { loadConfig } from "../core/config.js";
import { appendSessionEvent, appendVerificationRun } from "../core/session.js";
import {
  formatCommand,
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
    const command = formatCommand(commandArgs);
    session = await appendSessionEvent(options.repoRoot, session, {
      type: "verification_started",
      timestamp: options.now?.() ?? new Date(),
      title: "Verification started",
      metadata: { command }
    });

    const run = await runVerificationCommand({
      repoRoot: options.repoRoot,
      session,
      commandArgs,
      now: options.now
    });
    session = await appendVerificationRun(options.repoRoot, session, run);
    session = await appendSessionEvent(options.repoRoot, session, {
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
    runs.push(run);

    output.push(`${run.status}: ${run.command}`);
    output.push("Evidence saved:");
    output.push(`- stdout: ${run.stdoutPath}`);
    output.push(`- stderr: ${run.stderrPath}`);

    const stdout = await readVerificationStdout(options.repoRoot, run);
    if (stdout.trim().length > 0) {
      output.push(stdout.trimEnd());
    }

    if (run.status === "failed") {
      output.push(`Next action: fix the command, then rerun agentflight verify -- ${run.command}`);
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
