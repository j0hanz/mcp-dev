---
name: mcp-test
description: Use when writing or running tests for an MCP server or client in the TypeScript SDK v2 — test setup, inspector sessions, and coverage/assertion patterns. For diagnosing runtime misbehavior (connection failures, ProtocolError/SdkError), dispatch the mcp-debugger agent.
user-invocable: false
metadata:
  category: technique
  triggers: mcp test, test setup, inspector sessions, coverage, assertion patterns, test scaffolding
---

# Testing & Debugging MCP (TypeScript SDK v2)

Covers testing and error diagnosis for `2.0.0-beta.2`. Reference: https://ts.sdk.modelcontextprotocol.io/v2/

`in-process tests -> mock security -> manual probe (inspector | curl) -> match error channel & look up code`

## When to Use

- Writing tests for MCP servers/clients in TS/JS.
- Diagnosing runtime misbehavior (connection failures, ProtocolError/SdkError): dispatch the `mcp-debugger` agent instead.
- Running inspector sessions for test scaffolding.
- Deprecated APIs / mismatched SDKs: load [mcp-migration].
- Server config (stderr logging, custom schemas): see [mcp-server].
- Client connection testing: see [mcp-client].

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
