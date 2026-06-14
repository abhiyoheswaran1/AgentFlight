const agentFlightRuntimePrefixes = [
  ".agentflight/sessions/",
  ".agentflight/reports/",
  ".agentflight/current/",
  ".agentflight/evidence/"
];

export function filterAgentFlightRuntimePaths(files: string[]): string[] {
  return files.filter((file) => !isAgentFlightRuntimePath(file));
}

export function isAgentFlightRuntimePath(file: string): boolean {
  const normalized = normalizeChangedFilePath(file);
  return agentFlightRuntimePrefixes.some(
    (prefix) => normalized === prefix.slice(0, -1) || normalized.startsWith(prefix)
  );
}

function normalizeChangedFilePath(file: string): string {
  return file.replaceAll("\\", "/").replace(/^\.\//, "");
}
