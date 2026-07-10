---
description: >-
  Examples illustrating server-side bearer auth, end-user OAuth, client credentials, and cross-app session authorization.
metadata:
  tags: [examples, oauth, authentication, bearer-auth]
  source: internal
---

# MCP Authorization Examples & Flows

## Server side - protecting the endpoint

```ts
import {
  getOAuthProtectedResourceMetadataUrl,
  mcpAuthMetadataRouter,
  requireBearerAuth,
} from '@modelcontextprotocol/express';
import type { AuthInfo } from '@modelcontextprotocol/server';

const mcpServerUrl = new URL('https://api.example.com/mcp');

const auth = requireBearerAuth({
  verifier: {
    verifyAccessToken: async (token) => {
      const payload = await verifyJwt(token);
      return { token, clientId: payload.sub, scopes: payload.scopes, expiresAt: payload.exp };
    },
  },
  requiredScopes: ['mcp'],
  resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(mcpServerUrl),
});

app.all('/mcp', auth, (req, res) => void node(req, res, req.body));
app.use(mcpAuthMetadataRouter({ oauthMetadata, resourceServerUrl: mcpServerUrl }));
```

## Client-Side Authentication Flows

Client-side auth depends on the transport, typically requiring authorization headers in HTTP/SSE requests.

### A. End-user OAuth (authorization_code)

For a human browser login. The client handles the OAuth flow and token storage, attaching the acquired token as a Bearer token in the Authorization header.

```ts
import {
  Client,
  StreamableHTTPClientTransport,
  UnauthorizedError,
  IssuerMismatchError,
} from '@modelcontextprotocol/client';

const transport = new StreamableHTTPClientTransport(url, { authProvider });
try {
  await client.connect(transport);
} catch (error) {
  if (!(error instanceof UnauthorizedError)) throw error;
  // SDK handles discovery and redirects user to authorization server
}

// Redirect callback:
const params = new URL(callbackUrl).searchParams;
if (params.get('state') !== authProvider.lastState) throw new Error('state mismatch');
try {
  await transport.finishAuth(params); // exchanges code, saves tokens
  await client.connect(new StreamableHTTPClientTransport(url, { authProvider }));
} catch (e) {
  if (e instanceof IssuerMismatchError) {
    throw new Error('Authorization server mismatch');
  }
  throw e;
}
```

> **`IssuerMismatchError`** signals an RFC 9207 `iss` mismatch (possible mix-up attack). Never render `error_description` to the user — it is attacker-controlled.

### B. Machine-to-machine (client_credentials)

For service-to-service auth without user interaction. The service requests a token from the auth server and injects it into the transport headers.

```ts
import { ClientCredentialsProvider, PrivateKeyJwtProvider } from '@modelcontextprotocol/client';

// Client credentials (shared secret)
new ClientCredentialsProvider({ clientId, clientSecret, expectedIssuer });

// Signed JWT assertion (private_key_jwt)
new PrivateKeyJwtProvider({ clientId, privateKey, algorithm: 'RS256', jwtLifetimeSeconds: 300 });

// Custom minimal token provider
const authProvider = {
  token: () => getStoredToken(),
  onUnauthorized: (ctx) => refresh(),
};
```

> `expectedIssuer` pins the credential; if discovery resolves a different issuer, `AuthorizationServerMismatchError` is thrown.

### C. Cross-app access

For a user already authenticated in the host app. Exchanges the host session for MCP access.

```ts
import { CrossAppAccessProvider } from '@modelcontextprotocol/client';

new CrossAppAccessProvider({
  assertion: async (ctx) => {
    const grant = await discoverAndRequestJwtAuthGrant({/* issuer/audience params */});
    return grant.jwtAuthGrant;
  },
  clientId,
  clientSecret,
});
```

### D. Custom `OAuthClientProvider` + Discovery

Write a custom provider when no prebuilt provider fits (e.g. a browser app storing tokens itself). Implement:

```ts
import type {
  OAuthClientProvider,
  StoredOAuthClientInformation,
} from '@modelcontextprotocol/client';

const creds = new Map<string, StoredOAuthClientInformation>();

const authProvider: OAuthClientProvider = {
  redirectUrl: 'https://app.example.com/callback',
  clientMetadata: {
    client_name: 'Example App',
    redirect_uris: ['https://app.example.com/callback'],
  },
  tokens: () => readFromSessionStorage('tokens'),
  saveTokens: (tokens) => writeToSessionStorage('tokens', tokens),
  clientInformation(ctx) {
    // SEP-2352: key credentials by issuer so a client_id from one AS is never sent to another
    if (!ctx) return undefined;
    return creds.get(ctx.issuer);
  },
  saveClientInformation(info, ctx) {
    if (ctx) creds.set(ctx.issuer, info);
  },
  codeVerifier: () => readFromSessionStorage('pkce_verifier'),
  saveCodeVerifier: (verifier) => writeToSessionStorage('pkce_verifier', verifier),
  state() {
    return crypto.randomUUID();
  },
  redirectToAuthorization(url) {
    window.location.href = url.toString();
  },
  saveDiscoveryState(state) {
    sessionStorage.setItem('mcp:discovery', JSON.stringify(state));
  },
  discoveryState() {
    const s = sessionStorage.getItem('mcp:discovery');
    return s ? JSON.parse(s) : undefined;
  },
};
```

> **SEP-2352:** Credentials must be keyed by `ctx.issuer` — a `client_id` registered with one AS must not be sent to another.

The SDK's `auth()` orchestrator drives this provider through PKCE (`saveCodeVerifier` before redirect, verified on token exchange) and discovery: it fetches `.well-known/oauth-protected-resource` (RFC 9728) off the MCP server URL, then follows the returned issuer to `.well-known/oauth-authorization-server` (RFC 8414) via `discoverOAuthServerInfo`.

Registering a new client with the authorization server via Dynamic Client Registration (`registerClient`) is deprecated (SEP-991) — prefer a **Client ID Metadata Document**: host `clientMetadata` at a stable HTTPS URL and pass that URL as `clientId` instead of registering.

## Token Revocation

If the IdP supports revocation, expose it so a compromised or expired token can be invalidated immediately instead of waiting for TTL expiry:

> **Deprecated v1 Authorization Server helper.** `revocationHandler` is a v1 AS function frozen in `@modelcontextprotocol/server-legacy/auth`. An MCP Resource Server does not revoke tokens — that is the IdP's job. Shown only for legacy AS support.

```ts
import { revocationHandler } from '@modelcontextprotocol/server-legacy/auth';

app.post(
  '/revoke',
  revocationHandler({
    provider: { revokeToken: async (token) => idp.revoke(token) },
  }),
);
```

## Error Reference

- `UnauthorizedError` (client): HTTP 401 `invalid_token` — token missing or expired; re-run auth flow.
- `InsufficientScopeError` (client): HTTP 403 `insufficient_scope` — token valid but lacks required endpoint scopes.
