---
name: mcp-distribute
description: This skill should be used when the user asks to "publish an MCP server", "package an MCP server for npm", "distribute an MCP server", "add a bin entry", "run an MCP server with npx", "register an MCP server with a host", or mentions claude mcp add, .vscode/mcp.json, or .cursor/mcp.json for a finished MCP TypeScript SDK v2 server.
user-invocable: false
---

# Distributing MCP Servers (TypeScript SDK v2)

Covers packaging and shipping a finished server. Build it first with the `mcp-server-build` skill.

## stdio servers — npm package with a `bin` entry

The host launches the server as a child process, so distribution means putting an executable on the user's machine — npm + `npx` is the standard channel.

```jsonc
// package.json
{
  "name": "example-mcp",
  "version": "0.1.0",
  "type": "module",
  "bin": { "example-mcp": "dist/index.js" },
  "files": ["dist"],
  "engines": { "node": ">=20" },
  "scripts": { "build": "tsc", "prepublishOnly": "npm run build && npm test" },
}
```

- The entry file's first line must be `#!/usr/bin/env node` — npm wires `bin` through it.
- **Pin the SDK exactly** (`"@modelcontextprotocol/server": "2.0.0-beta.2"`, no `^`) while v2 is in beta — the API may shift between betas.
- Stdout discipline travels with the package: any dependency that logs to stdout corrupts the wire (see `mcp-server-build`).
- Smoke-test the packed artifact before publishing:

```sh
npm pack
npx @modelcontextprotocol/inspector npx -y ./example-mcp-0.1.0.tgz
```

## Host registration — what goes in the README

| Host        | Registration                                                                                             |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| Claude Code | `claude mcp add example -- npx -y example-mcp`                                                           |
| VS Code     | `.vscode/mcp.json` → `{ "servers": { "example": { "command": "npx", "args": ["-y", "example-mcp"] } } }` |
| Cursor      | `.cursor/mcp.json` — same `command` + `args` shape                                                       |

These lines are the whole install experience — ship them in the package README.

## HTTP servers — deploy as a web service

Nothing package-specific: the handler is a web-standard fetch handler (`export default handler` on Workers/Deno/Bun; `toNodeHandler` behind `node:http`). See `mcp-server-build` → `references/serving-and-scaling.md` for adapters, Host/Origin security, and multi-node event buses — and load `mcp-auth-oauth` before exposing anything publicly.

## Versioning

- The `version` in `new McpServer({ name, version })` is what clients see via `getServerVersion()` — keep it equal to the package version.
- Changing a tool's input schema breaks every prompt written against it — prefer additive optional fields; treat schema changes as major bumps.

## Related skills

- `mcp-server-build` — building the thing being shipped.
- `/mcp-audit` (workflow) — production-readiness check before the first publish.
