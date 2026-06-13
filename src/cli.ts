#!/usr/bin/env node
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { getRepositoryRoot } from "./core/git.js";
import { runDoctorCommand } from "./commands/doctor.js";
import { runInitCommand } from "./commands/init.js";
import { runReplayCommand } from "./commands/replay.js";
import { runReportCommand } from "./commands/report.js";
import { runResumeCommand } from "./commands/resume.js";
import { runStartCommand } from "./commands/start.js";
import { runStatusCommand } from "./commands/status.js";

export function createCli(): Command {
  const program = new Command();

  program
    .name("agentflight")
    .description("Local-first flight recorder for AI coding agents.")
    .version("0.1.0");

  program
    .command("init")
    .description("Initialise AgentFlight in this repository.")
    .action(async () => {
      await printResult(runInitCommand({ repoRoot: await getRepositoryRoot(process.cwd()) }));
    });

  program
    .command("start")
    .description("Start or resume an AI coding session.")
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
    .action(async () => {
      await printResult(runStatusCommand({ repoRoot: await getRepositoryRoot(process.cwd()) }));
    });

  program
    .command("report")
    .description("Generate a Markdown proof report for the current session.")
    .action(async () => {
      await printResult(runReportCommand({ repoRoot: await getRepositoryRoot(process.cwd()) }));
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

async function printResult(promise: Promise<{ output: string }>): Promise<void> {
  try {
    const result = await promise;
    console.log(result.output.trimEnd());
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

export function isDirectCliInvocation(metaUrl: string, argvPath: string | undefined): boolean {
  if (!argvPath) return false;
  return fileURLToPath(metaUrl) === resolve(argvPath);
}

if (isDirectCliInvocation(import.meta.url, process.argv[1])) {
  await createCli().parseAsync(process.argv);
}
