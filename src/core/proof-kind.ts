import type { VerificationProofKind } from "../types/index.js";

export function classifyVerificationProofKind(command: string): VerificationProofKind {
  const normalized = command.toLowerCase();

  if (/\b(npm|pnpm|yarn|bun)\s+(ci|install)\b/.test(normalized)) return "install";
  if (/\b(vitest|jest|mocha|playwright|cypress|e2e|test|verify)\b/.test(normalized)) {
    return "test";
  }
  if (/\bbuild\b/.test(normalized)) return "build";
  if (/\b(typecheck|tsc)\b/.test(normalized)) return "typecheck";
  if (/\b(lint|eslint)\b/.test(normalized)) return "lint";

  return "unknown";
}
