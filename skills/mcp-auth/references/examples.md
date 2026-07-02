# MCP Authorization Examples

## Server side - protecting the endpoint

```ts
import {
  createMcpExpressApp,
  getOAuthProtectedResourceMetadataUrl,
  mcpAuthMetadataRouter,
  requireBearerAuth,
} from "@modelcontextprotocol/express";
import type { AuthInfo } from "@modelcontextprotocol/server";

const mcpServerUrl = new URL("https://api.example.com/mcp");

async function verifyAccessToken(token: string): Promise<AuthInfo> {
  // the one function to supply
  const payload = await verifyJwt(token); // or RFC 7662 introspection
  return {
    token,
    clientId: payload.sub,
    scopes: payload.scopes,
    expiresAt: payload.exp,
  };
}

const auth = requireBearerAuth({
  verifier: { verifyAccessToken },
  requiredScopes: ["mcp"],
  resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(mcpServerUrl),
});

app.all("/mcp", auth, (req, res) => void node(req, res, req.body));
app.use(
  mcpAuthMetadataRouter({ oauthMetadata, resourceServerUrl: mcpServerUrl }),
);
```

## End-user OAuth

```ts
import {
  Client,
  StreamableHTTPClientTransport,
  UnauthorizedError,
} from "@modelcontextprotocol/client";

const transport = new StreamableHTTPClientTransport(url, {
  authProvider: provider,
});
try {
  await client.connect(transport);
} catch (error) {
  if (!(error instanceof UnauthorizedError)) throw error;
  // The SDK ran discovery, registered/looked up the client, and called
  // provider.redirectToAuthorization(url) — the user is now at the authorization server.
}

// In the redirect callback:
const params = new URL(callbackUrl).searchParams;
if (params.get("state") !== provider.lastState)
  throw new Error("state mismatch"); // SDK does NOT check state
await transport.finishAuth(params); // validates RFC 9207 `iss`, exchanges the code, saves tokens via the provider
await client.connect(
  new StreamableHTTPClientTransport(url, { authProvider: provider }),
); // FRESH transport
```

## Machine-to-machine

```ts
import {
  ClientCredentialsProvider,
  PrivateKeyJwtProvider,
} from "@modelcontextprotocol/client";

// client_credentials with a shared secret; refreshes + retries once on 401
new ClientCredentialsProvider({ clientId, clientSecret, expectedIssuer });

// same grant, authenticated with a signed JWT assertion (private_key_jwt, RFC 7523)
new PrivateKeyJwtProvider({
  clientId,
  privateKey /* PEM | Uint8Array | JWK */,
  algorithm: "RS256",
  jwtLifetimeSeconds: 300,
  claims: {},
});

// bring-your-own token — minimal AuthProvider:
const authProvider = {
  token: async () => getStoredToken(),
  onUnauthorized: async (ctx) => refresh(),
};
```

## Cross-app access

```ts
import { CrossAppAccessProvider } from "@modelcontextprotocol/client";

new CrossAppAccessProvider({ assertion, clientId, clientSecret });
```
