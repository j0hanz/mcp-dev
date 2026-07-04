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
await transport.finishAuth(params); // exchanges code, saves tokens
await client.connect(new StreamableHTTPClientTransport(url, { authProvider }));
```

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

### C. Cross-app access

For a user already authenticated in the host app. Exchanges the host session for MCP access.

```ts
import { CrossAppAccessProvider } from '@modelcontextprotocol/client';

new CrossAppAccessProvider({ assertion, clientId, clientSecret });
```

### D. Custom `OAuthClientProvider` + Discovery

Write a custom provider when no prebuilt provider fits (e.g. a browser app storing tokens itself). Implement:

```ts
import type { OAuthClientProvider } from '@modelcontextprotocol/client';

const authProvider: OAuthClientProvider = {
  redirectUrl: 'https://app.example.com/callback',
  clientMetadata: {
    client_name: 'Example App',
    redirect_uris: ['https://app.example.com/callback'],
  },
  tokens: () => readFromSessionStorage('tokens'),
  saveTokens: (tokens) => writeToSessionStorage('tokens', tokens),
  clientInformation: () => readFromSessionStorage('client'),
  saveClientInformation: (info) => writeToSessionStorage('client', info),
  codeVerifier: () => readFromSessionStorage('pkce_verifier'),
  saveCodeVerifier: (verifier) => writeToSessionStorage('pkce_verifier', verifier),
};
```

The SDK's `auth()` orchestrator drives this provider through PKCE (`saveCodeVerifier` before redirect, verified on token exchange) and discovery: it fetches `.well-known/oauth-protected-resource` (RFC 9728) off the MCP server URL, then follows the returned issuer to `.well-known/oauth-authorization-server` (RFC 8414) via `discoverOAuthServerInfo`.

Registering a new client with the authorization server via Dynamic Client Registration (`registerClient`) is deprecated (SEP-991) — prefer a **Client ID Metadata Document**: host `clientMetadata` at a stable HTTPS URL and pass that URL as `clientId` instead of registering.

## Error Reference

| Error          | Raised to | Meaning                                                   |
| :------------- | :-------- | :-------------------------------------------------------- |
| `Unauthorized` | Client    | HTTP 401: Token missing or expired — re-run auth flow.    |
| `Forbidden`    | Client    | HTTP 403: Token valid but lacks required endpoint scopes. |
