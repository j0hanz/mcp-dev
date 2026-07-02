# Migration Reference Tables

## Package split

| Package                               | Purpose                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------- |
| `@modelcontextprotocol/server`        | `McpServer`, low-level `Server`, `createMcpHandler`, errors, validators               |
| `@modelcontextprotocol/client`        | `Client`, HTTP/SSE transports, OAuth & machine-auth providers, middleware, caching    |
| `@modelcontextprotocol/node`          | Node HTTP adapter: `toNodeHandler`, `NodeStreamableHTTPServerTransport`               |
| `@modelcontextprotocol/express`       | Express adapter + resource-server auth (`requireBearerAuth`, `mcpAuthMetadataRouter`) |
| `@modelcontextprotocol/hono`          | Hono adapter (`createMcpHonoApp`)                                                     |
| `@modelcontextprotocol/fastify`       | Fastify adapter (`createMcpFastifyApp`)                                               |
| `@modelcontextprotocol/core`          | Raw Zod wire schemas for gateways/proxies                                             |
| `@modelcontextprotocol/server-legacy` | Frozen v1 SSE transport + OAuth AS helpers (migration only)                           |
| `@modelcontextprotocol/codemod`       | The migration CLI                                                                     |

## Key renames

| v1                                                            | v2                                                                                                                                                                                |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server.tool()` / `.prompt()` / `.resource()`                 | `registerTool` / `registerPrompt` / `registerResource`                                                                                                                            |
| `McpError` / `ErrorCode`                                      | `ProtocolError` / `ProtocolErrorCode` (local-only members → `SdkErrorCode`)                                                                                                       |
| `StreamableHTTPError`                                         | `SdkHttpError` (constructor shape changed)                                                                                                                                        |
| `RequestHandlerExtra` (`extra`)                               | `ServerContext` / `ClientContext` (`ctx`) — no type parameters                                                                                                                    |
| `extra.signal` / `requestId` / `_meta`                        | `ctx.mcpReq.signal` / `ctx.mcpReq.id` / `ctx.mcpReq._meta`                                                                                                                        |
| `extra.sendRequest` / `sendNotification`                      | `ctx.mcpReq.send` / `ctx.mcpReq.notify`                                                                                                                                           |
| `extra.authInfo` / `requestInfo`                              | `ctx.http?.authInfo` / `ctx.http?.req` (optional — `undefined` on stdio)                                                                                                          |
| `server.sendLoggingMessage` / `elicitInput` / `createMessage` | `ctx.mcpReq.log` / `elicitInput` / `requestSampling` (log & sampling deprecated)                                                                                                  |
| `StreamableHTTPServerTransport`                               | `NodeStreamableHTTPServerTransport` (`@modelcontextprotocol/node`) or `WebStandardStreamableHTTPServerTransport` (`@modelcontextprotocol/server`) — or better, `createMcpHandler` |
| `IsomorphicHeaders`                                           | Web-standard `Headers`                                                                                                                                                            |
| `SchemaInput<T>`                                              | `StandardSchemaWithJSON.InferInput<T>`                                                                                                                                            |
| `ResourceTemplate` wire **type**                              | `ResourceTemplateType` (the URI-template helper **class** keeps its name)                                                                                                         |

## Adopting the 2026-07-28 era

| Axis                      | 2025 era (`legacy`)                              | 2026 era (`modern`)                             |
| ------------------------- | ------------------------------------------------ | ----------------------------------------------- |
| Server HTTP entry         | `*StreamableHTTPServerTransport`                 | `createMcpHandler`                              |
| Server stdio entry        | `server.connect(new StdioServerTransport())`     | `serveStdio(factory)`                           |
| Client connect            | `initialize` handshake                           | `server/discover` probe                         |
| Client identity on server | `getClientCapabilities()` / `getClientVersion()` | `ctx.mcpReq.envelope` (per request)             |
| Server→client requests    | `ctx.mcpReq.elicitInput` / `requestSampling`     | `return inputRequired(...)`                     |
| Change notifications      | unsolicited `list_changed` / `resources/updated` | `subscriptions/listen` stream                   |
| Client cancel (HTTP)      | POST `notifications/cancelled`                   | close the request's SSE stream                  |
| `ctx.mcpReq.log()` filter | session `logging/setLevel`                       | per-request `_meta.logLevel` (absent = no logs) |
| HTTP `400` JSON-RPC error | `SdkHttpError`                                   | `ProtocolError`, in-band                        |
