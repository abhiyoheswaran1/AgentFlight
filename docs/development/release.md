# Release Process

AgentFlight releases use npm Trusted Publishing from GitHub Actions.

## Why Tags, Not Every Push

npm versions are immutable. Publishing on every push would either fail whenever the version is unchanged or force noisy version churn. AgentFlight verifies every push, but publishes only from version tags.

## npm Trusted Publisher Settings

Configure these values on npmjs.com for the `agentflight` package:

- Publisher: `GitHub Actions`
- Organization or user: `abhiyoheswaran1`
- Repository: `AgentFlight`
- Workflow filename: `release.yml`
- Environment name: `npm`
- Allowed actions: `Allow npm publish`

Do not enable `Allow npm stage publish` unless AgentFlight intentionally adopts npm staged releases later.

## Release Checklist

1. Update `package.json` and `package-lock.json` to the new version.
2. Update `CHANGELOG.md`.
3. Run verification:

   ```bash
   npm run verify
   npm run format:check
   npm pack --dry-run
   ```

4. Commit the release:

   ```bash
   git add .
   git commit -m "chore: release v0.1.1"
   ```

5. Tag and push:

   ```bash
   git tag v0.1.1
   git push origin main --tags
   ```

6. Confirm:

   ```bash
   npm view agentflight version
   npx --yes agentflight@latest --help
   ```

## Manual Emergency Publish

Manual publishing is allowed for emergencies while the package is young:

```bash
npm run verify
npm run format:check
npm pack --dry-run
npm publish --access public
```

Record any manual publish in `CHANGELOG.md` and `AGENTFLIGHT_DEVLOG.md`.
