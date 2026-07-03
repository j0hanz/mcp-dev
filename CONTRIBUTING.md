# Contributing to `mcp-dev`

We welcome issues and pull requests to improve these MCP development skills.

## Getting Started

1. **Prerequisites**: Ensure you have [Node.js](https://nodejs.org/) (version 20 or higher) installed.
2. **Setup**: Clone the repository and install dev dependencies:

   ```bash
   npm install
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

Thank you for contributing!
