---
name: mcp-client
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
- Connection troubleshooting or tests (load [mcp-test]).

## Steps

1. **Configure ESM**: Standardize project files to ESM-only (`"type": "module"` in `package.json`, `"NodeNext"` resolutions in `tsconfig.json`).
2. **Initialize Client**: Initialize `new Client(...)` with your configurations, setting target credentials or capacities parameters (declaring roots upfront is mandatory).
3. **Establish Transport Connection**: Instantiate transport layers (`StreamableHTTPClientTransport`, `StdioClientTransport`) and connect with `await client.connect(transport)`.
4. **Register Hook Interceptors**: Register handlers afterward via `client.setRequestHandler('elicitation/create' | 'sampling/createMessage' | 'roots/list', ...)` to negotiate auto-fulfilment.
5. **Manage Calls**: Call tools with `.callTool()` and paginations, verifying execution status on the `isError` payload.
6. **Graceful Terminate**: Wrap termination within session endpoints with `await transport.terminateSession()` and `await client.close()`.

## Completion Criteria

To consider a client implementation complete, you must verify:

- [ ] ESM-only configurations are active within `tsconfig.json`.
- [ ] Handshakes utilize the correct negotiation mode (`'auto'` or `'legacy'`). Avoid `'auto'` negotiation on spawn-per-invocation CLI tools to prevent legacy stalls.
- [ ] Client declares capacities (elicitation, sampling, roots) in the constructor option BEFORE registering handler endpoints.
- [ ] Execution success blocks check `result.isError` directly instead of catching exceptions on standard tool responses.
- [ ] Sessions are terminated gracefully: `await transport.terminateSession()` and `await client.close()` run on shutdown/error paths, leaving no dangling connections.
- [ ] Multi-user response cache stores set `cachePartition` so `'private'` cache entries never cross user/tenant boundaries.

## Reference Guides

- Connection, tools, subscriptions, middleware: [references/examples.md](references/examples.md)
- Subscriptions, caching, middleware, roots: [references/subscriptions-caching-middleware.md](references/subscriptions-caching-middleware.md)

## Common Mistakes

- **Exception Traps**: Catching standard exceptions for tool-side errors (check `result.isError` instead of using try-catch blocks for business logic failures).
- **Spawn Negotiation**: Configuring `'auto'` version negotiation on stdio-based CLI wrappers (stalls connections).
- **Haphazard Registration**: Registering handlers for capability routes before declaring those capabilities in the client options.
