---
name: mcp-server
description: Use when building, serving, testing, or publishing a Model Context Protocol (MCP) server using the TypeScript SDK v2 (@modelcontextprotocol/server).
user-invocable: false
metadata:
  category: technique
  triggers: build server, register tools, resource templates, prompt templates, transport gateways, mcp server
---

# Building MCP Servers

Covers `@modelcontextprotocol/server` SDK v2 (protocol revision `2026-07-28`) on Node.js ≥ 20. Official reference: https://ts.sdk.modelcontextprotocol.io/v2/

Flow: `ESM config` ➔ `McpServer` init ➔ register (tools/resources/prompts) ➔ sanitize paths ➔ transport (stdio/HTTP) — then [mcp-test], then distribute

## When to Use

- Building a TypeScript/JavaScript MCP server.
- Registering tools, resources, prompts, or autocompletion.
- Wiring stdio or HTTP transports (Express, Hono, Fastify, Serverless).
- Packaging servers for deployment or npm.
- For testing and error codes, load [mcp-test].

## How It Works

### Stdio Quickstart

See [Quickstart Examples](references/examples.md#quick-start) for complete setups. Minimal stub:

```ts
const server = new McpServer({ name: 'app', version: '1.0.0' });
server.registerTool('hello', { inputSchema: z.object({ name: z.string() }) }, async ({ name }) => ({
  content: [{ type: 'text', text: `Hi ${name}` }],
}));
serveStdio(() => server);
```

## Steps

1. **Configure ESM**: Standardize project files to ESM-only (`"type": "module"` in `package.json`, `"NodeNext"` resolutions in `tsconfig.json`).
2. **Initialize Server**: Instantiate `McpServer` with a suitable identifier.
3. **Register Capabilities**:
   - Register tools using `.registerTool()` passing a Standard Schema input schema (Zod, ArkType, Valibot, or raw JSON Schema — see `references/examples.md`).
   - Register dynamic templates using `.registerResource()` mapping dynamic parameters.
   - Register prompt layouts using `.registerPrompt()`.
4. **Sanitize Access Paths**: Resolve and ensure resource paths using `realpath`, validating boundaries to protect against directory traversal.
5. **Establish Transport**: Bind server dependencies to standard channels (`serveStdio` or HTTP interfaces per-request factories).

> `inputSchema`/`outputSchema`/`argsSchema` accept any **Standard Schema** (Zod v4, ArkType, Valibot via `@modelcontextprotocol/server`, raw JSON Schema via `fromJsonSchema`). For gateway/proxy and custom (vendor-prefixed) JSON-RPC methods, see the `mcp.protocol` skill.

## Completion Criteria

To consider a server implementation complete, you must verify:

- [ ] Codebase operates exclusively with modern ESM resolutions.
- [ ] Stdio servers NEVER use `console.log()` to prevent JSON-RPC wire corruption. All debug messages are output on `console.error()`.
- [ ] Factory setups for HTTP endpoints instantiate fresh servers per-request without accumulating heavy persistent DB connections.
- [ ] Resource template targets resolve securely and cannot exit their root directories.
- [ ] Normal tool exceptions let the SDK automatically wrap failures into standard `{ isError: true }` responses.

## Reference Guides & Adapters

- [Code Examples](references/examples.md): Practical code samples.
- [Context API](references/context.md): Context variables (`ctx.mcpReq`, `ctx.http`, etc.).
- [Errors API](references/errors.md): Tool vs Protocol error channels and handling.
- [HTTP Serving](references/serving-http.md): Setup, Host/Origin security, and legacy clients.
- [Scaling & Notifications](references/scaling.md): Caching, state, Event Bus, and pub/sub.
- [Distribution](references/distribution.md): Npm publishing and host installation (`mcp.json`).
- Adapters: [Express](references/framework-express.md) \| [Fastify](references/framework-fastify.md) \| [Hono](references/framework-hono.md) \| [Codemod](references/framework-codemod.md).

## Common Mistakes

- **Logs Corridor**: Outputting debug statements to standard stdout via `console.log()`.
- **Directory Traversal**: Exposing raw path interpolation to resource endpoints without sanitizing.
- **Shared States in HTTP**: Instantiating static DB pool allocations inside global request factories.
