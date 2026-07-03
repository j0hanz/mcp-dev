---
name: mcp-migrate
description: Use when migrating an MCP TypeScript codebase from SDK v1 to SDK v2, using codemods, or updating imports and deprecated surfaces.
user-invocable: false
metadata:
  category: technique
  triggers: migrating mcp, upgrade sdk, SSEServerTransport, McpError, RequestHandlerExtra, sdk v1 to v2, McpServer
---

# Migrating MCP SDK v1 to v2

Upgrades from `@modelcontextprotocol/sdk` v1 to split v2 packages on Node ≥ 20. Official docs: https://ts.sdk.modelcontextprotocol.io/v2/

Flow: `codemod` → `errors` → `renames` → `removed` → `deprecations` → `manual` → `verify`

## How It Works

### Step 1: Run the Codemod

Run at package root:

```sh
npx @modelcontextprotocol/codemod@beta v1-to-v2 .
grep -rn '@mcp-codemod-error' .
```

Resolve all `@mcp-codemod-error` comments manually.

### Step 2: Packages & Renames

- See [references/tables.md](references/tables.md) for packages/renames.
- **Removed**: `SSEServerTransport` & OAuth helpers are in `@modelcontextprotocol/server-legacy`. `WebSocketClientTransport` is removed.

### Step 3: Deprecations

- **Sampling**: Call LLM directly.
- **Roots**: Pass paths as arguments.
- **Logging**: Use stderr/OpenTelemetry instead of `sendLoggingMessage`.

### Step 4: Manual Updates

See [references/tables.md](references/tables.md#adopting-the-2026-07-28-era):

1. **Entrypoints**: Use `createMcpHandler` (HTTP) or `serveStdio` (stdio). Wrap HTTP with `toNodeHandler` for Express/Fastify.
2. **Prompts**: Return `input_required` instead of calling `elicitInput`.
3. **State**: Use `requestState` for cross-round data.
4. **Negotiation**: Set `versionNegotiation: { mode: 'auto' }`.
5. **Subscriptions**: Replace `list_changed` with `subscriptions/listen` stream.
6. **ESM**: Set `"type": "module"`, `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`.
7. **Headers**: Use `headers.get('name')` instead of bracket notation.
8. **Testing**: Validate with the `/mcp-test` skill.

### Step 5: Adopt `McpServer`

`McpServer` handles Zod and capabilities automatically:

- Replace low-level `Server` with `McpServer`.
- `.registerTool()`, `.registerPrompt()`, `.registerResource()` accept Zod directly.
- Use `completable()` for prompt autocompletion.

## References

- Express: [express-reference.md](references/express-reference.md)
- Fastify: [fastify-reference.md](references/fastify-reference.md)
- Hono: [hono-reference.md](references/hono-reference.md)
- Codemod: [codemod-reference.md](references/codemod-reference.md)
