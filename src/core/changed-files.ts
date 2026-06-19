const agentFlightRuntimePrefixes = [
  ".agentflight/sessions/",
  ".agentflight/reports/",
  ".agentflight/current/",
  ".agentflight/evidence/"
];

const agentLoopKitEvidencePrefixes = [
  ".agentloop/reports/",
  ".agentloop/handoffs/",
  ".agentloop/runs/"
];

const agentLoopKitEvidencePaths = [".agentloop/state.json"];

export interface ChangedFileFilterOptions {
  ignore?: string[] | undefined;
}

export function filterChangedFiles(
  files: string[],
  options: ChangedFileFilterOptions = {}
): string[] {
  const runtimeFiltered = filterBuiltInRuntimePaths(files);
  const ignore = Array.isArray(options.ignore) ? options.ignore : [];
  const patterns = ignore
    .map(normalizeIgnorePattern)
    .filter((pattern): pattern is string => pattern !== null);

  if (patterns.length === 0) return runtimeFiltered;

  return runtimeFiltered.filter((file) => {
    const normalized = normalizeChangedFilePath(file);
    return !patterns.some((pattern) => matchesIgnorePattern(normalized, pattern));
  });
}

export function filterAgentFlightRuntimePaths(files: string[]): string[] {
  return files.filter((file) => !isAgentFlightRuntimePath(file));
}

export function filterBuiltInRuntimePaths(files: string[]): string[] {
  return files.filter((file) => !isBuiltInRuntimePath(file));
}

export function isAgentFlightRuntimePath(file: string): boolean {
  const normalized = normalizeChangedFilePath(file);
  return agentFlightRuntimePrefixes.some(
    (prefix) => normalized === prefix.slice(0, -1) || normalized.startsWith(prefix)
  );
}

export function isAgentLoopKitEvidencePath(file: string): boolean {
  const normalized = normalizeChangedFilePath(file);
  return (
    agentLoopKitEvidencePaths.includes(normalized) ||
    agentLoopKitEvidencePrefixes.some(
      (prefix) => normalized === prefix.slice(0, -1) || normalized.startsWith(prefix)
    )
  );
}

export function isBuiltInRuntimePath(file: string): boolean {
  return isAgentFlightRuntimePath(file) || isAgentLoopKitEvidencePath(file);
}

function normalizeChangedFilePath(file: string): string {
  return file.replaceAll("\\", "/").replace(/^\.\//, "");
}

function normalizeIgnorePattern(pattern: string): string | null {
  const normalized = normalizeChangedFilePath(pattern.trim());
  if (normalized.length === 0) return null;
  if (normalized.startsWith("../") || normalized === "..") return null;
  return normalized;
}

function matchesIgnorePattern(file: string, pattern: string): boolean {
  if (pattern.endsWith("/**")) {
    const prefix = pattern.slice(0, -2);
    return file === prefix.slice(0, -1) || file.startsWith(prefix);
  }

  if (!pattern.includes("*")) {
    return file === pattern;
  }

  if (!pattern.includes("/")) {
    return globToRegExp(pattern).test(file.split("/").at(-1) ?? file);
  }

  return globToRegExp(pattern).test(file);
}

function globToRegExp(pattern: string): RegExp {
  let source = "^";
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index]!;
    if (char === "*") {
      const next = pattern[index + 1];
      if (next === "*") {
        source += ".*";
        index += 1;
      } else {
        source += "[^/]*";
      }
      continue;
    }
    source += escapeRegExp(char);
  }
  return new RegExp(`${source}$`);
}

function escapeRegExp(value: string): string {
  return value.replace(/[\\^$+?.()|[\]{}]/g, "\\$&");
}
