---
name: mcp-advanced-protocol
description: Use when working with low-level MCP v2 protocol, custom transports, raw wire messages, gateways, or the low-level Server class.
user-invocable: false
metadata:
  category: technique
  triggers: custom methods, custom transports, raw wire messages, mcp gateway, mcp proxy, low-level server
---

# MCP Advanced Protocol

Prefer `McpServer`. Only use `Server` for custom features. Docs: https://ts.sdk.modelcontextprotocol.io/v2/

## When to Use

- Custom methods, transports, or proxy/gateways.
- Advanced modes (`McpServerFactory`, `invoke()`).

## Steps

1. **Verify Suitability**: Assess if the standard high-level `McpServer` is inadequate before using the low-level raw `Server` module (which lacks automatic validation, capabilities, or error handling).
2. **Define Custom Methods**: Prefix custom extension methods with distinct namespace identifiers (e.g. `acme/search`) and parameterize explicit schemas.
3. **Register Custom Capabilities**: Declare extension support details explicitly by registering capabilities properties in the server metadata structure.
4. **Implement Custom Transport**: When creating custom connections, build out `start()`, `send()`, and `close()`. Throw exceptions explicitly on send failures and trigger standard error callbacks.
5. **Route Version Boundaries**: Use `isLegacyRequest()` to intercept 2025-era handshakes and branch message delivery between legacy and modern clients in multi-client gateways.

## Completion Criteria

To consider advanced implementation complete, you must verify:

- [ ] Low-level raw namespaces and custom RPC method targets are prefixed with unique vendor names (e.g. `acme/`).
- [ ] Custom transport classes implement the standard life stages properly, triggering `onclose` on termination.
- [ ] Hand-rolled custom connection transport objects NEVER invoke `.start()` manually; transport startup is delegated to `.connect()`.
- [ ] Intercept gateways are backed by rigorous error controls to prevent uncaught network failures from interrupting long-lived streams.

## Reference Guides

- Custom transports & direct invocation (`invoke()`): [references/examples.md](references/examples.md)
- Gateways, Worker Fleets, & wire schemas: [references/wire-schemas-and-gateways.md](references/wire-schemas-and-gateways.md)
- Testing & debugging hand-rolled adapters: [mcp-test]
- Gateway authentication boundary controls: [mcp-auth]

## Common Mistakes

- **Redundant Low-Level**: Opting to write raw `Server` instances manually when standard `McpServer` capabilities suffice.
- **Manual Start**: Invoking `transport.start()` within setup scripts, which conflicts with native event registration.
- **Leaked Exceptions**: Letting uncaught endpoint failures crash the connection state instead of translating the exceptions.
