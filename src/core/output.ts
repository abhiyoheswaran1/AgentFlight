export interface CommandOutput {
  output: string;
}

export function formatToolAvailability(label: string, available: boolean): string {
  return `${label}: ${available ? "available" : "unavailable"}`;
}

export function renderStatus(status: "ok" | "warning" | "error"): string {
  if (status === "ok") return "OK";
  if (status === "warning") return "Warning";
  return "Error";
}
