---
name: mcp-auth-oauth
description: This skill should be used when the user asks to "add auth to an MCP server", "protect an MCP endpoint", "verify bearer tokens", "set up OAuth for MCP", "authenticate an MCP client", "machine-to-machine MCP auth", or mentions requireBearerAuth, OAuthClientProvider, AuthInfo, ClientCredentialsProvider, or mcpAuthMetadataRouter from the MCP TypeScript SDK v2.
user-invocable: false
---

# MCP Authorization (TypeScript SDK v2)

Covers `2.0.0-beta.2` server- and client-side OAuth. Official reference: https://ts.sdk.modelcontextprotocol.io/v2/

**The server only verifies tokens; it never issues them.** Token issuance is a separate authorization server — the MCP server is a resource server that checks what it's handed.

## 1. Server side — protecting the endpoint

`requireBearerAuth` wraps the handler; you supply one function, `verifyAccessToken(token) => AuthInfo`.

See [Server-side example](references/examples.md#server-side---protecting-the-endpoint).

- Missing or invalid token → `401`, prompting the client to (re-)authorize.
- Valid token, insufficient scope → `403`.
- `AuthInfo.expiresAt` is required — tokens without an expiry are rejected.
- Per-tool authorization isn't a transport concern: check `ctx.http?.authInfo.scopes` inside the handler and return `isError: true` if the caller can't use that tool.

## 2. Client side — using the token

Pass an `authProvider` to the client transport. Three provider shapes:

### A. End-user OAuth (authorization_code)

For a human completing a browser login. The SDK runs discovery, registers/looks up the client, and calls `provider.redirectToAuthorization(url)`.

See [End-user OAuth example](references/examples.md#end-user-oauth).

- Tokens persist through the provider so re-auth isn't needed every connection.
- `finishAuth` validates the RFC 9207 `iss` on the callback; a mismatched authorization server aborts the exchange rather than accepting a token from the wrong issuer.

### B. Machine-to-machine (client_credentials)

For a service authenticating without a human in the loop.

See [Machine-to-machine example](references/examples.md#machine-to-machine).

### C. Cross-app access

For a user already authenticated in the host app — exchanges that session for MCP access instead of a second login:

```ts
import { CrossAppAccessProvider } from "@modelcontextprotocol/client";

new CrossAppAccessProvider({ assertion, clientId, clientSecret });
```

## 3. Error reference

| Error                               | Raised to | Meaning                                                    |
| ------------------------------------ | --------- | ------------------------------------------------------------ |
| `UnauthorizedError`                  | Client    | Token missing or expired — re-run the auth flow.             |
| `IssuerMismatchError`                | Client    | Callback or metadata came from the wrong issuer.             |
| `AuthorizationServerMismatchError`   | Client    | Credential is pinned to a different authorization server.    |
| `OAuthError`                         | Server    | Token verifier rejected the token.                           |

## 4. Related skills

- `mcp-server-build` — building and wiring the server this protects.
- `mcp-client-build` — building the client that authenticates against it.
