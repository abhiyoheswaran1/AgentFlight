#!/usr/bin/env node
import { readFileSync, realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { getRepositoryRoot } from "./core/git.js";
import { runDoctorCommand } from "./commands/doctor.js";
import { runHandoffCommand } from "./commands/handoff.js";
import { runHistoryCommand } from "./commands/history.js";
import { runInitCommand } from "./commands/init.js";
import { runReplayCommand } from "./commands/replay.js";
import { runReportCommand } from "./commands/report.js";
import { runResumeCommand } from "./commands/resume.js";
import { runSnapshotCommand } from "./commands/snapshot.js";
import { runStartCommand } from "./commands/start.js";
import { runStatusCommand } from "./commands/status.js";
import { runVerifyCommand } from "./commands/verify.js";

export function createCli(): Command {
  const program = new Command();

  program
    .name("agentflight")
    .description("Local-first review layer for coding agent sessions.")
    .version(readPackageVersion());

  program
    .command("init")
    .description("Initialise AgentFlight in this repository.")
    .action(async () => {
      await printResult(runInitCommand({ repoRoot: await getRepositoryRoot(process.cwd()) }));
    });

  program
    .command("start")
    .description("Start or resume a coding agent session.")
    .requiredOption("--task <task>", "task title")
    .option("-y, --yes", "initialise safely if AgentFlight is missing")
    .action(async (options: { task: string; yes?: boolean }) => {
      await printResult(
        runStartCommand({
          repoRoot: await getRepositoryRoot(process.cwd()),
          task: options.task,
          yes: options.yes
        })
      );
    });

  program
    .command("status")
    .description("Show what changed since the session started.")
    .option("--format <format>", "status output format: text or json", "text")
    .action(async (options: { format?: string }) => {
      await printResult(
        runStatusCommand({
          repoRoot: await getRepositoryRoot(process.cwd()),
          format: options.format
        })
      );
    });

  program
    .command("verify")
    .description("Run verification and capture local evidence for the current session.")
    .option("--profile <name>", "run a named verification profile from .agentflight/config.json")
    .allowUnknownOption(true)
    .allowExcessArguments(true)
    .argument("[command...]", "verification command to run after --")
    .action(async (commandArgs: string[], options: { profile?: string }) => {
      await printResult(
        runVerifyCommand({
          repoRoot: await getRepositoryRoot(process.cwd()),
          commandArgs,
          profile: options.profile,
          onHeartbeat: (message) => console.log(message)
        })
      );
    });

  program
    .command("snapshot")
    .description("Record a timeline snapshot for the current session.")
    .option("--note <note>", "short snapshot note")
    .action(async (options: { note?: string }) => {
      await printResult(
        runSnapshotCommand({
          repoRoot: await getRepositoryRoot(process.cwd()),
          note: options.note
        })
      );
    });

  program
    .command("report")
    .description("Generate a Markdown proof report for the current session.")
    .option("--mode <mode>", "Markdown report mode: full, compact, or pr-comment", "full")
    .action(async (options: { mode?: string }) => {
      await printResult(
        runReportCommand({ repoRoot: await getRepositoryRoot(process.cwd()), mode: options.mode })
      );
    });

  program
    .command("replay")
    .description("Generate a local HTML replay of the current session.")
    .action(async () => {
      await printResult(runReplayCommand({ repoRoot: await getRepositoryRoot(process.cwd()) }));
    });

  program
    .command("resume")
    .description("Generate a prompt to continue the current session safely.")
    .action(async () => {
      await printResult(runResumeCommand({ repoRoot: await getRepositoryRoot(process.cwd()) }));
    });

  program
    .command("handoff")
    .description("Generate a local review handoff for the current session.")
    .action(async () => {
      await printResult(runHandoffCommand({ repoRoot: await getRepositoryRoot(process.cwd()) }));
    });

  program
    .command("history")
    .description("List recent local AgentFlight sessions.")
    .option("--limit <count>", "number of recent sessions to show")
    .option("--task <text>", "filter sessions by task title text")
    .option(
      "--state <state>",
      "filter sessions by state: ready, blocked, needs_verification, unknown, current"
    )
    .action(async (options: { limit?: string; task?: string; state?: string }) => {
      await printResult(
        runHistoryCommand({
          repoRoot: await getRepositoryRoot(process.cwd()),
          limit: options.limit === undefined ? undefined : Number(options.limit),
          task: options.task,
          state: options.state
        })
      );
    });

  program
    .command("doctor")
    .description("Check whether AgentFlight is correctly configured.")
    .action(async () => {
      await printResult(runDoctorCommand({ repoRoot: await getRepositoryRoot(process.cwd()) }));
    });

  for (const commandName of ["upgrade", "license", "login"]) {
    program
      .command(commandName)
      .description("Future AgentFlight Pro/Team placeholder.")
      .action(() => {
        console.log("AgentFlight Pro/Team is not available yet.");
      });
  }

  return program;
}

async function printResult(promise: Promise<{ output: string; exitCode?: number }>): Promise<void> {
  try {
    const result = await promise;
    console.log(result.output.trimEnd());
    if (result.exitCode !== undefined) {
      process.exitCode = result.exitCode;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

export function isDirectCliInvocation(metaUrl: string, argvPath: string | undefined): boolean {
  if (!argvPath) return false;
  return normalizeCliPath(fileURLToPath(metaUrl)) === normalizeCliPath(argvPath);
}

function normalizeCliPath(path: string): string {
  const resolved = resolve(path);
  try {
    return realpathSync(resolved);
  } catch {
    return resolved;
  }
}

function readPackageVersion(): string {
  const packagePath = resolve(dirname(fileURLToPath(import.meta.url)), "..", "package.json");

  try {
    const packageJson = JSON.parse(readFileSync(packagePath, "utf8")) as { version?: unknown };
    return typeof packageJson.version === "string" ? packageJson.version : "0.0.0";
  } catch {
    return "0.0.0";
  }
}

if (isDirectCliInvocation(import.meta.url, process.argv[1])) {
  await createCli().parseAsync(process.argv);
}
