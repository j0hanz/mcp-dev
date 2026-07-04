---
description: >-
  Reference implementation for client connection setup, calling tools/resources, subscriptions, and client-side middleware.
metadata:
  tags: [examples, client, connection, middleware]
  source: internal
---

# MCP Client Build Examples

## Constructor & connect

```ts
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';

const client = new Client(
  { name: 'my-client', version: '1.0.0' },
  {
    // Options
    capabilities: { elicitation: { form: {}, url: {} }, sampling: {} },
    versionNegotiation: { mode: 'auto' },
    listChanged: { tools: { onChanged } },
    inputRequired: { maxRounds: 10, autoFulfill: true },
    listMaxPages: 64,
    responseCacheStore,
    cachePartition,
    defaultCacheTtlMs,
  },
);

await client.connect(new StreamableHTTPClientTransport(new URL('http://localhost:3000/mcp')));
```

## Calling Tools and Resources

```ts
const { tools } = await client.listTools();
const result = await client.callTool({ name: 'lookup-order', arguments: { id: 'A-1041' } });
// result.content: block array
// result.isError: true if tool failed (check before using content)
// result.structuredContent: unknown; present if outputSchema declared

const { resources } = await client.listResources();
const { resourceTemplates } = await client.listResourceTemplates();
const { contents } = await client.readResource({ uri: 'orders://recent' });

const { prompts } = await client.listPrompts();
const prompt = await client.getPrompt({ name: 'summarize-order', arguments: { id: 'A-1041' } });
// prompt.messages — ready to send to a model

const { completion } = await client.complete({
  ref: { type: 'ref/prompt', name: 'summarize-order' }, // or { type: 'ref/resource', uri: 'repo://{repo}/readme' }
  argument: { name: 'tone', value: 'f' },
});
```

## Subscriptions and Listen

```ts
client.setNotificationHandler('notifications/tools/list_changed', async () => {
  const { tools } = await client.listTools();
});
client.setNotificationHandler('notifications/resources/updated', async (n) => {
  const { contents } = await client.readResource({ uri: n.params.uri });
});

const subscription = await client.listen({
  toolsListChanged: true, // + promptsListChanged, resourcesListChanged
  resourceSubscriptions: ['config://app'], // per-resource updates
});
subscription.honoredFilter; // the capability-gated subset the server granted

await subscription.close();
const reason = await subscription.closed; // resolves once, never rejects:
// 'local' (you closed) | 'graceful' (server ended) | 'remote' (re-listen only on 'remote')
```

## HTTP Middleware

```ts
import {
  applyMiddlewares,
  createMiddleware,
  withLogging,
  withOAuth,
} from '@modelcontextprotocol/client';

const tagRequests = createMiddleware(async (next, input, init) => {
  const headers = new Headers(init?.headers);
  headers.set('X-Request-Source', 'reports-cli');
  return next(input, { ...init, headers });
});

const transport = new StreamableHTTPClientTransport(url, {
  fetch: applyMiddlewares(tagRequests, withLogging({ statusLevel: 400 }))(fetch),
});
```
