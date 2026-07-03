---
description: API reference for MCP TypeScript SDK v2 framework adapters (Express, Fastify, Hono) and the migration codemod tool.
metadata:
  tags: [express, fastify, hono, codemod, migration, typescript]
  source: internal
---

# MCP TypeScript SDK v2: Framework Adapters and Codemod API Reference

This document provides a comprehensive API reference for the Model Context Protocol (MCP) TypeScript SDK v2 framework integrations—`@modelcontextprotocol/express`, `@modelcontextprotocol/fastify`, and `@modelcontextprotocol/hono`—as well as the `@modelcontextprotocol/codemod` migration utility.

In the v2 SDK, the core is stateless. Rather than holding long-lived connection transports directly in the application server, MCP request handling is decoupled into web-standard HTTP handlers (`createMcpHandler`) and adapted to Node.js or web-standard frameworks.

---

## Table of Contents

1. [Shared Security Concepts](#shared-security-concepts)
2. [@modelcontextprotocol/express](#modelcontextprotocolexpress)
   - [Overview & Installation](#overview--installation-express)
   - [API Reference](#api-reference-express)
   - [Usage Examples](#usage-examples-express)
3. [@modelcontextprotocol/fastify](#modelcontextprotocolfastify)
   - [Overview & Installation](#overview--installation-fastify)
   - [API Reference](#api-reference-fastify)
   - [Usage Examples](#usage-examples-fastify)
4. [@modelcontextprotocol/hono](#modelcontextprotocolhono)
   - [Overview & Installation](#overview--installation-hono)
   - [API Reference](#api-reference-hono)
   - [Usage Examples](#usage-examples-hono)
5. [@modelcontextprotocol/codemod](#modelcontextprotocolcodemod)
   - [Overview & CLI Usage](#overview--cli-usage)
   - [Migration Mappings & Scope](#migration-mappings--scope)
   - [Programmatic API Reference](#programmatic-api-reference)

---

## Shared Security Concepts

MCP servers binding to localhost or local network interfaces are vulnerable to **DNS Rebinding** and **Cross-Site Request Forgery (CSRF)**. Framework adapters in the v2 SDK introduce standard security protections out of the box.

### DNS Rebinding Protection

A malicious webpage can configure its DNS record to rebind to `127.0.0.1`. A browser, treating the malicious domain as same-origin, would then allow scripts to reach the local MCP server.

- **Host Header Validation**: All adapters check the incoming `Host` header against a list of allowed hostnames (e.g., `localhost`, `127.0.0.1`, `[::1]`). Requests containing unlisted hostnames are rejected with `400 Bad Request` or `403 Forbidden` before handlers run.

### Browser Origin Validation

Browsers automatically attach the `Origin` header to cross-origin requests.

- **Origin Header Validation**: Adapters check the `Origin` header against an allowed origins list. By default (localhost-class binds), requests with no `Origin` header pass (allowing non-browser MCP clients), while cross-origin browser requests are rejected with `403 Forbidden`.

---

## @modelcontextprotocol/express

An integration layer providing Express middleware, routers, and application bootstrap helpers for MCP servers.

### Overview & Installation (Express)

```bash
npm install @modelcontextprotocol/server @modelcontextprotocol/express express
# For MCP Streamable HTTP over Node (IncomingMessage/ServerResponse adaptation):
npm install @modelcontextprotocol/node
```

### API Reference (Express)

#### `createMcpExpressApp(options?)`

Creates a pre-configured Express application containing standard body parsing and default DNS rebinding/Origin validation protections.

- **Signature:**

  ```ts
  function createMcpExpressApp(options?: CreateMcpExpressAppOptions): Express;
  ```

- **`CreateMcpExpressAppOptions`:**

  ```ts
  interface CreateMcpExpressAppOptions {
    /**
     * The hostname to bind to. Defaults to '127.0.0.1'.
     * Automatic DNS rebinding protection applies when set to '127.0.0.1', 'localhost', or '::1'.
     */
    host?: string;
    /**
     * List of allowed hostnames for DNS rebinding protection.
     * Useful when binding to '0.0.0.0' but restricting traffic to specific domains.
     * For IPv6, include brackets, e.g. '[::1]'.
     */
    allowedHosts?: string[];
    /**
     * Allowed origin hostnames for Origin Header validation.
     * When omitted, Origin validation is enabled automatically for localhost binds.
     */
    allowedOrigins?: string[];
    /**
     * Max request body size for JSON body parsing. Passed to express.json({ limit }).
     * Defaults to '100kb'. Examples: '1mb', '10mb'.
     */
    jsonLimit?: string;
  }
  ```

#### Middleware Helpers

- `hostHeaderValidation(allowedHostnames: string[]): RequestHandler`
  Validates that the incoming request's `Host` matches the allowed list.
- `localhostHostValidation(): RequestHandler`
  Convenience middleware allowing only `localhost`, `127.0.0.1`, and `[::1]`.
- `originValidation(allowedOriginHostnames: string[]): RequestHandler`
  Validates browser `Origin` headers (port-agnostic).
- `localhostOriginValidation(): RequestHandler`
  Convenience middleware allowing only origins from localhost.

#### OAuth / Authentication Helpers

- `requireBearerAuth(options: BearerAuthMiddlewareOptions): RequestHandler`
  Forces requests to present a valid Bearer token. Adapts validated `AuthInfo` onto `req.auth` and passes it to the server context.

  ```ts
  interface BearerAuthMiddlewareOptions {
    verifier: OAuthTokenVerifier;
    requiredScopes?: string[];
    resourceMetadataUrl?: string; // Built with getOAuthProtectedResourceMetadataUrl
  }
  ```

- `OAuthTokenVerifier` (Interface)

  ```ts
  interface OAuthTokenVerifier {
    verifyAccessToken(token: string): Promise<AuthInfo>;
  }
  ```

- `mcpAuthMetadataRouter(options: AuthMetadataOptions): Router`
  Exposes RFC 9728 Protected Resource Metadata at `/.well-known/oauth-protected-resource` and RFC 8414 AS Metadata at `/.well-known/oauth-authorization-server`.

  ```ts
  interface AuthMetadataOptions {
    oauthMetadata: OAuthMetadata; // Auth Server Metadata
    resourceServerUrl: URL; // Public URL of the MCP server
    serviceDocumentationUrl?: URL;
    scopesSupported?: string[];
    resourceName?: string;
  }
  ```

- `getOAuthProtectedResourceMetadataUrl(serverUrl: URL): string`
  Derives the RFC 9728 URL from the root server URL by appending the well-known path.

### Usage Examples (Express)

#### Stateless Per-Request Integration

In the stateless model, a server factory runs once per request, ensuring clean isolation.

```ts
import { createMcpExpressApp } from '@modelcontextprotocol/express';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';

const mcpHandler = createMcpHandler(() => {
  const server = new McpServer({ name: 'express-example', version: '1.0.0' });

  server.registerTool(
    'echo',
    {
      description: 'Echoes back input',
      inputSchema: z.object({ text: z.string() }),
    },
    async ({ text }) => ({
      content: [{ type: 'text', text: `Echo: ${text}` }],
    }),
  );

  return server;
});

const app = createMcpExpressApp();
const nodeHandler = toNodeHandler(mcpHandler);

// Adapt the web-standard handler to Express's (req, res) structure
app.all('/mcp', (req, res) => void nodeHandler(req, res, req.body));

app.listen(3000, '127.0.0.1', () => {
  console.log('MCP Server running on http://127.0.0.1:3000/mcp');
});
```

#### OAuth Protected Resource Server

```ts
import {
  createMcpExpressApp,
  requireBearerAuth,
  mcpAuthMetadataRouter,
  getOAuthProtectedResourceMetadataUrl,
} from '@modelcontextprotocol/express';
import { AuthInfo } from '@modelcontextprotocol/server';

const tokenVerifier = {
  async verifyAccessToken(token: string): Promise<AuthInfo> {
    if (token !== 'valid-token') {
      throw new Error('Invalid token');
    }
    return {
      sub: 'user-123',
      scopes: ['mcp:read'],
      expiresAt: new Date(Date.now() + 3600 * 1000),
    };
  },
};

const app = createMcpExpressApp();
const resourceUrl = new URL('http://127.0.0.1:3000');

// Mount Metadata Discovery Routes
app.use(
  mcpAuthMetadataRouter({
    resourceServerUrl: resourceUrl,
    oauthMetadata: {
      issuer: 'https://auth.example.com',
      token_endpoint: 'https://auth.example.com/token',
      authorization_endpoint: 'https://auth.example.com/authorize',
    },
    scopesSupported: ['mcp:read'],
  }),
);

// Protect MCP Route
app.post(
  '/mcp',
  requireBearerAuth({
    verifier: tokenVerifier,
    requiredScopes: ['mcp:read'],
    resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(resourceUrl),
  }),
  (req, res) => {
    // Authenticated AuthInfo is at req.auth
    res.json({ status: 'authenticated', info: req.auth });
  },
);
```

---

## @modelcontextprotocol/fastify

A Fastify plugin and configuration integration layer for running MCP servers.

### Overview & Installation (Fastify)

```bash
npm install @modelcontextprotocol/server @modelcontextprotocol/fastify @modelcontextprotocol/node fastify
```

### API Reference (Fastify)

#### `createMcpFastifyApp(options?)`

Initializes a Fastify application with integrated DNS rebinding protection and Origin validation hooks. Fastify parses JSON bodies by default, so no additional JSON parser configuration is required.

- **Signature:**

  ```ts
  function createMcpFastifyApp(options?: CreateMcpFastifyAppOptions): FastifyInstance;
  ```

- **`CreateMcpFastifyAppOptions`:**

  ```ts
  interface CreateMcpFastifyAppOptions {
    /**
     * The hostname to bind to. Defaults to '127.0.0.1'.
     * Automatic DNS rebinding protection applies when set to '127.0.0.1', 'localhost', or '::1'.
     */
    host?: string;
    /**
     * Allowed hostnames for Host Header validation.
     */
    allowedHosts?: string[];
    /**
     * Allowed origin hostnames for Origin Header validation.
     */
    allowedOrigins?: string[];
  }
  ```

#### Hooks & Utility Middleware

- `hostHeaderValidation(allowedHostnames: string[]): (request: FastifyRequest, reply: FastifyReply) => Promise<void>`
  onRequest hook for custom Host validation.
- `localhostHostValidation(): (request: FastifyRequest, reply: FastifyReply) => Promise<void>`
  Convenience hook restricting access to localhost hostnames.
- `originValidation(allowedOrigins: string[]): (request: FastifyRequest, reply: FastifyReply) => Promise<void>`
  onRequest hook validating origins.
- `localhostOriginValidation(): (request: FastifyRequest, reply: FastifyReply) => Promise<void>`
  Convenience hook restricting access to localhost origins.

### Usage Examples (Fastify)

#### Stateless Per-Request Integration

Adapts `createMcpHandler` using `toNodeHandler` in Fastify by feeding raw Node request and response objects.

```ts
import { createMcpFastifyApp } from '@modelcontextprotocol/fastify';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';

const mcpHandler = createMcpHandler(() => {
  const server = new McpServer({ name: 'fastify-example', version: '1.0.0' });
  server.registerTool(
    'greet',
    {
      inputSchema: z.object({ name: z.string() }),
    },
    async ({ name }) => ({
      content: [{ type: 'text', text: `Hello, ${name}!` }],
    }),
  );
  return server;
});

const app = createMcpFastifyApp();
const nodeHandler = toNodeHandler(mcpHandler);

app.all('/mcp', async (request, reply) => {
  // Fastify route forwards raw Node.js streams to the adapter
  await nodeHandler(request.raw, reply.raw, request.body);
});

app.listen({ port: 3000, host: '127.0.0.1' }, () => {
  console.log('MCP Fastify Server running at http://127.0.0.1:3000/mcp');
});
```

---

## @modelcontextprotocol/hono

Adapter for Hono, suitable for Node.js, Bun, Deno, Deno Deploy, Cloudflare Workers, and other web-standard environments.

### Overview & Installation (Hono)

```bash
npm install @modelcontextprotocol/server @modelcontextprotocol/hono hono
```

### API Reference (Hono)

#### `createMcpHonoApp(options?)`

Creates a Hono application pre-configured with JSON body parsing and default DNS rebinding/Origin validation protections. The JSON body parsing middleware registers the parsed body as `c.get('parsedBody')`.

- **Signature:**

  ```ts
  function createMcpHonoApp(options?: CreateMcpHonoAppOptions): Hono;
  ```

- **`CreateMcpHonoAppOptions`:**

  ```ts
  interface CreateMcpHonoAppOptions {
    /**
     * The hostname to bind to. Defaults to '127.0.0.1'.
     * Automatic DNS rebinding protection applies when set to '127.0.0.1', 'localhost', or '::1'.
     */
    host?: string;
    /**
     * Allowed hostnames for Host Header validation.
     */
    allowedHosts?: string[];
    /**
     * Allowed origin hostnames for Origin Header validation.
     */
    allowedOrigins?: string[];
  }
  ```

#### Middleware Helpers

- `hostHeaderValidation(allowedHostnames: string[]): MiddlewareHandler`
  Hono middleware for Host header validation.
- `localhostHostValidation(): MiddlewareHandler`
  Convenience middleware for localhost.
- `originValidation(allowedOrigins: string[]): MiddlewareHandler`
  Hono middleware validating origins.
- `localhostOriginValidation(): MiddlewareHandler`
  Convenience middleware validating localhost origins.

### Usage Examples (Hono)

#### Web Standard Routing (Cloudflare Workers / Deno / Bun)

Since Hono works natively with Web Standards (`Request` and `Response`), it does not require a Node.js adapter. Instead, you call `handler.fetch(c.req.raw, { parsedBody: c.get('parsedBody') })` directly.

> [!IMPORTANT]
> Always declare the explicit type annotation `c: Context` on Hono handlers. If omitted, the context type inference will cause `c.get` to narrow keys to `never`, failing compilation.

```ts
import { createMcpHonoApp } from '@modelcontextprotocol/hono';
import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import type { Context } from 'hono';
import { z } from 'zod';

const mcpHandler = createMcpHandler(() => {
  const server = new McpServer({ name: 'hono-example', version: '1.0.0' });
  server.registerTool(
    'calculate',
    {
      inputSchema: z.object({ val: z.number() }),
    },
    async ({ val }) => ({
      content: [{ type: 'text', text: `Result: ${val * 2}` }],
    }),
  );
  return server;
});

const app = createMcpHonoApp();

app.all('/mcp', (c: Context) => {
  return mcpHandler.fetch(c.req.raw, { parsedBody: c.get('parsedBody') });
});

export default app;
```

#### Node.js Server Run Example

To run the Hono application in a Node.js runtime, use Hono's Node.js adapter:

```ts
import { serve } from '@hono/node-server';
import app from './app'; // export default app from above

serve({
  fetch: app.fetch,
  port: 3000,
});
```

---

## @modelcontextprotocol/codemod

A programmatic API and command-line tool to automate the mechanical refactoring of MCP TypeScript codebases migrating from v1 to v2.

### Overview & CLI Usage

The codemod operates directly on standard TypeScript and JavaScript files. It processes AST representations, applies modifications in-place, and updates `package.json` dependencies based on actual package usage.

```bash
# Run v1-to-v2 codemod across a directory
npx @modelcontextprotocol/codemod@beta v1-to-v2 .

# Run on a single file
npx @modelcontextprotocol/codemod@beta v1-to-v2 src/server.ts
```

### Migration Mappings & Scope

The v1-to-v2 migration handles the following refactors:

1. **Import Path Rewriting (`importMap.ts`):** Replaces `@modelcontextprotocol/sdk/...` imports with their corresponding scoped package equivalents:
   - `@modelcontextprotocol/client`
   - `@modelcontextprotocol/server`
   - `@modelcontextprotocol/core` (specifically for spec `*Schema` types)
   - `@modelcontextprotocol/node` / `express` / `hono` / `fastify`
2. **Symbol Renaming (`symbolMap.ts`):**
   - `McpError` $\rightarrow$ `ProtocolError`
   - `JSONRPCError` $\rightarrow$ `JSONRPCErrorResponse`
   - `StreamableHTTPError` $\rightarrow$ `SdkHttpError`
   - `IsomorphicHeaders` $\rightarrow$ `Headers` (Web Standard)
   - `ErrorCode` $\rightarrow$ `ProtocolErrorCode`
3. **Low-level Request Handlers (`schemaToMethodMap.ts`):** Converts schema-based request handler calls to spec method strings:
   - `server.setRequestHandler(CallToolRequestSchema, ...)` $\rightarrow$ `server.setRequestHandler('tools/call', ...)`
4. **Context Parameter Remapping (`contextPropertyMap.ts`):** Adapts the v1 handler `extra` parameter to the v2 `ctx` structure:
   - `extra.signal` $\rightarrow$ `ctx.mcpReq.signal`
   - `extra.requestId` $\rightarrow$ `ctx.mcpReq.id`
   - `extra.sendRequest(...)` $\rightarrow$ `ctx.mcpReq.send(...)`
   - `extra.sendNotification(...)` $\rightarrow$ `ctx.mcpReq.notify(...)`
   - `extra.authInfo` $\rightarrow$ `ctx.http?.authInfo`
5. **Schema Structuring:**
   - Converts old `.tool()` / `.prompt()` / `.resource()` calls to `registerTool` / `registerPrompt` / `registerResource`.
   - Wraps raw input/argument configurations in `z.object()`, importing Zod if not already bound in the file.
   - Drops result-schema parameters from spec methods like `client.request()` or `client.callTool()`.

#### `@mcp-codemod-error` Comments

If the codemod identifies a v1 pattern but cannot determine a safe mechanical refactoring rule (e.g. WebSocket transports, custom Authorization Server setups, complex schema namespaces), it leaves the code intact and injects an inline error comment:

```ts
/* @mcp-codemod-error WebSocketClientTransport removed in v2. Use StreamableHTTPClientTransport or StdioClientTransport. */
```

Developers can find these files using grep or similar search tools:

```bash
grep -rn '@mcp-codemod-error' .
```

### Programmatic API Reference

For custom tooling, you can import and trigger migrations programmatically using `ts-morph` and the package's runner API.

#### Types & Interfaces

```ts
enum DiagnosticLevel {
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
}

interface Diagnostic {
  level: DiagnosticLevel;
  file: string;
  line: number;
  message: string;
  category?: 'v2-gap';
  advisoryOnly?: boolean;
  tag?: 'zod-injected';
  insertComment?: boolean;
}

interface RunnerOptions {
  targetDir: string; // The project path to process
  dryRun?: boolean; // If true, changes are calculated but not written
  verbose?: boolean; // Prints trace steps
  transforms?: string[]; // Filter down to specific transform IDs
  ignore?: string[]; // Glob patterns to exclude
}

interface RunnerResult {
  filesChanged: number;
  totalChanges: number;
  diagnostics: Diagnostic[];
  packageJsonChanges?: PackageJsonChange[];
  commentCount: number;
}

interface PackageJsonChange {
  added: string[];
  removed: string[];
  packageJsonPath: string;
  applied: boolean;
}
```

#### Functions

- `listMigrations(): Map<string, Migration>`
  Returns available migrations (e.g., `'v1-to-v2'`).
- `getMigration(name: string): Migration | undefined`
  Retrieves a migration instance by name.
- `run(migration: Migration, options: RunnerOptions): RunnerResult`
  Executes the migration runner against target directory files.
