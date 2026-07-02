---
name: mcp-client-build
description: This skill should be used when the user asks to "connect to an MCP server", "call an MCP tool", "list MCP tools", "read an MCP resource", "get an MCP prompt", or mentions Client, StreamableHTTPClientTransport, StdioClientTransport, callTool, versionNegotiation, or listChanged from the MCP TypeScript SDK v2 (@modelcontextprotocol/client). For planning a brand-new client, use `mcp-interview` first.
user-invocable: false
---

# Building MCP Clients (TypeScript SDK v2)

Covers `@modelcontextprotocol/client` `2.0.0-beta.2`. Requires Node.js ≥ 20. Official reference: https://ts.sdk.modelcontextprotocol.io/v2/

## Before scaffolding

New client and no `docs/mcp-decisions.md` yet? Load `mcp-interview` first — this skill implements decisions, it doesn't make them.

## 1. Connect and disconnect

See [Constructor & connect example](references/examples.md#constructor--connect).

- `connect()` performs the handshake with the server.
- After connecting: `getServerVersion()`, `getServerCapabilities()` (only request what the server actually declared), `getInstructions()` (the server's usage guidance), `getProtocolEra()` (`'legacy'` or `'modern'`).
- To close: `await transport.terminateSession()` first, then `await client.close()`.

## 2. Transports

| Transport                       | Use                                                                                             |
| ------------------------------- | ----------------------------------------------------------------------------------------------- |
| `StreamableHTTPClientTransport` | Remote servers over HTTP (default choice).                                                      |
| `StdioClientTransport`          | A local server as a child process — the transport spawns it; never start it yourself.           |
| `SSEClientTransport`            | Legacy fallback for older remote servers — try Streamable first, retry on a **fresh** `Client`. |
| `InMemoryTransport`             | In-process testing.                                                                             |

## 3. Calling tools and resources

See [Calling tools and resources example](references/examples.md#calling-tools-and-resources).

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

## 4. Version negotiation

Two protocol eras: legacy (2024/2025) and modern (2026-07-28). `versionNegotiation.mode` controls how the client picks:

- `'legacy'` (default) — always negotiates the older era.
- `'auto'` — tries modern first, falls back to legacy if the server doesn't support it.
- An explicit version pins the client to exactly that era.

```ts
const client = new Client(
  { name: "my-client", version: "1.0.0" },
  { versionNegotiation: { mode: "auto" } },
);
```

- `'auto'` probes with `server/discover`; tune with `probe: { timeoutMs, maxRetries }`. `supportedProtocolVersions` shapes the probe — removing every pre-2026 entry removes the legacy fallback.
- Don't default a spawn-per-invocation stdio CLI to `'auto'` — a legacy stdio server stalls the probe for its full timeout.

## 5. Responding to server-initiated requests

Register the elicitation handler once, at construction:

```ts
client.setRequestHandler("elicitation/create", async (request) => {
  if (request.params.mode === "url") {
    return { action: "accept" }; // after opening the URL for the user
  }
  return { action: "accept", content: { city: "Lisbon" } }; // form response
});
```

## 6. Further reading

- `references/examples.md` — connect, call, subscribe, and middleware examples.
- `references/subscriptions-caching-middleware.md` — `subscriptions/listen`, response caching, `fetch` middleware, and deprecated `roots`.
- `mcp-auth-oauth` — authenticating the connection.
- `mcp-interaction-patterns` — elicitation and `input_required` handling in depth.
- `mcp-advanced-protocol` — raw wire schemas and gateway patterns.
- `mcp-testing-debugging` — in-process test harness and error reference.
