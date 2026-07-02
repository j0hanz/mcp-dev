---
name: mcp-server-build
description: Use when building, serving, or publishing an MCP server with the TypeScript SDK v2 (@modelcontextprotocol/server) — registering tools, resources, or prompts, wiring stdio or HTTP transport, or packaging for npm. For planning a brand-new server, use /mcp-interview first.
user-invocable: false
metadata:
  category: technique
  triggers: build server, register tools, resource templates, prompt templates, transport gateways, mcp server
---

# Building MCP Servers (TypeScript SDK v2)

Covers `@modelcontextprotocol/server` `2.0.0-beta.2` (beta — API may shift before stable), protocol revision `2026-07-28`, which also serves all 2024/2025 revisions. Requires Node.js ≥ 20. Official reference: https://ts.sdk.modelcontextprotocol.io/v2/

```
McpServer -> register (tools | resources | prompts) -> serve (stdio | HTTP) -> test -> distribute
```

## When to Use

- Building a new MCP server in TypeScript/JavaScript.
- Registering tools, resources, prompts, or argument completion.
- Wiring a server to stdio or HTTP transports (Express, Hono, Fastify, Cloudflare Workers, Deno, Bun).
- Preparing an MCP server for deployment or distribution (npm package, npx).
- To write tests or troubleshoot protocol/connection issues, load the `/mcp-test` skill.

## How It Works

### Quick start

See [Quick Start Example](references/examples.md#quick-start) for a complete stdio server implementation.

The SDK derives the JSON Schema the model sees from the one Zod schema, validates every call against it before the handler runs, and infers the handler's argument types.

### Design rules that hold everywhere

- One schema (Zod v4, ArkType, or any Standard Schema with JSON Schema output) drives advertisement, validation, and handler typing.
- Tool failures are **results** (`isError: true`) the model reads; everything else fails as JSON-RPC **protocol errors**.
- HTTP serving is **per-request**: a factory builds a fresh server instance for every request; state lives outside the instance.
- On stdio, **stdout is the wire** — log with `console.error`, never `console.log`.

### Constructor

`McpServer` auto-advertises capabilities as items are registered. Every `McpServer` owns its protocol layer as `server.server` — the per-method escape hatch (see the `/mcp-advanced-protocol` skill).

### Tools

`registerTool(name, config, handler)` registers a model-invocable action:

- Content block types: `text`, `image`, `audio`, `resource_link`, `resource`.
- Arguments failing `inputSchema` return an `isError: true` result **before the handler runs** — the model reads the message and retries.
- `structuredContent` is validated against `outputSchema` before leaving the server (skipped on `isError` results).
- Omit `inputSchema` for no-argument tools. `annotations` are client hints only; they never change execution.
- A tool that needs the caller's identity reads `ctx.http?.authInfo` (see the `/mcp-auth` skill).

The registration handle mutates live and notifies clients automatically (`notifications/tools/list_changed`):

```ts
const handle = server.registerTool('run-report', { description: '…' }, handler);
handle.update({ description: 'Run and email the weekly report' });
handle.disable(); // hidden from tools/list
handle.enable();
handle.remove();
```

### Resources

`registerResource(name, uriOrTemplate, config, readCallback)` exposes read-only data addressed by URI:

Each item in `contents` echoes the `uri` and carries `text` **or** a base64 `blob`, with its own `mimeType`.

`ResourceTemplate` registers a URI pattern; matched variables arrive parsed as the second callback argument:

- A template appears in `resources/list` **only** via its `list` callback; `resources/templates/list` always advertises the pattern.
- **Sanitize file-backed paths** — template variables are client input. Resolve with `realpath`, then reject anything outside the root (`resolved.startsWith(ROOT + path.sep)`); compare resolved real paths, never raw strings.

### Prompts

`registerPrompt(name, config, callback)` defines a user-invoked message template:

- Arguments failing `argsSchema` reject `prompts/get` with a `-32602` **protocol error** (unlike tools, which return `isError` results).
- Embed a registered resource inline (`content: { type: 'resource', resource: { uri, mimeType, text } }`) so the client skips a `resources/read` round trip.

### Argument completion

Wrap a prompt argument with `completable(schema, callback)`. See [Argument Completion Example](references/examples.md#argument-completion).

Return the full match list; the SDK caps `values` at 100 and fills `total` / `hasMore`. The first `completable` registers the handler and advertises the `completions` capability automatically. Resource-template variables complete via the template's `complete` map, not `completable`.

### Handler context (`ctx`)

Every handler receives a context as its second argument. See [Context API Reference](references/context.md) for the full table of properties (`ctx.mcpReq`, `ctx.http`, etc.).

For elicitation, `input_required`, progress reporting, and cancellation patterns, load the `/mcp-elicitation` skill.

### Errors — two channels, picked by audience

See [Errors API Reference](references/errors.md) for detailed error channels (Tool vs Protocol errors), the tool-handler protocol-error exception, and examples.

### Serving on stdio

For servers a host launches as a local child process — `serveStdio(factory, options?)` owns the transport.

- **stdout is the JSON-RPC channel.** One `console.log` corrupts the stream and the host drops the connection.
- `legacy` option: `'serve'` (default — a 2025-era opening pins the connection to a legacy instance) or `'reject'`.
- Host registration (VS Code `.vscode/mcp.json`, `claude mcp add weather -- npx tsx src/index.ts`, Cursor `.cursor/mcp.json`) all take the same `command` + `args`.

### Serving over HTTP

The factory runs once per HTTP request; a fresh instance serves every call → stateless and horizontally scalable as-is. Keep the factory cheap; create pools/caches at module scope and close over them.

**Security:** the handler trusts its caller — it validates no `Host`/`Origin` header and verifies no token. Mount those in front (framework adapters arm DNS-rebinding defense by default; auth is pass-through via `handler.fetch(request, { authInfo })`).

## Examples

Code implementation examples are located in:

- Quickstart, options, tools, resources, completions, stdio, and HTTP serving: [references/examples.md](references/examples.md)
- Express, Hono, Fastify, session handling, DNS defense, multi-node scaling: [references/serving-and-scaling.md](references/serving-and-scaling.md)
- Packaging, hosting registration, HTTP deployment: [references/distribution.md](references/distribution.md)

## Common Mistakes

- Writing to `stdout` (e.g. using `console.log`) on stdio-based servers, which corrupts the JSON-RPC wire channel (log to `console.error` instead).
- Failing to sanitize resource template variables before using them to access file-backed paths (always resolve with `realpath` and verify prefix match).
- Throwing validation errors in tool handlers (they return `{ isError: true }` results instead).
- Instantiating heavy databases or caches inside the per-request HTTP server factory (pools should be created at module scope and closed over).
