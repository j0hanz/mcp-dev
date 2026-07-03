---
description: Code examples for low-level server setup, custom methods, validation, and custom transports.
metadata:
  tags: [examples, protocol, transport, low-level]
  source: internal
---

# MCP Advanced Protocol Examples

## Low-level Server

```ts
import { Server } from '@modelcontextprotocol/server';

const server = new Server({ name: 'catalog', version: '1.0.0' }, { capabilities: { tools: {} } });

server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'search',
      description: 'Search catalog',
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    },
  ],
}));

server.setRequestHandler('tools/call', async (req) => {
  if (req.params.name !== 'search') {
    return { content: [{ type: 'text', text: `Unknown: ${req.params.name}` }], isError: true };
  }
  const { query } = req.params.arguments as { query: string };
  // …
});
```

## Custom methods and extension capabilities

```ts
const SearchParams = z.object({
  query: z.string(),
  limit: z.number().int().default(10),
});
const SearchResult = z.object({ items: z.array(z.string()) });

server.server.setRequestHandler(
  'acme/search',
  { params: SearchParams, result: SearchResult },
  async ({ query, limit }, ctx) => {
    await ctx.mcpReq.notify({
      method: 'acme/searchProgress',
      params: { stage: 'start', pct: 0 },
    });
    return { items: Array.from({ length: limit }, (_, i) => `${query}-${i}`) };
  },
);

// Client
const result = await client.request(
  { method: 'acme/search', params: { query: 'mcp', limit: 3 } },
  SearchResult,
);
client.setNotificationHandler(
  'acme/searchProgress',
  { params: z.object({ stage: z.string(), pct: z.number() }) },
  (params) => console.log(params),
);
```

## Schema libraries and validators

```ts
// Zod v4
inputSchema: z.object({ name: z.string() });

// ArkType
import { type } from 'arktype';
inputSchema: type({ name: 'string', 'times?': '1 <= number.integer <= 5' });

// Valibot
import { toStandardJsonSchema } from '@valibot/to-json-schema';
inputSchema: toStandardJsonSchema(v.object({ name: v.string() }));

// Plain JSON Schema
import { fromJsonSchema } from '@modelcontextprotocol/server';
inputSchema: fromJsonSchema<{ name: string }>({
  type: 'object',
  properties: { name: { type: 'string' } },
  required: ['name'],
});
```

## Custom transports

```ts
import type { JSONRPCMessage, Transport, TransportSendOptions } from '@modelcontextprotocol/server';

class SocketTransport implements Transport {
  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;
  private readonly readBuffer = new ReadBuffer();
  constructor(private readonly socket: Socket) {}

  async start() {
    this.socket.on('data', (chunk) => {
      this.readBuffer.append(chunk);
      let m;
      while ((m = this.readBuffer.readMessage()) !== null) this.onmessage?.(m);
    });
    this.socket.on('close', () => this.onclose?.());
  }
  async send(message: JSONRPCMessage, options?: TransportSendOptions) {
    this.socket.write(serializeMessage(message));
  }
  async close() {
    this.socket.end();
  }
}
```
