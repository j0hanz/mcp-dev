---
name: mcp-advanced-protocol
description: Use when MCP work needs to drop below McpServer — custom protocol methods, custom transports, raw wire messages, or an MCP gateway/proxy on the low-level Server from the TypeScript SDK v2.
user-invocable: false
metadata:
  category: technique
  triggers: custom protocol methods, custom transports, raw wire messages, mcp gateway, mcp proxy, low-level server
---

# MCP Advanced Protocol (TypeScript SDK v2)

Low-level guide for `@modelcontextprotocol/server` `2.0.0-beta.2`.
Official reference: https://ts.sdk.modelcontextprotocol.io/v2/

**Rule:** Always use `McpServer` first. Only use the low-level `Server` if you need custom features.

## When to Use

- Building custom methods, transports, or proxy servers.
- Using advanced server modes (`McpServerFactory`, `invoke()`).
- _Requirement:_ Make sure you know how to build a basic server or client first.

## 1. The Low-Level Server

The raw `Server` does nothing automatically:

- **No auto-schemas:** You must provide the exact JSON Schema for every tool.
- **No auto-validation:** You must check the input data yourself.
- **Hard errors:** Uncaught errors break the protocol connection. They do not send a friendly retry message.
- **Manual capabilities:** You must explicitly list what your server can do (like `listChanged`).
- **Fresh instances:** HTTP and stdio servers use an `McpServerFactory` to build a brand new server for every single request.

## 2. Custom Methods

- Always use a prefix for custom methods (like `acme/search`) so they do not conflict with future updates.
- You must define strict `params` and `result` schemas for them.
- Tell clients about custom features using `registerCapabilities`:

```ts
server.server.registerCapabilities({
  extensions: { 'acme/feature': { flags: ['enabled'] } },
});
```

## 3. Schemas and Validation

- You can use Zod v4, ArkType, or Valibot for your schemas.
- If using plain JSON Schema, you must use `fromJsonSchema<T>()`. The old raw-object way is gone.
- The SDK automatically picks the best validator (like AJV for Node).

## 4. Custom Transports

A custom transport needs three methods: `start`, `send`, and `close`.

- **Never call `start()` yourself.** Pass the transport to `connect()`, which will call it for you.
- `close()` must trigger the `onclose` callback before it finishes.
- If `send()` fails, throw an error. Only use `onerror` for major connection drops.

## 5. Gateways & Proxies

- **`invoke(server, message, ctx)`**: Sends one message directly to a server and returns the HTTP `Response`. Use this for custom gateways.
- **`isLegacyRequest(request)`**: Helps route older (2025) traffic.

## Examples

Check these files for exact code:

- Custom setups & transports: [references/examples.md](https://www.google.com/search?q=references/examples.md)
- Gateways & raw schemas: [references/wire-schemas-and-gateways.md](https://www.google.com/search?q=references/wire-schemas-and-gateways.md)

## Common Mistakes

- Using the low-level `Server` when `McpServer` is enough.
- Calling `start()` manually on custom transports.
- Letting errors crash the server instead of handling them cleanly.
