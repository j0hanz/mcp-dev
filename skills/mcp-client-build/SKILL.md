---
name: mcp-client-build
description: Use when building an MCP client with the TypeScript SDK v2 (@modelcontextprotocol/client) — connecting to servers, calling tools, reading resources or prompts, subscriptions, caching, or middleware. For planning a brand-new client, use mcp-interview first.
user-invocable: false
metadata:
  category: technique
  triggers: mcp client, client connection, register capabilities, call tools, read resources, progress handler
---

# Building MCP Clients (TypeScript SDK v2)

Covers `@modelcontextprotocol/client` `2.0.0-beta.2` (beta — API may shift before stable). Requires Node.js ≥ 20. Official reference: https://ts.sdk.modelcontextprotocol.io/v2/

```
Client + transport -> connect -> call | read | subscribe -> handle server requests -> terminate + close
```

## When to Use

- Building or running an MCP client (connecting, calling tools, reading resources, handling prompts).
- Setting up subscriptions, caching, or middleware on the client side.

## How It Works

### 1. Connect and disconnect

- `connect()` performs the handshake with the server.
- After connecting: `getServerVersion()`, `getServerCapabilities()` (only request what the server actually declared), `getInstructions()` (the server's usage guidance), `getProtocolEra()` (`'legacy'` or `'modern'`).
- To close: `await transport.terminateSession()` first, then `await client.close()`.

### 2. Transports

| Transport                       | Use                                                                                             |
| ------------------------------- | ----------------------------------------------------------------------------------------------- |
| `StreamableHTTPClientTransport` | Remote servers over HTTP (default choice).                                                      |
| `StdioClientTransport`          | A local server as a child process — the transport spawns it; never start it yourself.           |
| `SSEClientTransport`            | Legacy fallback for older remote servers — try Streamable first, retry on a **fresh** `Client`. |
| `InMemoryTransport`             | In-process testing.                                                                             |

### 3. Calling tools and resources

- Server-side failures come back as `{ isError: true }`, not a throw — check it before trusting `content`. A `throw` only happens if the connection itself breaks or times out.
- `structuredContent` is `unknown` — only present when the tool declares `outputSchema`; narrow before use.
- List calls (`listTools`, etc.) auto-paginate up to `listMaxPages` (default 64; `0` removes the cap) — exceeding it rejects with `SdkError(LIST_PAGINATION_EXCEEDED)`. Pass `{ cursor }` to fetch exactly one raw page; explicit-cursor calls are never capped.
- Per-call options: `onprogress` for progress updates, `maxTotalTimeout` to bound total time, `signal` to cancel.

```ts
await client.callTool(params, {
  onprogress: (update) => console.log(update),
  resetTimeoutOnProgress: true,
  maxTotalTimeout: 600000,
  signal: controller.signal, // abort → the server handler's ctx.mcpReq.signal aborts
});
```

### 4. Version negotiation

Two protocol eras: legacy (2024/2025) and modern (2026-07-28). `versionNegotiation.mode` controls how the client picks:

- `'legacy'` (default) — always negotiates the older era.
- `'auto'` — tries modern first, falls back to legacy if the server doesn't support it.
- An explicit version pins the client to exactly that era.

```ts
const client = new Client(
  { name: 'my-client', version: '1.0.0' },
  { versionNegotiation: { mode: 'auto' } },
);
```

- `'auto'` probes with `server/discover`; tune with `probe: { timeoutMs, maxRetries }`. `supportedProtocolVersions` shapes the probe — removing every pre-2026 entry removes the legacy fallback.
- Don't default a spawn-per-invocation stdio CLI to `'auto'` — a legacy stdio server stalls the probe for its full timeout.

### 5. Responding to server-initiated requests

If the server elicits input or reports progress, register the handlers once at client construction — load the `mcp-elicitation` skill for the handler patterns.

## Examples

Code implementation examples are located in:

- Connecting, calling, subscribing, and middleware: [references/examples.md](references/examples.md)
- Subscriptions, caching, middleware, and roots: [references/subscriptions-caching-middleware.md](references/subscriptions-caching-middleware.md)

## Common Mistakes

- Wrapping tool calls in try/catch expecting standard exceptions for server-side tool errors (check `isError: true` instead).
- Defaulting a spawn-per-invocation stdio CLI client's version negotiation to `'auto'` (stalls the probe for the full timeout on legacy servers).
- Exceeding the maximum pagination page limit (`listMaxPages`), causing `LIST_PAGINATION_EXCEEDED` errors.
