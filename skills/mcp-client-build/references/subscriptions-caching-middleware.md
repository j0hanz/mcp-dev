# Subscriptions, Caching, Middleware, Roots

## Subscriptions (change notifications)

On 2026-07-28, change notifications arrive **only** on a `subscriptions/listen` stream the client opens. Register handlers first, then listen:

See [Subscriptions and Listen example](examples.md#subscriptions-and-listen).

**Managed mode** — the `listChanged` client option opens the stream after `connect()` from the intersection of the config and the server's capabilities, re-fetches on each change, and exposes the handle as `client.autoOpenedSubscription`:

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

> `listChanged` registers its own notification handlers during `connect()`; a later manual `setNotificationHandler` for the same type silently replaces it.

**2025-era fallback:** `await client.subscribeResource({ uri })` / `unsubscribeResource({ uri })` — the same `notifications/resources/updated` handler fires. `listen()` on a legacy connection (and `subscribeResource()` on a modern one) rejects with `SdkError(METHOD_NOT_SUPPORTED_BY_PROTOCOL_VERSION)`.

## Response caching

Two halves: the server marks results with a freshness hint (SEP-2549); the client's response cache serves them locally while fresh. Cacheable verbs: `listTools`, `listPrompts`, `listResources`, `listResourceTemplates`, `readResource`.

```ts
await client.listTools(); // network, cached for ttlMs
await client.listTools(); // served from cache
await client.listTools(undefined, { cacheMode: 'refresh' }); // always refetch + re-store
await client.readResource({ uri }, { cacheMode: 'bypass' }); // no cache read or write
```

- Every `Client` has a response cache; `ttlMs` is capped at 24 h (`MAX_CACHE_TTL_MS`).
- `responseCacheStore` swaps the store (default: per-client `InMemoryResponseCacheStore`, max 512 `resources/read` entries); the 5-method `ResponseCacheStore` interface may return promises (Redis-friendly). Entries are keyed by connected-server identity.
- **`cachePartition` is mandatory when one store serves several principals** — `'private'` entries never cross partitions; `'public'` entries stay shared per server.
- `defaultCacheTtlMs` opts in against servers that send no hints (2025-era servers included).
- `list_changed` notifications and `notifications/resources/updated` evict matching entries automatically.

## HTTP middleware

Wrap the transport's `fetch` to see every HTTP request out and every `Response` back:

See [HTTP Middleware example](examples.md#http-middleware).

- **Order:** the _last_ middleware passed is outermost (sees the request first, the response last); the _first_ sits closest to the network — put retries there.
- `withLogging({ statusLevel?, includeRequestHeaders?, includeResponseHeaders?, logger? })` — pass a `logger` in stdio processes to keep lines off stdout.
- `withOAuth(provider, serverUrl)` — the OAuth flow as a layer (adds `Authorization`, re-auths + retries once on 401) for stacks that already own `fetch`; otherwise prefer the transport's `authProvider`.
- Always return the `Response`; read a `response.clone()` if the body is needed.

## Roots _(deprecated — SEP-2577)_

`file://` boundaries the client hands the server. **Migrate:** pass paths through tool arguments, resource URIs, or server configuration. Through the deprecation window (≥ 12 months on 2025-era connections):

```ts
const client = new Client(
  { name: 'ws', version: '1.0.0' },
  { capabilities: { roots: { listChanged: true } } },
); // declare BEFORE registering the handler

client.setRequestHandler('roots/list', async () => ({
  roots: [{ uri: 'file:///home/user/projects/my-app', name: 'My App' }], // every uri starts with file://
}));

await client.sendRootsListChanged(); // server re-requests roots/list
```

Roots are advisory, not an access grant — the SDK never enforces them.
