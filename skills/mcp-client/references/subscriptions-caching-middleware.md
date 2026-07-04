---
description: Advanced guide to client caching, fetch middleware, subscription management, and roots handling.
metadata:
  tags: [caching, subscription, middleware, client]
  source: internal
---

# Subscriptions, Caching, Middleware, Roots

## Subscriptions (change notifications)

On 2026-07-28, change notifications arrive via `subscriptions/listen`. Register handlers, then listen (see [example](examples.md#subscriptions-and-listen)).

**Managed mode** — `listChanged` opens the stream, re-fetches on change, and exposes `client.autoOpenedSubscription`:

```ts
new Client(
  { name: 'watcher', version: '1.0.0' },
  {
    listChanged: {
      tools: {
        onChanged: (error, tools) => {
          /* … */
        },
      },
    },
  },
);
```

> `listChanged` registers handlers during `connect()`; manual `setNotificationHandler` calls override them.

**2025-era fallback:** `subscribeResource/unsubscribeResource`. `listen()` on legacy (or `subscribeResource` on modern) throws `METHOD_NOT_SUPPORTED_BY_PROTOCOL_VERSION`.

## Response caching

Server freshness hints (SEP-2549) allow local client caching. Cacheable: `listTools`, `listPrompts`, `listResources`, `listResourceTemplates`, `readResource`.

```ts
await client.listTools(); // Network, cached
await client.listTools(); // Served from cache
await client.listTools(undefined, { cacheMode: 'refresh' }); // Refetch and re-store
await client.readResource({ uri }, { cacheMode: 'bypass' }); // Bypass cache
```

- Cache `ttlMs` caps at 24 h (`MAX_CACHE_TTL_MS`).
- `responseCacheStore` swaps storage (default: `InMemoryResponseCacheStore`, max 512 entries).
- **`cachePartition` is required if one store serves multiple users** — `'private'` entries do not cross partitions.
- `defaultCacheTtlMs` sets default TTL for servers lacking hints (e.g. 2025-era).
- Change notifications auto-evict matching entries.

## HTTP middleware

Wrap transport `fetch` (see [example](examples.md#http-middleware)).

- **Order**: Last middleware is outermost (sees request first, response last). Retries belong first (closest to network).
- `withLogging()`: Pass a custom `logger` to avoid stdout polluting stdio processes.
- `withOAuth()`: OAuth layer (adds `Authorization`, retries 401).
- Middleware must return `Response` (use `response.clone()` to read body).

## Roots (deprecated — SEP-2577)

`file://` boundaries for servers. **Deprecated**: pass paths via tool arguments, resource URIs, or server config.

```ts
const client = new Client(
  { name: 'ws', version: '1.0.0' },
  { capabilities: { roots: { listChanged: true } } },
);
client.setRequestHandler('roots/list', async () => ({
  roots: [{ uri: 'file:///home/user/projects/my-app', name: 'My App' }],
}));
await client.sendRootsListChanged();
```

Roots are advisory; the SDK never enforces them.
