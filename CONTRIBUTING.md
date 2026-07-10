# Contributing to `mcp-hub`

We welcome issues and pull requests to improve these MCP development skills.

## Getting Started

1. **Prerequisites**:
   - [Node.js](https://nodejs.org/) version 20 or higher.
   - The [Claude Code CLI](https://code.claude.com/docs) (`npm install -g @anthropic-ai/claude-code`) —
     required by `npm run validate`.
2. **Setup**: Clone the repository and install dev dependencies:

   ```bash
   npm ci
   ```

## Development Workflow

- **Skills**: Skills are defined in `skills/*/SKILL.md` with accompanying files under `references/`.
- **Agents**: Agent configurations are defined under `agents/*.md`.
- **Hooks**: Global lifecycle hooks (like `session-start.js`) live under `hooks/`.

### Validation

Before submitting a pull request, format all files and run the plugin validation script to ensure the marketplace manifest and configuration are correct:

```bash
# Format codebase files
npm run format

# Run plugin validation
npm run validate
```

### Test locally

Load your working copy into a Claude Code session and exercise it:

```bash
claude --plugin-dir .
```

Inside the session, run `/mcp` to check the dispatcher, or make an MCP-related
request to see skills auto-load. After editing skills, run `/reload-plugins` (or
restart the session) to pick up changes.

## Releasing

1. Bump the version in **all three** manifests to the same value: `package.json`,
   `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`.
2. Run `npm run format:check` and `npm run validate` (and `npm run check`, if present).
3. Commit as `chore: bump version to X.Y.Z`, then tag:
   `git tag vX.Y.Z && git push origin master --tags`.

Thank you for contributing!
