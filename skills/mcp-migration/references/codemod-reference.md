---
description: Guide to using the `@modelcontextprotocol/codemod` tool to refactor MCP codebases from v1 to v2.
metadata:
  tags: [codemod, migration, refactoring, v1-to-v2]
  source: internal
---

# Codemod Migration Tool

## CLI Usage

Run the codemod across a directory: `npx @modelcontextprotocol/codemod@beta v1-to-v2 .`

Run on a single file: `npx @modelcontextprotocol/codemod@beta v1-to-v2 src/server.ts`

## Migration Scope & Mappings

The tool automates the following mechanical refactors:

1. **Import Path Rewriting:** Replaces `@modelcontextprotocol/sdk/...` with scoped packages:
   - `@modelcontextprotocol/client`
   - `@modelcontextprotocol/server`
   - `@modelcontextprotocol/core`
   - `@modelcontextprotocol/node` / `express` / `hono` / `fastify`

> `@modelcontextprotocol/core-internal` is private — never import it directly.

2. **Symbol Renaming:**
   - `McpError` → `ProtocolError`
   - `JSONRPCError` → `JSONRPCErrorResponse`
   - `StreamableHTTPError` → `SdkHttpError`
   - `ErrorCode` → `ProtocolErrorCode` (note: `ErrorCode.RequestTimeout` / `ConnectionClosed` route to `SdkErrorCode`, not `ProtocolErrorCode` — a documented trap)
3. **Low-level Request Handlers:** Converts schema-based requests:
   - `server.setRequestHandler(CallToolRequestSchema, ...)` → `server.setRequestHandler('tools/call', ...)`
4. **Context Parameter Remapping:** Adapts `extra` parameters to v2 `ctx`:
   - `extra.signal` → `ctx.mcpReq.signal`
   - `extra.requestId` → `ctx.mcpReq.id`
   - `extra.sendRequest(...)` → `ctx.mcpReq.send(...)`
   - `extra.sendNotification(...)` → `ctx.mcpReq.notify(...)`
   - `extra.authInfo` → `ctx.http?.authInfo`
   - `extra._meta` → `ctx.mcpReq._meta`
   - `extra.sessionId` → `ctx.sessionId`
   - `extra.requestInfo` → `ctx.http?.req`
   - `extra.closeSSEStream` → `ctx.http?.closeSSE`
5. **Schema Structuring:**
   - Converts `.tool()` / `.prompt()` / `.resource()` calls to `registerTool` / `registerPrompt` / `registerResource`.
   - Wraps raw input configurations in `z.object()`.

### Code Review Comments

If a safe refactoring rule cannot be determined, the tool injects an inline error comment:

`/* @mcp-codemod-error SSEServerTransport moved to @modelcontextprotocol/server-legacy/sse. */`

Find files with warnings: `grep -rn '@mcp-codemod-error' .`
