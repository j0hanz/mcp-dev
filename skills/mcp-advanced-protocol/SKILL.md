---
name: mcp-advanced-protocol
description: Use when MCP work needs to drop below McpServer — custom protocol methods, custom transports, raw wire messages, or an MCP gateway/proxy on the low-level Server from the TypeScript SDK v2.
user-invocable: false
metadata:
  category: technique
  triggers: custom protocol methods, custom transports, raw wire messages, mcp gateway, mcp proxy, low-level server
---

# MCP Advanced Protocol (TypeScript SDK v2)

Covers the low-level parts of `@modelcontextprotocol/server` `2.0.0-beta.2` that `McpServer` hides. Official reference: https://ts.sdk.modelcontextprotocol.io/v2/

```
McpServer (default) -> low-level Server -> custom methods -> custom transports -> gateway/proxy
```

**Default to `McpServer`.** Drop to the low-level `Server` (`mcp.server.setRequestHandler(...)`) only when you need to route methods the high-level API doesn't model.

## When to Use

- MCP work needs to drop below `McpServer` to the low-level `Server`.
- Implementing custom protocol methods, custom transports, raw wire messages, or an MCP gateway/proxy.
- Handling v2 serving modes (e.g., `McpServerFactory`, `isLegacyRequest`, or `invoke()`).
- Before using this low-level skill, ensure you have set up a standard server with the `/mcp-server-build` skill or client with the `/mcp-client-build` skill.

## How It Works

### 1. The low-level `Server`

`Server` is the raw protocol engine — nothing is automatic:

- Callers supply the JSON Schema for every tool; there's no Zod-to-JSON-Schema derivation.
- Incoming arguments aren't validated automatically — validate them before use.
- An uncaught throw becomes a JSON-RPC **protocol error**, not an `isError` result — the model doesn't get a retry hint, the caller's code does.
- Capabilities aren't inferred from registrations; declare `listChanged` etc. explicitly or list-change notifications throw.
- **v2 Serving:** The SDK serves traffic using `createMcpHandler` (HTTP) or `serveStdio` (stdio). Both take an `McpServerFactory` (`(ctx) => McpServer | Server`) that builds a fresh instance per HTTP request or connection. The same factory is used for the modern 2026-07-28 protocol and the legacy 2025-era fallback.

### 2. Custom methods & extension capabilities

- Namespace custom methods (`acme/search`, never bare `search`) to avoid colliding with future protocol methods.
- Custom methods need explicit `params`/`result` schemas on both sides; built-in protocol methods already have theirs and don't take one.
- Advertise non-standard behavior via `registerCapabilities({ extensions: { ... } })` so clients can feature-detect it.

```ts
server.server.registerCapabilities({
  extensions: { 'com.example/feature-flags': { flags: ['dark-mode'] } },
});
```

### 3. Schema libraries and validators

Any Standard Schema (Zod v4, ArkType, Valibot via `toStandardJsonSchema`) works as-is for `inputSchema`/`outputSchema`. Plain JSON Schema needs `fromJsonSchema<T>()` to type the handler's args — the old bare-object form (`inputSchema: { name: z.string() }`) is gone. The SDK auto-selects a JSON Schema validator (AJV on Node, a CF-Workers-safe validator elsewhere); pin one explicitly via `ServerOptions.jsonSchemaValidator` — implementations ship at `@modelcontextprotocol/server/validators/ajv` and `…/validators/cf-worker`.

### 4. Custom transports

Implement `Transport`: three methods (`start`, `send`, `close`) and three optional callbacks (`onmessage`, `onerror`, `onclose`).

- **Never call `start()` yourself** — pass the transport to `connect()`, which calls it.
- `close()` must trigger `onclose` before resolving.
- A failed `send()` should `throw`; reserve `onerror` for out-of-band failures (the socket dropped, not one specific send failing).

### 5. Gateways & Proxies (v2 API)

- **`invoke(server, message, ctx)`**: Serves one classified inbound message on a given server instance and returns the HTTP `Response`. It connects the instance to a single-exchange transport and pushes the message directly. Use this when building gateways that bypass standard HTTP/stdio handling.
- **`isLegacyRequest(request)`**: Routes older v2025-era stateless HTTP traffic if you are mixing strict `legacy: 'reject'` handler entries with custom backward-compatibility layers.

## Examples

Detailed implementation examples are documented in supporting reference files:

- Low-level Server, Custom methods, schemas, and transports: [references/examples.md](references/examples.md)
- Raw wire schemas and gateway patterns: [references/wire-schemas-and-gateways.md](references/wire-schemas-and-gateways.md)

## Common Mistakes

- Dropping to the low-level `Server` when `McpServer` would suffice.
- Calling `start()` on custom transports manually (pass to `connect()` instead).
- Throwing errors from tool handlers expecting protocol-level errors (they become `isError: true`).
