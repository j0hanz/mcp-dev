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

1. **Configure ESM**: Standardize to ESM-only (`"type": "module"` in `package.json`, `"NodeNext"` resolutions in `tsconfig.json`). v2 ships a CommonJS build too, so CJS projects can `require('@modelcontextprotocol/client')` directly — no dynamic `import()` shim required.

2. **Initialize Client**: `new Client({...})`, declaring capacities up front in the constructor — **elicitation is mandatory**; sampling (`createMessage`) and roots (`roots/list`) are deprecated per SEP-2577, so declare them only if you need legacy support. Pass paths via tool arguments / resource URIs / host config instead of roots.

3. **Pick Transport & Connect**: Choose by server transport, then `await client.connect(transport)`:
   - **Streamable HTTP** (default): `StreamableHTTPClientTransport`.
   - **stdio**: `StdioClientTransport` from the `@modelcontextprotocol/client/stdio` subpath.
   - **SSE-only legacy server**: `SSEClientTransport` — only after StreamableHTTP fails; SSE is a fallback, not a first choice.
   - **Negotiation footgun**: For spawn-per-invocation stdio CLI wrappers, pin the era with `{ pin: '2026-07-28' }` (modern-only) or `'legacy'` — **never `'auto'`**, which stalls on cold spawns. `'auto'` is fine for long-lived connections.

4. **Register Hook Interceptors**: After `connect`, register handlers via `setRequestHandler('elicitation/create', …)` for auto-fulfillment. Register `sampling/createMessage` / `roots/list` handlers only if you declared those (deprecated) capacities in Step 2.

5. **Manage Calls**: Call tools with `.callTool()` and paginate; check execution status on the `result.isError` payload — do **not** catch standard tool exceptions as business failures.

6. **Graceful Terminate**: On every shutdown **and** error path, run `await transport.terminateSession()` then `await client.close()` to avoid dangling connections.

## Completion Criteria

To consider a client implementation complete, you must verify:

- [ ] ESM-only config is active in `tsconfig.json` (or CJS `require` resolves natively).
- [ ] Handshakes use the correct negotiation mode: `'auto'` for long-lived connections; `{ pin: '2026-07-28' }` or `'legacy'` for spawn-per-invocation stdio CLI (never `'auto'` there — it stalls).
- [ ] Client declares capacities (elicitation mandatory; sampling/roots only if used) in the constructor BEFORE registering handlers.
- [ ] Success checks read `result.isError` directly instead of catching exceptions for standard tool responses.
- [ ] Sessions terminate gracefully on shutdown AND error paths: `terminateSession()` + `close()` always run.
- [ ] Multi-user response caches set `cachePartition` so `'private'` entries never cross user/tenant boundaries.

## Reference Guides

- Connection, tools, subscriptions, middleware: [references/examples.md](references/examples.md)
- Subscriptions, caching, middleware, roots: [references/subscriptions-caching-middleware.md](references/subscriptions-caching-middleware.md)

## Common Mistakes

- **Exception Traps**: Catching standard exceptions for tool-side errors (check `result.isError` instead).
- **Spawn Negotiation**: Using `'auto'` version negotiation on stdio CLI wrappers (stalls connections — pin the era).
- **Haphazard Registration**: Registering capability handlers before declaring those capacities in client options.
