---
name: mcp-server-build
description: Building, serving, or publishing an MCP server with the TypeScript SDK v2 (@modelcontextprotocol/server).
user-invocable: false
metadata:
  category: technique
  triggers: build server, register tools, resource templates, prompt templates, transport gateways, mcp server
---

# Building MCP Servers

Covers `@modelcontextprotocol/server` SDK v2 (protocol revision `2026-07-28`) on Node.js ≥ 20. Official reference: https://ts.sdk.modelcontextprotocol.io/v2/

Flow: `McpServer` ➔ register (tools/resources/prompts) ➔ serve (stdio/HTTP) ➔ test ➔ distribute

## When to Use

- Building a TypeScript/JavaScript MCP server.
- Registering tools, resources, prompts, or autocompletion.
- Wiring stdio or HTTP transports (Express, Hono, Fastify, Serverless).
- Packaging servers for deployment or npm.
- For testing and error codes, load `/mcp-test`.

## How It Works

### Stdio Quickstart

See [Quickstart Examples](references/examples.md#quick-start) for complete setups. Minimal stub:

```ts
const server = new McpServer({ name: 'app', version: '1.0.0' });
server.registerTool('hello', { name: z.string() }, async ({ name }) => ({
  content: [{ type: 'text', text: `Hi ${name}` }],
}));
await serveStdio(() => server);
```

### ESM & TypeScript Requirements

SDK is ESM-only. Ensure `package.json` contains `"type": "module"` and `tsconfig.json` has `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`.

### Design Rules

- **Stdio**: `stdout` is the wire channel. Log via `console.error()`, never `console.log()`.
- **HTTP**: Per-request lifecycle. Factory builds a fresh server instance per call.
- **Failures**: Tool errors return `{ isError: true }` in results; standard protocol crashes throw JSON-RPC errors.
- **Resources**: Sanitize template paths using `realpath`; verify they stay inside the root directory.

### Registration APIs

- **Tools**: `registerTool(name, schema, handler)`. Errors return `isError: true` so the model can retry.
- **Resources**: `registerResource(name, uriOrTemplate, config, readCallback)`. Address data via URI templates.
- **Prompts**: `registerPrompt(name, config, callback)`. Return message templates. Auto-complete arguments using `completable()`.

## Reference Guides

- [Context API](references/context.md): Context variables (`ctx.mcpReq`, `ctx.http`, etc.).
- [Errors API](references/errors.md): Tool vs Protocol error channels and handling.
- [Code Examples](references/examples.md): Practical configurations for tools, resources, and servers.
- [HTTP Serving](references/serving-http.md): Setup, Host/Origin security, and legacy clients.
- [Scaling & Notifications](references/scaling.md): Caching, state, Event Bus, and pub/sub.
- [Distribution](references/distribution.md): Npm publishing and host installation (`mcp.json`).
- Framework Adapters: [Express](references/framework-express.md) \| [Fastify](references/framework-fastify.md) \| [Hono](references/framework-hono.md) \| [Codemod](references/framework-codemod.md).

## Common Mistakes

- Using `console.log()` on stdio servers, which corrupts the JSON-RPC wire.
- Failing to sanitize resource paths, allowing directory traversal.
- Throwing exceptions in tool handlers instead of returning `{ isError: true }`.
- Creating heavy DB pool instances inside the per-request HTTP factory.
