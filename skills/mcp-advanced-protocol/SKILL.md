---
name: mcp-advanced-protocol
description: Use when working with low-level MCP v2 protocol, custom transports, raw wire messages, gateways, or the low-level Server class.
user-invocable: false
metadata:
  category: technique
  triggers: custom methods, custom transports, raw wire messages, mcp gateway, mcp proxy, low-level server
---

# MCP Advanced Protocol

Prefer `McpServer`. Only use `Server` for custom features. Docs: https://ts.sdk.modelcontextprotocol.io/v2/

## When to Use

- Custom methods, transports, or proxy/gateways.
- Advanced modes (`McpServerFactory`, `invoke()`).

## 1. Low-Level Server

Raw `Server` does nothing automatically:

- **Manual validation:** Validate inputs and schemas manually.
- **Errors:** Uncaught errors break connection without retries.
- **Capabilities:** Declare all supported features (e.g. `listChanged`) explicitly.
- **McpServerFactory:** Instantiates servers per request on HTTP/stdio.

## 2. Custom Methods

- Prefix custom methods (e.g. `acme/search`) and define strict `params`/`result` schemas.
- Register:

```ts
server.server.registerCapabilities({
  extensions: { 'acme/feature': { flags: ['enabled'] } },
});
```

## 3. Schemas and Validation

- Use Zod v4, ArkType, Valibot, or JSON Schema (with `fromJsonSchema<T>()`).
- SDK auto-selects validator (like AJV).

## 4. Custom Transports

- Implement `start()`, `send()`, and `close()`.
- `connect()` calls `start()`; do not call it manually.
- `close()` must trigger `onclose` callback.
- Throw on `send()` failure; use `onerror` for connection drops.

## 5. Direct Invocation & Legacy Routing

- **`invoke()`**: Direct server message invocation without a real transport, returns an HTTP `Response`. See [references/examples.md](references/examples.md).
- **`isLegacyRequest()`**: Detects 2025-era requests so a single endpoint can branch between legacy and modern handling.

## 6. Gateways & Worker Fleets

Probe-once, connect-many pattern for many short-lived clients sharing one upstream connection (`DiscoverResult`), plus raw wire schemas for building proxies. See [references/wire-schemas-and-gateways.md](references/wire-schemas-and-gateways.md).

## Related Skills

- A hand-rolled transport or gateway still needs tests — use [mcp-test]'s in-process harness against it.
- A gateway/proxy forwarding to an upstream server crosses an auth boundary — verify tokens per [mcp-auth] before forwarding, don't just pass them through.

## Examples

See details:

- Transports & direct invocation: [references/examples.md](references/examples.md)
- Gateways & Schemas: [references/wire-schemas-and-gateways.md](references/wire-schemas-and-gateways.md)

## Common Mistakes

- Using low-level `Server` when `McpServer` suffices.
- Calling `start()` on transports manually.
- Letting errors crash the connection.
