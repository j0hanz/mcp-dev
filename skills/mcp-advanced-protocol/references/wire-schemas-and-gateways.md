# Wire Schemas & Gateway Patterns

## Wire schemas (`@modelcontextprotocol/core`)

For code that holds **raw JSON** (gateways, proxies, log pipelines) — `McpServer`/`Client` users never need it. Exports the exact Zod constants the SDK validates against, nothing else (`zod` is its only dependency; install separately):

```ts
import { CallToolResultSchema, JSONRPCMessageSchema, CallToolRequestSchema,
         OAuthMetadataSchema } from '@modelcontextprotocol/core';

const parsed = CallToolResultSchema.safeParse(upstreamBody);       // typed on success
const message = JSONRPCMessageSchema.parse(JSON.parse(frame));     // narrows to request | notification | result | error
if ('method' in message && message.method === 'tools/call') {
  const call = CallToolRequestSchema.parse(message);               // call.params.name: string
}
```

Naming: `<SpecType>Schema`, `<SpecType>RequestSchema`/`ResultSchema`/`NotificationSchema`, `*ParamsSchema`; OAuth group: `OAuthTokensSchema`, `OAuthProtectedResourceMetadataSchema`, `OpenIdProviderDiscoveryMetadataSchema`. TypeScript types, `isSpecType.*` guards, and error classes live in `server`/`client`, not `core`.

## Gateways & worker fleets

Probe a server once; every other client connects with **zero round trips** (2026-07-28+):

```ts
// Bootstrap probes once …
const bootstrap = new Client({ name: 'gateway', version: '1.0.0' }, { versionNegotiation: { mode: 'auto' } });
await bootstrap.connect(new StreamableHTTPClientTransport(url));
const persisted = JSON.stringify(bootstrap.getDiscoverResult());   // plain JSON: versions, capabilities, serverInfo, instructions

// … workers adopt it — nothing on the wire:
const worker = new Client({ name: 'worker', version: '1.0.0' });
await worker.connect(new StreamableHTTPClientTransport(url), { prior: JSON.parse(persisted) });
```

- `await client.discover()` re-probes on a live connection; a default-mode connect never probes (`getDiscoverResult()` is `undefined`).
- **Never share a `DiscoverResult` across principals** — key the blob on the authorization context that obtained it.
- Prior-connected clients are request-only until `listen()` is called; a configured `listChanged` stays silent.
- An incompatible `prior` rejects with `SdkError(ERA_NEGOTIATION_FAILED)` before the transport starts — fall back to a fresh probe and re-persist.
