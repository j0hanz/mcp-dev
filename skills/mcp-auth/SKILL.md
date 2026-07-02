---
name: mcp-auth
description: Use when an MCP server or endpoint needs protection or an MCP client needs credentials — bearer-token verification, OAuth flows, or machine-to-machine auth in the TypeScript SDK v2.
user-invocable: false
metadata:
  category: technique
  triggers: bearer-token verification, oauth flows, machine-to-machine auth, mcp authentication, token validation, security
---

# MCP Authorization (TypeScript SDK v2)

Covers `2.0.0-beta.2` server- and client-side OAuth. Official reference: https://ts.sdk.modelcontextprotocol.io/v2/

```
client authProvider -> token -> request -> requireBearerAuth -> verifyAccessToken -> AuthInfo -> handler
```

**The server only verifies tokens; it never issues them.** Token issuance belongs to a separate authorization server — the MCP server is a resource server that checks what it's handed.

## When to Use

- Protecting an MCP server or endpoint with bearer tokens.
- Configuring credentials, OAuth flows, or machine-to-machine auth on the client.

## How It Works

### 1. Server side — protecting the endpoint

`requireBearerAuth` wraps the handler around one supplied function, `verifyAccessToken(token) => AuthInfo`.

- Missing or invalid token → `401`, prompting the client to (re-)authorize.
- Valid token, insufficient scope → `403`.
- `AuthInfo.expiresAt` is required — tokens without an expiry are rejected.
- Per-tool authorization isn't a transport concern: check `ctx.http?.authInfo.scopes` inside the handler and return `isError: true` if the caller can't use that tool — replying `403` at the HTTP layer instead triggers the client's automatic scope step-up (SEP-2350).
- `getOAuthProtectedResourceMetadataUrl(mcpServerUrl)` builds the RFC 9728 resource-metadata URL passed as `resourceMetadataUrl` to `requireBearerAuth`; `mcpAuthMetadataRouter({ oauthMetadata, resourceServerUrl })` mounts the route that serves it — used together in the example below.

### 2. Client side — using the token

Pass an `authProvider` to the client transport. Three provider shapes:

#### A. End-user OAuth (authorization_code)

For a human completing a browser login. The SDK runs discovery, registers/looks up the client, and calls `provider.redirectToAuthorization(url)`.

- Tokens persist through the provider so re-auth isn't needed every connection.
- `finishAuth` validates the RFC 9207 `iss` on the callback; a mismatched authorization server aborts the exchange rather than accepting a token from the wrong issuer. Never render the callback's `error`/`error_description` — they arrive on an untrusted redirect.
- Dynamic client registrations are keyed by issuer (SEP-2352) so a `client_id` from one authorization server is never sent to another; RFC 8707 resource binding is automatic (override `validateResourceURL` to pin or omit the `resource` parameter).

#### B. Machine-to-machine (client_credentials)

For a service authenticating without a human in the loop.

#### C. Cross-app access

For a user already authenticated in the host app — exchanges that session for MCP access instead of a second login.

### 3. Error reference

| Error                              | Raised to | Meaning                                                   |
| ---------------------------------- | --------- | --------------------------------------------------------- |
| `UnauthorizedError`                | Client    | Token missing or expired — re-run the auth flow.          |
| `IssuerMismatchError`              | Client    | Callback or metadata came from the wrong issuer.          |
| `AuthorizationServerMismatchError` | Client    | Credential is pinned to a different authorization server. |
| `OAuthError`                       | Server    | Token verifier rejected the token.                        |

## Examples

Code implementation examples are located in:

- Server-side, client-side, and machine-to-machine authorization: [references/examples.md](references/examples.md)

## Common Mistakes

- Attempting to issue tokens from the MCP server (it must only verify tokens issued by a separate authorization server).
- Rendering untrusted redirect error parameters on the client callback page.
- Pinned client credentials sent to mismatched authorization servers.
