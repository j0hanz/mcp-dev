---
name: mcp-auth
description: Use when an MCP server or endpoint needs protection or an MCP client needs credentials — bearer-token verification, OAuth flows, or machine-to-machine auth in the TypeScript SDK v2.
user-invocable: false
metadata:
  category: technique
  triggers: bearer-token verification, oauth flows, machine-to-machine auth, mcp authentication, token validation, security
---

# MCP Authorization (TypeScript SDK v2)

Covers `2.0.0` server-side HTTP authentication and client-side credential configuration. Official reference: https://ts.sdk.modelcontextprotocol.io/v2/

**The server only verifies tokens; it never issues them.** Token issuance belongs to a separate authorization server — the MCP server is a resource server that checks what it's handed.

## When to Use

- Protecting an MCP server or endpoint with bearer tokens.
- Configuring credentials, OAuth flows, or machine-to-machine auth on the client.
- This skill is typically loaded as part of the server configuration flow (see `/mcp-server-build`) or client connection setup (see `/mcp-client-build`).

## How It Works

### 1. Server side — protecting the endpoint

In the TypeScript SDK v2, **the server framework performs no token verification or authorization of its own**. You must implement token extraction and validation using your chosen HTTP framework (e.g., Express middleware, native fetch wrappers) _before_ passing the request to the MCP handler.

> [!IMPORTANT]
> The MCP server must act strictly as a Resource Server. Do not build authentication flows (like generating JWTs or password verification) directly within your tools. Delegate this responsibility to an external Identity Provider (IdP) and verify incoming tokens prior to passing requests to the MCP handler.

1. **Verify in middleware:** Extract the Bearer token, verify it, and produce an `AuthInfo` object.
   - Missing or invalid token → respond with HTTP `401`.
   - Valid token, insufficient scope for endpoint → respond with HTTP `403`.
2. **Pass to the handler:** Provide the validated `AuthInfo` to `McpHttpHandler.fetch(request, { authInfo })` or `invoke(server, message, { classification, authInfo })`. The entry performs **no token verification**: `authInfo` given to `fetch` is passed through strictly as-is and never derived from request headers.
3. **Use in the factory:** The server factory receives `ctx: McpRequestContext` which contains `ctx.authInfo`. This allows for multi-tenant setups where different principals get different server components or resources.
4. **Per-tool authorization:** To enforce scopes per tool/prompt, check `ctx.authInfo` (captured by closure in the factory) inside your tool handler. If the caller lacks permission, return `isError: true` with an appropriate message rather than trying to fail the HTTP request, since MCP executes over an established transport.

### 2. Client side — using the token

_(Client-side OAuth implementation depends on the specific transport used, typically requiring authorization headers to be appended to outgoing HTTP/SSE requests.)_

#### A. End-user OAuth (authorization_code)

For a human completing a browser login. The client must handle the OAuth flow and token storage, attaching the acquired token as a Bearer token in the Authorization header when establishing the MCP transport connection.

#### B. Machine-to-machine (client_credentials)

For a service authenticating without a human in the loop. The service requests a token from the authorization server and injects it into the MCP transport headers.

#### C. Cross-app access

For a user already authenticated in the host app — exchanges that session for MCP access instead of a second login.

### 3. Error reference

| Error          | Raised to | Meaning                                                   |
| -------------- | --------- | --------------------------------------------------------- |
| `Unauthorized` | Client    | HTTP 401: Token missing or expired — re-run auth flow.    |
| `Forbidden`    | Client    | HTTP 403: Token valid but lacks required endpoint scopes. |

## Examples

Code implementation examples are located in:

- Server-side, client-side, and machine-to-machine authorization: [references/examples.md](references/examples.md)

## Common Mistakes

- Attempting to issue tokens from the MCP server (it must only verify tokens issued by a separate authorization server).
- Assuming the MCP SDK handles token parsing or authorization routing via `requireBearerAuth`. You must pass `authInfo` into `handler.fetch(request, { authInfo })`.
- Replying with a 403 HTTP error from inside an executing tool. Always return `{ isError: true, content: [...] }` to gracefully reject a tool call without breaking the active transport connection.
