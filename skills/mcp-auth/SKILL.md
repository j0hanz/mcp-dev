---
name: mcp-auth
description: Use when an MCP server or endpoint needs protection or an MCP client needs credentials — bearer-token verification, OAuth flows, or machine-to-machine auth in the TypeScript SDK v2.
user-invocable: false
metadata:
  category: technique
  triggers: bearer-token verification, oauth flows, machine-to-machine auth, mcp authentication, token validation, security
---

# MCP Authorization (TypeScript SDK v2)

Covers server-side HTTP auth and client credentials in TypeScript SDK v2. Reference: https://ts.sdk.modelcontextprotocol.io/v2/

**Server acts as Resource Server only; it never issues tokens.**

## When to Use

- Protecting MCP server endpoints with bearer tokens.
- Configuring client credentials, OAuth, or machine-to-machine auth.
- Loaded via `/mcp-server-build` or `/mcp-client-build`.

## How It Works

1. **Middleware Verification:** Extract & verify token -> [AuthInfo](references/examples.md#server-side---protecting-the-endpoint) (401/403 on failure).
2. **Pass to Handler:** Provide `authInfo` to `McpHttpHandler.fetch(request, { authInfo })` or `invoke`. SDK does no auto-verification.
3. **Factory Context:** Factory gets `ctx.authInfo` via `McpRequestContext` for multi-tenancy.
4. **Per-Tool Auth:** Check `ctx.http?.authInfo` in tools (`ctx.authInfo` is only populated on the per-request factory context, not inside tool handlers; it's `undefined` over stdio). If unauthorized, return `{ isError: true, content: [...] }` (do not fail HTTP).

> [!IMPORTANT]
> Act as Resource Server only. Do not build auth flows (JWT generation, password checks) in tools. Use an IdP and verify tokens beforehand.

## Examples & References

- [examples.md](references/examples.md): server-side verification, prebuilt client providers, and a custom `OAuthClientProvider` for browser/SPA flows.

## Common Mistakes

- Issuing tokens from MCP server (must only verify external tokens).
- Expecting SDK to parse tokens automatically without passing `authInfo` to `fetch`.
- Throwing HTTP errors inside tools. Return `{ isError: true, content: [...] }` to reject tool calls.
- Reading `ctx.authInfo` inside a tool handler — that field lives on the factory context. Tools must read `ctx.http?.authInfo`.
- Registering a new OAuth client via Dynamic Client Registration (`registerClient`) — deprecated in favor of Client ID Metadata Documents (see [examples.md](references/examples.md#custom-oauthclientprovider--discovery)).

## Rules & Anti-Rationalization

- **Red Flags**: Generating JWTs/keys in tool logic; throwing HTTP errors (403/401) in tools; assuming native bearer extraction.
- **Mocking**: Use mock external issuer for tests, never generate tokens inside tools. For end-to-end coverage of an auth-protected server, pair with [mcp-test].
- **Failures**: Return `{ isError: true, content: [...] }` to reject tool calls. Do not throw HTTP/transport errors.
- **Headers**: Never read HTTP headers directly inside tools. Use `ctx.http?.authInfo`.
