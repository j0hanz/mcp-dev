---
description: >-
  Comprehensive server code examples for stdio/HTTP configurations, tool/resource registration, templates, and argument completion.
metadata:
  tags: [examples, server, tools, resources]
  source: internal
---

# MCP Server Build Examples

## Constructor Options

```ts
const server = new McpServer(
  { name: 'catalog', version: '1.0.0' }, // Implementation info
  {
    // ServerOptions (all optional)
    capabilities: { logging: {}, resources: { subscribe: true } },
    instructions: 'Call list-trips before book-trip.',
    enforceStrictCapabilities: true, // check client capabilities before server-initiated requests
    cacheHints: { 'tools/list': { ttlMs: 60_000, cacheScope: 'public' } },
  },
);
```

## Quick Start

A complete stdio server is one file:

```ts
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod';

serveStdio(() => {
  const server = new McpServer({ name: 'weather', version: '1.0.0' });

  server.registerTool(
    'get-forecast',
    {
      description: 'Get the weather forecast for a city',
      inputSchema: z.object({ city: z.string() }),
    },
    async ({ city }) => ({
      content: [{ type: 'text', text: `Sunny in ${city} all week.` }],
    }),
  );

  return server;
});
```

## Tool Registration

```ts
server.registerTool(
  'search',
  {
    title: 'Search catalog', // display name (optional)
    description: 'Search the product catalog',
    inputSchema: z.object({
      query: z.string().describe('Substring to match'), // .describe() → JSON Schema description
      limit: z.number().int().max(50).optional(),
    }),
    outputSchema: z.object({ names: z.array(z.string()) }), // optional, enables structuredContent
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
  },
  async ({ query, limit }, ctx) => {
    const names = ['Product A', 'Product B']; // mock query result
    return {
      content: [{ type: 'text', text: names.join('\n') }], // human/model-readable blocks
      structuredContent: { names }, // validated against outputSchema
    };
  },
);
```

## Resource Registration

```ts
import { ResourceTemplate } from '@modelcontextprotocol/server';

server.registerResource(
  'user-profile',
  new ResourceTemplate('users://{userId}/profile', {
    list: undefined, // required key; undefined = not enumerable
    complete: { userId: async (v) => lookupIds(v) }, // per-variable autocompletion
  }),
  { description: 'Profile data for one user', mimeType: 'application/json' },
  async (uri, { userId }) => ({
    contents: [{ uri: uri.href, text: JSON.stringify({ userId, plan: 'pro' }) }],
  }),
);
```

## Prompt Registration

```ts
server.registerPrompt(
  'review-code',
  {
    title: 'Code Review',
    description: 'Review code for best practices',
    argsSchema: z.object({ code: z.string().describe('The code to review') }),
  },
  ({ code }) => ({
    messages: [
      {
        role: 'user',
        content: { type: 'text', text: `Review this code:\n\n${code}` },
      },
      {
        role: 'assistant',
        content: { type: 'text', text: 'The one-line cause:' },
      }, // seeds the reply
    ],
  }),
);
```

## Argument Completion

```ts
import { completable } from '@modelcontextprotocol/server';

argsSchema: z.object({
  repo: completable(z.string(), async (value) =>
    (await listRepos()).filter((r) => r.startsWith(value)),
  ),
  branch: completable(z.string(), async (value, context) => {
    const repo = context?.arguments?.repo; // other already-filled args; context is optional — never throw
    return repo ? branchesFor(repo).filter((b) => b.startsWith(value)) : [];
  }),
});
```

## Stdio Serving

```ts
const handle = serveStdio(() => buildServer());
console.error('listening on stdio'); // stderr — NEVER console.log
process.on('SIGINT', () => void handle.close());
```

## HTTP Serving

One MCP endpoint many clients share, over Streamable HTTP:

```ts
import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';

const handler = createMcpHandler(({ era, authInfo, requestInfo }) => {
  const server = new McpServer({ name: 'notes', version: '1.0.0' });
  // register tools…
  return server;
});

// Web-standard runtimes (Workers, Deno, Bun): the handler IS the default export
export default handler;

// Plain node:http
import { createServer } from 'node:http';
import { toNodeHandler } from '@modelcontextprotocol/node';
createServer(toNodeHandler(handler)).listen(3000);

// Already inside a Node request handler and want handler.fetch() directly: toWebRequest is the inverse of toNodeHandler
import { toWebRequest } from '@modelcontextprotocol/node';
createServer(async (req, res) => {
  const response = await handler.fetch(toWebRequest(req));
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(await response.text());
}).listen(3000);
```

## Framework Adapters

All framework integrations build upon the core `createMcpHandler` instance:

```ts
import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';

const server = new McpServer({ name: 'my-server', version: '1.0.0' });
// ... register tools, resources ...

const handler = createMcpHandler(server);
```

### Express Integration

Requires `@modelcontextprotocol/express`, `@modelcontextprotocol/node`, and `express`.

```ts
import { createMcpExpressApp } from '@modelcontextprotocol/express';
import { toNodeHandler } from '@modelcontextprotocol/node';

const app = createMcpExpressApp(); // Express app with default Host/Origin guards
const node = toNodeHandler(handler);

// Pass parsed body directly to avoid re-reading request stream
app.all('/mcp', (req, res) => void node(req, res, req.body));
app.listen(3000);
```

### Fastify Integration

Requires `@modelcontextprotocol/fastify`, `@modelcontextprotocol/node`, and `fastify`.

```ts
import { createMcpFastifyApp } from '@modelcontextprotocol/fastify';
import { toNodeHandler } from '@modelcontextprotocol/node';

const app = createMcpFastifyApp(); // Fastify instance with Host/Origin hooks
const node = toNodeHandler(handler);

app.all('/mcp', (req, reply) => node(req.raw, reply.raw, req.body));
app.listen({ port: 3000 });
```

### Hono Integration

Requires `@modelcontextprotocol/hono` and `hono`.

```ts
import { createMcpHonoApp } from '@modelcontextprotocol/hono';
import type { Context } from 'hono';

const app = createMcpHonoApp(); // Hono app with default Host/Origin checks

// Always add explicit `c: Context` type annotation to avoid key narrowing compilation issues
app.all('/mcp', (c: Context) => handler.fetch(c.req.raw, { parsedBody: c.get('parsedBody') }));
export default app;
```

Smoke test:

```sh
curl -X POST http://127.0.0.1:3000/mcp -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```
