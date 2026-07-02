---
name: mcp-server-build
description: This skill should be used when the user asks to "register a tool", "add an MCP resource", "add an MCP prompt", "expose tools to a model", "serve MCP over stdio", "serve MCP over HTTP", or mentions McpServer, registerTool, registerResource, registerPrompt, serveStdio, or createMcpHandler from the MCP TypeScript SDK v2 (@modelcontextprotocol/server). For planning a brand-new server, use `mcp-interview` first.
user-invocable: false
---

# Building MCP Servers (TypeScript SDK v2)

Covers `@modelcontextprotocol/server` `2.0.0-beta.2` (beta — API may shift before stable), protocol revision `2026-07-28`, which also serves all 2024/2025 revisions. Requires Node.js ≥ 20; also runs on Bun, Deno, browsers, and Cloudflare Workers. Official reference: https://ts.sdk.modelcontextprotocol.io/v2/

## Before scaffolding

New server and no `docs/mcp-decisions.md` yet? Load `mcp-interview` first — this skill implements decisions, it doesn't make them.

## Quick start

See [Quick Start Example](references/examples.md#quick-start) for a complete stdio server implementation.

The SDK derives the JSON Schema the model sees from the one Zod schema, validates every call against it before the handler runs, and infers the handler's argument types.

## Design rules that hold everywhere

- One schema (Zod v4, ArkType, or any Standard Schema with JSON Schema output) drives advertisement, validation, and handler typing.
- Tool failures are **results** (`isError: true`) the model reads; everything else fails as JSON-RPC **protocol errors**.
- HTTP serving is **per-request**: a factory builds a fresh server instance for every request; state lives outside the instance.
- On stdio, **stdout is the wire** — log with `console.error`, never `console.log`.

## Constructor

```ts
const server = new McpServer(
  { name: "catalog", version: "1.0.0" }, // Implementation info
  {
    // ServerOptions (all optional)
    capabilities: { logging: {}, resources: { subscribe: true } },
    instructions: "Call list-trips before book-trip.",
    enforceStrictCapabilities: true, // check client capabilities before server-initiated requests
    cacheHints: { "tools/list": { ttlMs: 60_000, cacheScope: "public" } },
  },
);
```

`McpServer` auto-advertises capabilities as items are registered. Every `McpServer` owns its protocol layer as `server.server` — the per-method escape hatch (see the `mcp-advanced-protocol` skill).

## Tools

`registerTool(name, config, handler)` registers a model-invocable action:

See [Tool Registration Example](references/examples.md#tool-registration).

- Content block types: `text`, `image`, `audio`, `resource_link`, `resource`.
- Arguments failing `inputSchema` return an `isError: true` result **before the handler runs** — the model reads the message and retries.
- `structuredContent` is validated against `outputSchema` before leaving the server (skipped on `isError` results).
- Omit `inputSchema` for no-argument tools. `annotations` are client hints only; they never change execution.
- A tool that needs the caller's identity reads `ctx.http?.authInfo` (see the `mcp-auth-oauth` skill).

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

```ts
server.registerResource(
  "config",
  "config://app",
  {
    title: "Application Config",
    description: "App configuration",
    mimeType: "text/plain",
  },
  async (uri) => ({
    contents: [{ uri: uri.href, text: "log_level=info\nregion=eu-west-1" }],
  }),
);
```

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

Wrap a prompt argument with `completable(schema, callback)`; the callback suggests values as the user types:

```ts
import { completable } from "@modelcontextprotocol/server";

argsSchema: z.object({
  repo: completable(z.string(), async (value) =>
    (await listRepos()).filter((r) => r.startsWith(value)),
  ),
  branch: completable(z.string(), async (value, context) => {
    const repo = context?.arguments?.repo; // other already-filled args; context is optional — never throw
    return repo ? branchesFor(repo).filter((b) => b.startsWith(value)) : [];
  }),
});
```

Return the full match list; the SDK caps `values` at 100 and fills `total` / `hasMore`. The first `completable` registers the handler and advertises the `completions` capability automatically. Resource-template variables complete via the template's `complete` map, not `completable`.

## Handler context (`ctx`)

Every handler receives a context as its second argument:

| Member                                         | Purpose                                                                                |
| ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| `ctx.mcpReq.signal`                            | `AbortSignal` — aborts on client cancel/disconnect; check in loops, forward to `fetch` |
| `ctx.mcpReq.id` / `ctx.mcpReq._meta`           | JSON-RPC request id / request `_meta` (e.g. `progressToken`)                           |
| `ctx.mcpReq.notify(n)` / `ctx.mcpReq.send(r)`  | Send a notification / request tied to this request                                     |
| `ctx.mcpReq.elicitInput(params)`               | Ask the user mid-call (2025-era; throws on 2026-era)                                   |
| `ctx.mcpReq.inputResponses` / `requestState()` | 2026-era multi-round-trip surfaces                                                     |
| `ctx.mcpReq.envelope`                          | Per-request client identity & capabilities (2026-era; legacy: `getClientVersion()`)    |
| `ctx.sessionId`                                | Session id when the transport has one                                                  |
| `ctx.http?.authInfo` / `ctx.http?.req`         | Verified `AuthInfo` / inbound `Request` (HTTP only — `undefined` on stdio)             |

For elicitation, `input_required`, progress reporting, and cancellation patterns, load the `mcp-interaction-patterns` skill.

## Errors — two channels, picked by audience

| Channel            | Shape                                     | Audience                                      | Produced by                                                 |
| ------------------ | ----------------------------------------- | --------------------------------------------- | ----------------------------------------------------------- |
| **Tool error**     | Result with `isError: true`               | The **model** — reads the message and retries | Tool handlers: return it or `throw` anything                |
| **Protocol error** | JSON-RPC error `{ code, message, data? }` | The **caller's code**                         | Resource/prompt/completion callbacks: `throw ProtocolError` |

```ts
// Tool error — put the recovery hint in the text:
return {
  content: [
    { type: "text", text: `No note "${id}". Known ids: ${ids.join(", ")}` },
  ],
  isError: true,
};

// Resource/prompt/completion callbacks:
import {
  ProtocolError,
  ProtocolErrorCode,
  ResourceNotFoundError,
} from "@modelcontextprotocol/server";
throw new ProtocolError(
  ProtocolErrorCode.InvalidParams,
  `Note ids are lowercase, got "${id}"`,
);
throw new ResourceNotFoundError(uri.href); // -32602 with data: { uri }
```

A tool handler **cannot** emit a protocol error — every throw (even a thrown `ProtocolError`) becomes `isError: true`. The one exception: `UrlElicitationRequiredError` propagates (`-32042`). Full code tables live in the `mcp-testing-debugging` skill.

## Serving on stdio

For servers a host launches as a local child process — `serveStdio(factory, options?)` owns the transport:

```ts
const handle = serveStdio(() => buildServer());
console.error("listening on stdio"); // stderr — NEVER console.log
process.on("SIGINT", () => void handle.close());
```

- **stdout is the JSON-RPC channel.** One `console.log` corrupts the stream and the host drops the connection.
- `legacy` option: `'serve'` (default — a 2025-era opening pins the connection to a legacy instance) or `'reject'`.
- Exercise without a host: `npx @modelcontextprotocol/inspector npx tsx src/index.ts`.
- Host registration (VS Code `.vscode/mcp.json`, `claude mcp add weather -- npx tsx src/index.ts`, Cursor `.cursor/mcp.json`) all take the same `command` + `args`.

## Serving over HTTP

See [HTTP Serving Example](references/examples.md#http-serving) for implementation details.

The factory runs once per HTTP request; a fresh instance serves every call → stateless and horizontally scalable as-is. Keep the factory cheap; create pools/caches at module scope and close over them.

**Security:** the handler trusts its caller — it validates no `Host`/`Origin` header and verifies no token. Mount those in front (framework adapters arm DNS-rebinding defense by default; auth is pass-through via `handler.fetch(request, { authInfo })`).

## Additional resources

### Reference files

- **`references/serving-and-scaling.md`** — `createMcpHandler` options, framework adapters (Express/Hono/Fastify), Host/Origin security, sessions, resumability, notifications and multi-node event buses, cache hints, legacy-client support.

### Related skills

- `mcp-auth-oauth` — protecting the endpoint with bearer auth
- `mcp-interaction-patterns` — elicitation, `input_required`, progress, cancellation
- `mcp-advanced-protocol` — low-level `Server`, custom methods, custom transports
- `mcp-testing-debugging` — in-process test harness and error reference
