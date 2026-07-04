---
name: mcp-test
description: Use when an MCP server or client needs tests or is misbehaving — connection failures, ProtocolError/SdkError codes, or inspector sessions in the TypeScript SDK v2.
user-invocable: false
metadata:
  category: technique
  triggers: mcp test, connection failures, ProtocolError, SdkError, inspector sessions, debug mcp
---

# Testing & Debugging MCP (TypeScript SDK v2)

Covers testing and error diagnosis for `2.0.0-beta.2`. Reference: https://ts.sdk.modelcontextprotocol.io/v2/

`in-process tests -> manual probe (inspector | curl) -> match error channel -> look up code`

## When to Use

- Writing tests for MCP servers/clients in TS/JS.
- Troubleshooting connection failures or ProtocolError/SdkError.
- Running inspector sessions or manual HTTP/stdio probes.
- Deprecated APIs / mismatched SDKs: load [mcp-migrate].
- Server config (stderr logging, custom schemas): see [mcp-server-build].
- Client connection testing: see [mcp-client-build].

## Steps

1. **Verify Sandbox**: Confirm test isolation. Prefer `InMemoryTransport.createLinkedPair()` to pair a `Client` and `McpServer` directly, avoiding real ports or subprocesses.
2. **Mock Security**: If testing auth-protected endpoints, pass mock `authInfo` payloads following [mcp-auth] policies to test 401/403 controls.
3. **Execute Probe**: For stdio servers, launch the MCP inspector to probe commands interactively. For HTTP servers, direct post raw JSON-RPC requests via `curl` to the `/mcp` endpoints.
4. **Assert Correct Channel**:
   - Check standard tool execution errors through user payload `isError: true` responses.
   - Guard and match protocol/SDK exceptions on `.code` checks or SDK constants instead of standard `instanceof` checks.

## Completion Criteria

To consider testing implementation complete, you must verify:

- [ ] Stdio and HTTP adapters are tested using isolated custom memory pairs or mock fetch calls.
- [ ] No real network ports are spawned in the standard unit test execution workflows.
- [ ] Tool business failures return structured `isError: true` bodies in the success payload, not protocol-level crashes.
- [ ] Test suite executes successfully with no hanging tasks or loose connections.

## Examples & References

- In-process/manual test harness setup: [references/examples.md](references/examples.md)
- Protocol Error codes and lookups: [references/error-codes.md](references/error-codes.md) and [references/tables.md](references/tables.md)
