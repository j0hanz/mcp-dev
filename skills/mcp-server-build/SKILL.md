---
name: mcp-server-build
description: Use when building, serving, or publishing an MCP server with the TypeScript SDK v2 (@modelcontextprotocol/server) — registering tools, resources, or prompts, wiring stdio or HTTP transport, or packaging for npm. For planning a brand-new server, use mcp-interview first.
user-invocable: false
---

# Building MCP Servers (TypeScript SDK v2)

Covers `@modelcontextprotocol/server` `2.0.0-beta.2` (beta — API may shift before stable), protocol revision `2026-07-28`, which also serves all 2024/2025 revisions. Requires Node.js ≥ 20; also runs on Bun, Deno, browsers, and Cloudflare Workers. Official reference: https://ts.sdk.modelcontextprotocol.io/v2/

```
McpServer -> register (tools | resources | prompts) -> serve (stdio | HTTP) -> test -> distribute
```

## Quick start

See [Quick Start Example](references/examples.md#quick-start) for a complete stdio server implementation.

The SDK derives the JSON Schema the model sees from the one Zod schema, validates every call against it before the handler runs, and infers the handler's argument types.

## Design rules that hold everywhere

- One schema (Zod v4, ArkType, or any Standard Schema with JSON Schema output) drives advertisement, validation, and handler typing.
- Tool failures are **results** (`isError: true`) the model reads; everything else fails as JSON-RPC **protocol errors**.
- HTTP serving is **per-request**: a factory builds a fresh server instance for every request; state lives outside the instance.
- On stdio, **stdout is the wire** — log with `console.error`, never `console.log`.

## Constructor

See [Constructor Options Example](references/examples.md#constructor-options).

`McpServer` auto-advertises capabilities as items are registered. Every `McpServer` owns its protocol layer as `server.server` — the per-method escape hatch (see the `mcp-advanced-protocol` skill).

## Tools

`registerTool(name, config, handler)` registers a model-invocable action:

See [Tool Registration Example](references/examples.md#tool-registration).

- Content block types: `text`, `image`, `audio`, `resource_link`, `resource`.
- Arguments failing `inputSchema` return an `isError: true` result **before the handler runs** — the model reads the message and retries.
- `structuredContent` is validated against `outputSchema` before leaving the server (skipped on `isError` results).
- Omit `inputSchema` for no-argument tools. `annotations` are client hints only; they never change execution.
- A tool that needs the caller's identity reads `ctx.http?.authInfo` (see the `mcp-auth` skill).

The registration handle mutates live and notifies clients automatically (`notifications/tools/list_changed`):

```ts
const handle = server.registerTool("run-report", { description: "…" }, handler);
handle.update({ description: "Run and email the weekly report" });
handle.disable(); // hidden from tools/list
handle.enable();
handle.remove();
```

## Resources

`registerResource(name, uriOrTemplate, config, readCallback)` exposes read-only data addressed by URI:

See [Resource Registration Example](references/examples.md#resource-registration).

Each item in `contents` echoes the `uri` and carries `text` **or** a base64 `blob`, with its own `mimeType`.

`ResourceTemplate` registers a URI pattern; matched variables arrive parsed as the second callback argument:

See [Resource Registration Example](references/examples.md#resource-registration).

- A template appears in `resources/list` **only** via its `list` callback; `resources/templates/list` always advertises the pattern.
- **Sanitize file-backed paths** — template variables are client input. Resolve with `realpath`, then reject anything outside the root (`resolved.startsWith(ROOT + path.sep)`); compare resolved real paths, never raw strings.

## Prompts

`registerPrompt(name, config, callback)` defines a user-invoked message template:

See [Prompt Registration Example](references/examples.md#prompt-registration).

- Arguments failing `argsSchema` reject `prompts/get` with a `-32602` **protocol error** (unlike tools, which return `isError` results).
- Embed a registered resource inline (`content: { type: 'resource', resource: { uri, mimeType, text } }`) so the client skips a `resources/read` round trip.

## Argument completion

Wrap a prompt argument with `completable(schema, callback)`. See [Argument Completion Example](references/examples.md#argument-completion).

Return the full match list; the SDK caps `values` at 100 and fills `total` / `hasMore`. The first `completable` registers the handler and advertises the `completions` capability automatically. Resource-template variables complete via the template's `complete` map, not `completable`.

## Handler context (`ctx`)

Every handler receives a context as its second argument. See [Context API Reference](references/context.md) for the full table of properties (`ctx.mcpReq`, `ctx.http`, etc.).

For elicitation, `input_required`, progress reporting, and cancellation patterns, load the `mcp-elicitation` skill.

## Errors — two channels, picked by audience

See [Errors API Reference](references/errors.md) for detailed error channels (Tool vs Protocol errors), the tool-handler protocol-error exception, and examples.

## Serving on stdio

For servers a host launches as a local child process — `serveStdio(factory, options?)` owns the transport. See [Stdio Serving Example](references/examples.md#stdio-serving).

- **stdout is the JSON-RPC channel.** One `console.log` corrupts the stream and the host drops the connection.
- `legacy` option: `'serve'` (default — a 2025-era opening pins the connection to a legacy instance) or `'reject'`.
- Host registration (VS Code `.vscode/mcp.json`, `claude mcp add weather -- npx tsx src/index.ts`, Cursor `.cursor/mcp.json`) all take the same `command` + `args`.

## Serving over HTTP

See [HTTP Serving Example](references/examples.md#http-serving) for implementation details.

The factory runs once per HTTP request; a fresh instance serves every call → stateless and horizontally scalable as-is. Keep the factory cheap; create pools/caches at module scope and close over them.

**Security:** the handler trusts its caller — it validates no `Host`/`Origin` header and verifies no token. Mount those in front (framework adapters arm DNS-rebinding defense by default; auth is pass-through via `handler.fetch(request, { authInfo })`).

## Reference files

- **`references/serving-and-scaling.md`** — `createMcpHandler` options, framework adapters (Express/Hono/Fastify), Host/Origin security, sessions, resumability, notifications and multi-node event buses, cache hints, legacy-client support.
- **`references/distribution.md`** — read when the server is built and tested and needs to ship: npm `bin` packaging for npx, host registration (Claude Code / VS Code / Cursor), HTTP deployment, versioning rules.

## Related skills

- `mcp-interview` — plan a brand-new server before scaffolding
- `mcp-auth` — protecting the endpoint with bearer auth
- `mcp-elicitation` — elicitation, `input_required`, progress, cancellation
- `mcp-advanced-protocol` — low-level `Server`, custom methods, custom transports
- `mcp-test` — in-process test harness and error reference
