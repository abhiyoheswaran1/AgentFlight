const SESSION_ID_PATTERN = /^af-[a-z0-9][a-z0-9-]{0,127}$/;

export function isSafeSessionId(value: unknown): value is string {
  return typeof value === "string" && SESSION_ID_PATTERN.test(value);
}

export function assertSafeSessionId(value: unknown): asserts value is string {
  if (!isSafeSessionId(value)) {
    throw new Error("Unsafe AgentFlight session id in local session metadata.");
  }
}
