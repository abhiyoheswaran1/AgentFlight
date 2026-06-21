import type { VerificationRun } from "../types/index.js";

interface CommandParseState {
  args: string[];
  current: string;
  quote: "'" | '"' | null;
  escaping: boolean;
}

export function parseCommandLine(command: string): string[] {
  const state: CommandParseState = {
    args: [],
    current: "",
    quote: null,
    escaping: false
  };

  for (const char of command) {
    consumeCommandChar(state, char);
  }

  finishCommandParse(state);

  return state.args;
}

export function normalizeCommandString(command: string): string {
  const parsed = parseCommandLine(command);
  return parsed.length > 0 ? formatCommand(parsed) : command.trim();
}

export function getUnresolvedFailedRuns(runs: VerificationRun[]): VerificationRun[] {
  const laterPassedCommands = new Set<string>();
  const unresolved: VerificationRun[] = [];

  for (let index = runs.length - 1; index >= 0; index -= 1) {
    const run = runs[index];
    if (!run) continue;

    const command = normalizeCommandString(run.command);
    if (run.status === "passed") {
      laterPassedCommands.add(command);
      continue;
    }

    if (!laterPassedCommands.has(command)) {
      unresolved.unshift(run);
    }
  }

  return unresolved;
}

export function formatCommand(args: string[]): string {
  return args.map(formatCommandArg).join(" ");
}

function formatCommandArg(arg: string): string {
  if (/^[A-Za-z0-9_./:=@+-]+$/.test(arg)) return arg;
  return JSON.stringify(arg);
}

function consumeCommandChar(state: CommandParseState, char: string): void {
  if (consumeEscapedChar(state, char)) return;
  if (beginEscape(state, char)) return;
  if (consumeQuotedChar(state, char)) return;
  if (beginQuote(state, char)) return;
  if (consumeWhitespace(state, char)) return;

  state.current += char;
}

function consumeEscapedChar(state: CommandParseState, char: string): boolean {
  if (!state.escaping) return false;
  state.current += char;
  state.escaping = false;
  return true;
}

function beginEscape(state: CommandParseState, char: string): boolean {
  if (char !== "\\") return false;
  state.escaping = true;
  return true;
}

function consumeQuotedChar(state: CommandParseState, char: string): boolean {
  if (!state.quote) return false;
  if (char === state.quote) {
    state.quote = null;
  } else {
    state.current += char;
  }
  return true;
}

function beginQuote(state: CommandParseState, char: string): boolean {
  if (char !== "'" && char !== '"') return false;
  state.quote = char;
  return true;
}

function consumeWhitespace(state: CommandParseState, char: string): boolean {
  if (!/\s/.test(char)) return false;
  pushCurrentArg(state);
  return true;
}

function finishCommandParse(state: CommandParseState): void {
  if (state.escaping) state.current += "\\";
  pushCurrentArg(state);
}

function pushCurrentArg(state: CommandParseState): void {
  if (state.current.length === 0) return;
  state.args.push(state.current);
  state.current = "";
}
