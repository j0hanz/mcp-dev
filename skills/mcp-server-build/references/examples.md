# MCP Server Build Examples

## Quick Start

A complete stdio server is one file:

```ts
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';

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
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  },
  async ({ query, limit }, ctx) => ({
    content: [{ type: 'text', text: names.join('\n') }], // human/model-readable blocks
    structuredContent: { names }, // validated against outputSchema
  }),
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
      { role: 'user', content: { type: 'text', text: `Review this code:\n\n${code}` } },
      { role: 'assistant', content: { type: 'text', text: 'The one-line cause:' } }, // seeds the reply
    ],
  }),
);
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
```
