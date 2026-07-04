---
description: >-
  Code examples showing linked in-process transports and child-process stdio harnesses for automated testing.
metadata:
  tags: [examples, testing, in-process, mock]
  source: internal
---

# Testing & Debugging Examples

## In-process test harness

### Zero-transport-mocking: `InMemoryTransport.createLinkedPair()`

The SDK's own canonical pattern for testing an `McpServer` directly against a `Client` — no HTTP mocking, no `handler.fetch` shim:

```ts
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/core';

const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

const client = new Client({ name: 'test-harness', version: '1.0.0' });
await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);

const result = await client.callTool({ name: 'greet', arguments: { name: 'World' } });
assert.equal(result.isError, undefined);

await client.close();
```

Prefer this over mocking `handler.fetch` when you don't need to exercise HTTP-specific behavior (headers, auth middleware, Host/Origin checks) — for those, use the `handler.fetch` harness below.

### HTTP handler harness

```ts
import assert from 'node:assert/strict';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { createMcpHandler } from '@modelcontextprotocol/server';

const handler = createMcpHandler(createServer); // server factory

const transport = new StreamableHTTPClientTransport(new URL('http://test.local/mcp'), {
  fetch: (url, init) => handler.fetch(new Request(url, init)), // in-process fetch mock
});

const client = new Client(
  { name: 'test-harness', version: '1.0.0' },
  { versionNegotiation: { mode: 'auto' } },
);
await client.connect(transport);

const result = await client.callTool({
  name: 'apply-discount',
  arguments: { price: 80, percent: 25 },
});
assert.deepStrictEqual(result.structuredContent, { total: 60 });

const failed = await client.callTool({
  name: 'apply-discount',
  arguments: { price: -5, percent: 25 },
});
assert.equal(failed.isError, true); // tool error returns isError: true

// afterEach:
await client.close();
await handler.close(); // clean up transport
```

## Manual Testing

### stdio server

Run the inspector on a local TS/JS stdio server:

```sh
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

### HTTP server

Perform a manual JSON-RPC POST request:

```sh
curl -X POST http://127.0.0.1:3000/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```
