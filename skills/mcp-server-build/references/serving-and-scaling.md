# Serving & Scaling — createMcpHandler, adapters, sessions, notifications

## `createMcpHandler` options

```ts
const handler = createMcpHandler(factory, {
  responseMode: "auto", // 'auto' | 'json' | 'sse'
  legacy: "stateless", // 'stateless' (default) | 'reject'
  bus: new InMemoryServerEventBus(),
});
// handler: { fetch(request, ctx?), close(), notify, bus }
```

- `handler.fetch` is a web-standard `(Request) => Promise<Response>`.
- `responseMode`: `'auto'` answers with a single JSON body, upgrading to SSE only when a notification precedes the result; `'json'` never streams (drops mid-call notifications); `'sse'` always streams. `subscriptions/listen` streams stay SSE regardless.
- `handler.close()` aborts in-flight exchanges; `fetch` then throws.

## Framework adapters

All four are thin layers over `createMcpHandler`; each app factory pre-applies JSON body parsing (where needed) and DNS-rebinding protection.

|                  | Install                                                                    | Mount                                                                                   |
| ---------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Express**      | `@modelcontextprotocol/express` + `@modelcontextprotocol/node` + `express` | `app.all('/mcp', (req, res) => void node(req, res, req.body))`                          |
| **Hono**         | `@modelcontextprotocol/hono` + `hono`                                      | `app.all('/mcp', (c) => handler.fetch(c.req.raw, { parsedBody: c.get('parsedBody') }))` |
| **Fastify**      | `@modelcontextprotocol/fastify` + `@modelcontextprotocol/node` + `fastify` | `app.all('/mcp', (req, reply) => node(req.raw, reply.raw, req.body))`                   |
| **Web-standard** | `@modelcontextprotocol/server` only                                        | `export default handler`                                                                |

Hono mounts differently because it runs on `WebStandardStreamableHTTPServerTransport` and calls `handler.fetch()` directly; Express and Fastify run on `NodeStreamableHTTPServerTransport` and go through `toNodeHandler` to adapt Node's `req`/`res`.

See [Framework Adapter Examples](examples.md#framework-adapters) for full Express, Fastify, and Hono setups (including DNS rebinding protection and smoke testing).

## Host/Origin security

- Framework app factories arm Host/Origin validation by default on localhost binds (DNS-rebinding defense).
- **Binding beyond localhost drops the default protection — name the hosts:** `createMcp*App({ host: '0.0.0.0', allowedHosts: ['api.example.com'], allowedOrigins: [...] })`. Hostnames are port-agnostic; requests without an `Origin` header always pass (non-browser MCP clients unaffected).
- Bare fetch runtimes: use `hostHeaderValidationResponse(request, allowedHosts)` and `originValidationResponse(request, allowedOrigins)` from `@modelcontextprotocol/server` (plus `localhostAllowedHostnames()` / `localhostAllowedOrigins()` helpers).
- Adding `/mcp` into an existing app without `createMcp*App()`: each adapter package also exports the same protection as native middleware — `hostHeaderValidation(allowedHostnames)`, `localhostHostValidation()`, `originValidation(allowedOrigins)` from `@modelcontextprotocol/express` / `@modelcontextprotocol/fastify` / `@modelcontextprotocol/hono` / `@modelcontextprotocol/node` — wire one in front of the route instead of the response-builder form above.
- Auth is pass-through: verify the bearer token in front and pass the result — `handler.fetch(request, { authInfo })` → factory `authInfo` → handler `ctx.http.authInfo`. See the `mcp-auth` skill.

## Sessions, state, scaling

- **Stateless default:** fresh instance per request, nothing held → any load balancer, no affinity, nothing to share.
- **Sessions are 2025-era only** (`Mcp-Session-Id`; the 2026-07-28 revision is per-request). Hand-wire `NodeStreamableHTTPServerTransport` with `sessionIdGenerator: () => randomUUID()` and keep a `Map<sessionId, transport>`: build on `initialize`, store in `onsessioninitialized`, route later `POST`/`GET`/`DELETE` by header, clean up in `transport.onclose`. Unknown id → `404` (client re-initializes); missing header on a non-initialize request → `400`.
- **Resumability:** pass an `eventStore` (`storeEvent(streamId, message)` → id; `replayEventsAfter(lastEventId, { send })`) and the transport stamps SSE messages with event ids; on reconnect the client sends `Last-Event-ID` and missed messages replay.
- **Cross-node notifications:** the default `InMemoryServerEventBus` never leaves the process. Implement the two-method `ServerEventBus` (`publish`, `subscribe`) over external pub/sub (e.g. Redis) and pass the same instance to every node: `createMcpHandler(buildServer, { bus: redisBus })`.

## Notifications

One-way server→client messages; change notifications invalidate what clients cached.

```ts
server.sendToolListChanged(); // notifications/tools/list_changed
server.sendPromptListChanged();
server.sendResourceListChanged();
```

Most servers never call these — registering, `update()`, `enable()`, `disable()`, `remove()` through a registration handle notify automatically.

Behind `createMcpHandler` the instance is per-request, so publish through the handler; delivery reaches every open `subscriptions/listen` stream that opted in:

```ts
handler.notify.resourceUpdated("config://app"); // needs resources: { subscribe: true } on the instance
handler.notify.toolsChanged();
handler.notify.promptsChanged();
handler.notify.resourcesChanged();
```

On stdio, `serveStdio` routes the instance's own `send*` calls onto its open subscription stream.

## Cache hints (SEP-2549)

Mark results with a freshness hint so clients can cache them; without a hint the SDK emits `ttlMs: 0` and nothing is ever served from cache:

```ts
new McpServer(
  { name: "catalog", version: "1.0.0" },
  {
    cacheHints: {
      "tools/list": { ttlMs: 60_000, cacheScope: "public" }, // 'public' only if identical for every caller
      "resources/read": { ttlMs: 5_000, cacheScope: "private" }, // default scope
    },
  },
);
// registerResource also takes a per-resource cacheHint that wins field-by-field.
```

Cacheable verbs: `tools/list`, `prompts/list`, `resources/list`, `resources/templates/list`, `resources/read`. The client half is documented in the `mcp-client-build` skill.

## Legacy clients

A legacy client speaks a 2025-era revision (`initialize` handshake, no `_meta` envelope). Both entry points serve them from the same factory by default:

- `createMcpHandler(factory, { legacy: 'stateless' | 'reject' })` — default `'stateless'` serves each legacy request per-request (legacy `GET`/`DELETE` session verbs answer `405`); `'reject'` answers `400` + `-32022 Unsupported protocol version` with `data.supported`.
- `serveStdio(factory, { legacy: 'serve' | 'reject' })` — default `'serve'`; decided once per connection.
- Keep an existing sessionful 2025 deployment by routing in front of a strict handler:

```ts
import {
  isLegacyRequest,
  legacyStatelessFallback,
} from "@modelcontextprotocol/server";

const legacy = legacyStatelessFallback(buildServer); // or existing sessionful wiring
async function serve(request: Request) {
  return (await isLegacyRequest(request))
    ? legacy(request)
    : strict.fetch(request);
}
```

- **SSE:** the v2 server never serves HTTP+SSE — migrate to Streamable HTTP. A frozen v1 copy ships as `@modelcontextprotocol/server-legacy/sse` (deprecated). v2 _clients_ keep `SSEClientTransport`, so they still reach old SSE servers.
