---
name: mcp-client-build
description: Use when building MCP clients using TypeScript SDK v2 (@modelcontextprotocol/client), managing connections, calling tools/resources, subscribing to changes, caching, or configuring middleware.
user-invocable: false
metadata:
  category: technique
  triggers: mcp client, client connection, register capabilities, call tools, read resources, progress handler
---

# Building MCP Clients (TypeScript SDK v2)

Covers `@modelcontextprotocol/client` `2.0.0-beta.2`. SDK: https://ts.sdk.modelcontextprotocol.io/v2/

## When to Use

- Building/running MCP clients (connecting, tools, resources, caching, middleware).
- Connection troubleshooting or tests (load `/mcp-test`).

## How It Works

### Setup & Requirements

- SDK is ESM-only.
- **`package.json`**: `"type": "module"`
- **`tsconfig.json`**: `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`

### Transports & Connection

- **Transports**: `StreamableHTTPClientTransport` (HTTP, default), `StdioClientTransport` (local process), `SSEClientTransport` (legacy fallback), `InMemoryTransport` (testing).
- **Handshake**: `await client.connect(transport)`. Info: `getServerVersion()`, `getServerCapabilities()`, `getInstructions()`, `getProtocolEra()`.
- **Shutdown**: `await transport.terminateSession()`, then `await client.close()`.

### Calling Tools & Resources

- **Failures**: Check `result.isError` (does not throw).
- **Pagination**: List calls paginate up to `listMaxPages` (default 64). Pass `{ cursor }` for single page.
- **Options**: `onprogress`, `maxTotalTimeout`, `signal`.

```ts
const client = new Client({ name: 'my-client', version: '1.0.0' });
await client.connect(new StreamableHTTPClientTransport(new URL('http://localhost:3000/mcp')));
const result = await client.callTool({ name: 'greet', arguments: { name: 'World' } });
```

### Version Negotiation

Eras: legacy (2024/2025) and modern (2026-07-28).

- `'legacy'` (default): older era.
- `'auto'`: tries modern first. Avoid for spawn-per-invocation stdio CLI (stalls legacy).

### Multi-round-trip Auto-Fulfilment

Modern protocol uses `input_required` instead of push-style requests.

- Handled via `flow.retry`. Register handlers (elicitation, sampling, roots) at client construction (see `/mcp-elicitation`).

## Examples

- Connection, tools, subscriptions, middleware: [references/examples.md](references/examples.md)
- Subscriptions, caching, middleware, roots: [references/subscriptions-caching-middleware.md](references/subscriptions-caching-middleware.md)

## Common Mistakes

- Catching exceptions for tool errors (check `result.isError`).
- `'auto'` negotiation on stdio CLI (stalls legacy).
- Missing ESM setup.
