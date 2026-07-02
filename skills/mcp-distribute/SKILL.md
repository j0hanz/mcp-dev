---
name: mcp-distribute
description: This skill should be used when the user asks to "publish an MCP server", "package an MCP server for npm", "distribute an MCP server", "add a bin entry", "run an MCP server with npx", "register an MCP server with a host", or mentions claude mcp add, .vscode/mcp.json, or .cursor/mcp.json for a finished MCP TypeScript SDK v2 server.
user-invocable: false
---

# Distributing MCP Servers (TypeScript SDK v2)

This guide explains how to share your finished server with other people. You must build your server first using the `mcp-server-build` guide.

## 1. Command-Line (stdio) Servers

People will run your server using a command called `npx`. To make this work, you must pack it as an `npm` package.

**Required `package.json` setup:**

```jsonc
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

**Important Rules:**

- **First line of code:** Your main file (`index.js`) must start exactly with `#!/usr/bin/env node`.
- **Lock the version:** Use an exact version for the SDK (like `"2.0.0-beta.2"`, without the `^` symbol) so your server does not break when things update.
- **Do not print regular text:** Never use `console.log`. Printing text breaks the connection.
- **Test before sharing:** Pack and test your server on your own computer first:

```sh
npm pack
npx @modelcontextprotocol/inspector npx -y ./example-mcp-0.1.0.tgz

```

## 2. Instructions for Your README File

Tell users exactly how to connect your server to their apps. Copy this table into your README file:

| App             | How to Connect                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------- |
| **Claude Code** | Run this command: `claude mcp add example -- npx -y example-mcp`                                               |
| **VS Code**     | Add to `.vscode/mcp.json`: `{ "servers": { "example": { "command": "npx", "args": ["-y", "example-mcp"] } } }` |
| **Cursor**      | Add to `.cursor/mcp.json`: `{ "servers": { "example": { "command": "npx", "args": ["-y", "example-mcp"] } } }` |

## 3. Web (HTTP) Servers

If your server runs over the internet (HTTP), you put it online just like a normal website.

- Check the `mcp-server-build` guide to see how to do this safely.
- Always add a login system (`mcp-auth`) before you let the public use it.

## 4. Keeping Track of Versions

- **Match your numbers:** Make sure the version number in your code (`new McpServer({ version: "0.1.0" })`) is exactly the same as the one in your `package.json` file.
- **Do not break old rules:** If you change what a tool needs to work, it will break old instructions. It is better to only add _optional_ new things. If you have to make a breaking change, you must increase your main version number (like going from 1.0.0 to 2.0.0).

## 5. Related Skills

- `mcp-server-build` — Learn how to build the server.
- `/mcp-audit` — A checklist to make sure your server is ready to share.
