---
description: >-
  Code examples showing linked in-process transports and child-process stdio harnesses for automated testing.
metadata:
  tags: [examples, testing, in-process, mock]
  source: internal
---

# Testing & Debugging Examples

## In-process test harness

```ts
import assert from 'node:assert/strict';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { createMcpHandler } from '@modelcontextprotocol/server';

const handler = createMcpHandler(createServer); // the factory that gets deployed

const transport = new StreamableHTTPClientTransport(new URL('http://test.local/mcp'), {
  fetch: (url, init) => handler.fetch(new Request(url, init)), // never dials — served in-process
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
assert.equal(failed.isError, true); // failures resolve; nothing to catch

// afterEach:
await client.close();
await handler.close(); // aborts in-flight exchanges — hung calls can't leak into the next test
```
