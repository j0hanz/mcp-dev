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

## 5. Gateways & Proxies

- **`invoke()`**: Direct server message invocation, returns HTTP `Response`.
- **`isLegacyRequest()`**: Routes legacy traffic.

## Examples

See details:

- Transports: [references/examples.md](references/examples.md)
- Gateways & Schemas: [references/wire-schemas-and-gateways.md](references/wire-schemas-and-gateways.md)

## Common Mistakes

- Using low-level `Server` when `McpServer` suffices.
- Calling `start()` on transports manually.
- Letting errors crash the connection.
