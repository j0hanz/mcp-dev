---
description: Express framework adapter and security guidelines for MCP SDK v2.
metadata:
  tags: [express, security, cors, csrf, dns-rebinding]
  source: internal
---

# Express Adapter & Security Reference

In the v2 SDK, MCP request handling is decoupled into web-standard HTTP handlers (`createMcpHandler`) adapted to web-standard or Node.js frameworks.

## Security Concepts

MCP servers binding to localhost are vulnerable to DNS Rebinding and CSRF.

### DNS Rebinding Protection

All adapters check the incoming `Host` header against allowed hostnames (e.g. `localhost`, `127.0.0.1`, `[::1]`). Unlisted hosts are rejected with `400 Bad Request` or `403 Forbidden`.

### Browser Origin Validation

Adapters check the `Origin` header against an allowed origins list. Requests with no `Origin` pass (allowing local non-browser clients), while cross-origin browser requests are rejected with `403 Forbidden`.

## Express Integration

Provides Express middleware, routers, and application bootstrap helpers.

Install dependencies: `npm i @modelcontextprotocol/server @modelcontextprotocol/express @modelcontextprotocol/node express`

### API Reference

#### `createMcpExpressApp(options?)`

Initializes an Express app with DNS/Origin validations.

- **Options**:
  - `host?: string`: Bind hostname (default: `'127.0.0.1'`).
  - `allowedHosts?: string[]`: Allowed hostnames.
  - `allowedOrigins?: string[]`: Allowed origins.
  - `jsonLimit?: string`: Request body limit (default: `'100kb'`).

#### Middleware & Auth

- `hostHeaderValidation(allowedHostnames: string[]): RequestHandler`
- `localhostHostValidation(): RequestHandler`
- `originValidation(allowedOriginHostnames: string[]): RequestHandler`
- `localhostOriginValidation(): RequestHandler`
- `requireBearerAuth(options: BearerAuthMiddlewareOptions): RequestHandler`
  Requires Bearer token, setting authenticated info to `req.auth`.
- `mcpAuthMetadataRouter(options: AuthMetadataOptions): Router`
  Exposes RFC 9728 and RFC 8414 OAuth metadata paths.

### Usage Examples

#### Stateless Server

```ts
const handler = createMcpHandler(() => {
  const server = new McpServer({ name: 'express', version: '1.0.0' });
  server.registerTool(
    'echo',
    { inputSchema: z.object({ text: z.string() }) },
    async ({ text }) => ({ content: [{ type: 'text', text }] }),
  );
  return server;
});
const app = createMcpExpressApp();
const node = toNodeHandler(handler);
app.all('/mcp', (req, res) => void node(req, res, req.body));
app.listen(3000);
```

#### OAuth Resource Server Setup

```ts
// Mount metadata router
app.use(
  mcpAuthMetadataRouter({
    resourceServerUrl: resourceUrl,
    oauthMetadata: {
      issuer: 'https://a.com',
      token_endpoint: 'https://a.com/t',
      authorization_endpoint: 'https://a.com/auth',
    },
    scopesSupported: ['mcp:read'],
  }),
);
```

```ts
// Protect route with Bearer auth middleware
app.post(
  '/mcp',
  requireBearerAuth({
    verifier: {
      verifyAccessToken: async (token) => ({
        sub: 'user',
        scopes: ['mcp:read'],
        expiresAt: new Date(),
      }),
    },
    requiredScopes: ['mcp:read'],
    resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(resourceUrl),
  }),
  (req, res) => res.json({ status: 'auth', info: req.auth }),
);
```
