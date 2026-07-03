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

## How It Works

### 1. Test in-process

- HTTP servers: Call `handler.fetch(request)` directly to bypass real ports.
- Direct server testing: Use `invoke(server, message, ctx)` from `@modelcontextprotocol/server/invoke`.
- Stdio servers: Use a child process transport (`StdioClientTransport`).
- See [references/examples.md](references/examples.md#in-process-test-harness) for test harness setup.

### 2. Manual testing

- Stdio servers: Run the MCP inspector to probe commands.
- HTTP servers: Perform manual JSON-RPC POST requests via `curl`.
- See [references/examples.md](references/examples.md#manual-testing) for command details.

### 3. Error channels

- **Tool errors**: Report inside result using `isError: true` so the model can self-correct.
- **Protocol/SDK errors**: Match using `.code` or SDK constants instead of `instanceof`.
- See [references/error-codes.md](references/error-codes.md) and [references/tables.md](references/tables.md) for details and code lookups.
