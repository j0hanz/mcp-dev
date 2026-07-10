---
name: mcp-auth
description: Use when an MCP server or endpoint needs protection or an MCP client needs credentials — bearer-token verification, OAuth flows, or machine-to-machine auth in the TypeScript SDK v2.
when_to_use: Bearer-token verification, OAuth flows, machine-to-machine authentication, MCP authentication, token validation, security.
user-invocable: false
metadata:
  category: technique
---

# MCP Authorization (TypeScript SDK v2)

Covers server-side HTTP auth and client credentials in TypeScript SDK v2. Reference: https://ts.sdk.modelcontextprotocol.io/v2/

**Server acts as Resource Server only; it never issues tokens.**

## When to Use

- Protecting MCP server endpoints with bearer tokens.
- Configuring client credentials, OAuth, or machine-to-machine auth.

## Steps

1. **Wire**: supply `verifyAccessToken` to `requireBearerAuth` — the helper extracts the Authorization header and forwards the verified `AuthInfo`.
2. **Verify**: Check token validity against IdP/external verification keys (return 401/403 directly if invalid).
3. **Populate**: the helper attaches `AuthInfo` to `req.auth`; `toNodeHandler` forwards it so handlers read `ctx.http.authInfo` (no manual population).
4. **Enforce**: Within tool callbacks, verify `ctx.http?.authInfo` and return `{ isError: true, content: [...] }` if unauthorized.

## Completion Criteria

To consider authentication implementation complete, you must verify:

- [ ] Direct token generation, JWT issuing, or credential database checks are omitted from the server (Resource Server only).
- [ ] Token validation fails cleanly with standard HTTP 401/403 errors outside/before tool dispatch.
- [ ] Tool business failures due to failed authorization return `{ isError: true }` and reject tool calls without throwing transport exceptions.
- [ ] Tool callbacks read tenant/user permissions via `ctx.http?.authInfo` instead of factory `ctx.authInfo`.
- [ ] No raw HTTP headers are processed directly inside individual tool callback handlers.
- [ ] No token revocation endpoint is implemented on the MCP server — revocation is delegated to the IdP/Authorization Server.
- [ ] `verifyAccessToken` populates `expiresAt` on `AuthInfo`, else `requireBearerAuth` answers `401 invalid_token`.
- [ ] Token rejection throws `OAuthError` with `OAuthErrorCode.InvalidToken` (other exceptions become `500`).
- [ ] Non-Express `fetch` hosts (Cloudflare Workers, Deno, Hono) use the web-standard `requireBearerAuth` from `@modelcontextprotocol/server`.

## Examples & References

- [examples.md](references/examples.md): server-side verification, prebuilt client providers, and a custom `OAuthClientProvider` for browser/SPA flows.

## Common Mistakes

- **Token Generation**: Issuing tokens or generating JWT keys from the MCP server instead of verifying external ones using an IdP.
- **Header Extraction**: Expecting the SDK to automatically extract bearer tokens without configuring custom middleware.
- **Tool Exceptions**: Throwing HTTP/transport errors inside a tool (always return `{ isError: true, content: [...] }` instead).
- **Wrong Auth Context**: Reading `ctx.authInfo` inside a tool callback (which only exists on factory context) instead of reading `ctx.http?.authInfo`.
- **Dynamic Clients**: Registering OAuth clients via deprecated `registerClient` dynamic registrations instead of Client ID Metadata Documents.
- **Test Tokens**: Generating real tokens inside test tools rather than using mock external token issuers paired with [mcp-test].
