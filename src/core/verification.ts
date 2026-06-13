export interface PackageJsonLike {
  scripts?: Record<string, string>;
}

export function detectVerificationCommands(packageJson: PackageJsonLike): string[] {
  const scripts = packageJson.scripts ?? {};
  const commands: string[] = [];

  if (scripts.typecheck) commands.push("npm run typecheck");
  if (scripts.lint) commands.push("npm run lint");
  if (scripts.test) commands.push("npm test");
  if (scripts.build) commands.push("npm run build");

  return commands;
}
