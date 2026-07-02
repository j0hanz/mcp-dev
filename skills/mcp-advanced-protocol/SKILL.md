---
name: mcp-advanced-protocol
description: This skill should be used when the user asks to "use the low-level MCP Server", "add a custom MCP method", "write a custom transport", "validate raw MCP messages", "build an MCP gateway or proxy", or mentions setRequestHandler, extension capabilities, ReadBuffer, @modelcontextprotocol/core, wire schemas, fromJsonSchema, or DiscoverResult from the MCP TypeScript SDK v2.
user-invocable: false
---

# MCP Advanced Protocol (TypeScript SDK v2)

Covers the low-level parts of `@modelcontextprotocol/server` `2.0.0-beta.2` that `McpServer` hides. Official reference: https://ts.sdk.modelcontextprotocol.io/v2/

**Default to `McpServer`.** Drop to the low-level `Server` (`mcp.server.setRequestHandler(...)`) only when you need to route methods the high-level API doesn't model.

## 1. The low-level `Server`

`Server` is the raw protocol engine — nothing is automatic:

- Callers supply the JSON Schema for every tool; there's no Zod-to-JSON-Schema derivation.
- Incoming arguments aren't validated automatically — validate them before use.
- An uncaught throw becomes a JSON-RPC **protocol error**, not an `isError` result — the model doesn't get a retry hint, the caller's code does.
- Capabilities aren't inferred from registrations; declare `listChanged` etc. explicitly or list-change notifications throw.

See [Low-level Server example](references/examples.md#low-level-server).

## 2. Custom methods & extension capabilities

- Namespace custom methods (`acme/search`, never bare `search`) to avoid colliding with future protocol methods.
- Custom methods need explicit `params`/`result` schemas on both sides; built-in protocol methods already have theirs and don't take one.
- Advertise non-standard behavior via `registerCapabilities({ extensions: { ... } })` so clients can feature-detect it.

```ts
mcp.server.registerCapabilities({
  extensions: { "com.example/feature-flags": { flags: ["dark-mode"] } },
});
```

See [Custom methods example](references/examples.md#custom-methods-and-extension-capabilities).

## 3. Schema libraries and validators

Any Standard Schema (Zod v4, ArkType, Valibot via `toStandardJsonSchema`) works as-is for `inputSchema`/`outputSchema`. Plain JSON Schema needs `fromJsonSchema<T>()` to type the handler's args — the old bare-object form (`inputSchema: { name: z.string() }`) is gone. The SDK auto-selects a JSON Schema validator (AJV on Node, a CF-Workers-safe validator elsewhere); pin one explicitly via `ServerOptions.jsonSchemaValidator` — implementations ship at `@modelcontextprotocol/server/validators/ajv` and `…/validators/cf-worker`.

See [Schema libraries example](references/examples.md#schema-libraries-and-validators).

## 4. Custom transports

Implement `Transport`: three methods (`start`, `send`, `close`) and three optional callbacks (`onmessage`, `onerror`, `onclose`).

- **Never call `start()` yourself** — pass the transport to `connect()`, which calls it.
- `close()` must trigger `onclose` before resolving.
- A failed `send()` should `throw`; reserve `onerror` for out-of-band failures (the socket dropped, not one specific send failing).
- Set `hasPerRequestStream = true` if the transport carries exactly one request per stream — it enables clean per-request cancellation.

See [Custom transports example](references/examples.md#custom-transports).

## 5. Further reading

- `references/wire-schemas-and-gateways.md` — raw wire schemas from `@modelcontextprotocol/core`, and gateway/worker-fleet patterns using `DiscoverResult`.
- `mcp-server-build` / `mcp-client-build` — reach for these first; this skill is the escape hatch.
- `mcp-test` — protocol vs. SDK error code reference.
