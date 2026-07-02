---
name: mcp-test
description: Use when an MCP server or client needs tests or is misbehaving — connection failures, opaque ProtocolError/SdkError codes, or inspector sessions in the TypeScript SDK v2.
user-invocable: false
metadata:
  category: technique
  triggers: mcp test, connection failures, ProtocolError, SdkError, inspector sessions, debug mcp
---

# Testing & Debugging MCP (TypeScript SDK v2)

Covers testing and error diagnosis for `2.0.0-beta.2`. Official reference: https://ts.sdk.modelcontextprotocol.io/v2/

```
in-process tests -> manual probe (inspector | curl) -> match error channel -> look up code
```

## When to Use

- Writing tests for MCP servers or clients in TypeScript/JavaScript.
- Troubleshooting connection failures, unexpected errors, or ProtocolError/SdkError exceptions.
- Running inspector sessions or manual HTTP/stdio probes.

## How It Works

### 1. Test in-process (no network, no child process)

- Fastest path for an HTTP server: call `handler.fetch` directly, or point `StreamableHTTPClientTransport`'s `fetch` option at it — nothing dials a real port.
- `InMemoryTransport.createLinkedPair()` links a server and client for direct testing; import both ends from the same package version, or the linked pair's message types drift.
- A stdio server under test needs the real process: `new StdioClientTransport({ command: 'node', args: ['dist/server.js'] })`.

### 2. Manual testing

- stdio server: `npx @modelcontextprotocol/inspector npx tsx src/index.ts`
- HTTP server:

  ```sh
  curl -X POST http://127.0.0.1:3000/mcp -H 'Content-Type: application/json' \
    -H 'Accept: application/json, text/event-stream' \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
  ```

### 3. Common errors

| Error                                                | Fix                                                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `SyntaxError: ... is not valid JSON`                 | Something wrote to stdout on a stdio server. Log with `console.error`, never `console.log`. |
| `TS2589: Type instantiation is excessively deep`     | Multiple Zod versions in the tree. Dedupe to a single Zod 4.                                |
| `ReferenceError: crypto is not defined`              | Node < 20. Upgrade, or polyfill: `globalThis.crypto = webcrypto`.                           |
| `SdkError: ERA_NEGOTIATION_FAILED`                   | Client and server share no protocol era. Set `versionNegotiation: { mode: 'auto' }`.        |
| `SdkError: METHOD_NOT_SUPPORTED_BY_PROTOCOL_VERSION` | Calling a method the negotiated era doesn't have — the error names the replacement.         |
| `No exported member 'SSEServerTransport'`            | Moved to `@modelcontextprotocol/server-legacy/sse`.                                         |

### 4. Error channels

- **Tool errors** (`isError: true`) are results the model reads and can retry from — don't wrap tool calls in try/catch expecting a throw.
- **Protocol errors** are thrown `ProtocolError`s the caller's code must handle.
- A tool handler can't emit a protocol error: every throw inside one becomes `isError: true`, except `UrlElicitationRequiredError` (`-32042`), which propagates.
- Match errors by `.code`, not `instanceof` — instances can come from a different copy of the package across a workspace boundary. `ProtocolError.fromError(code, message, data)` reconstructs a typed error across bundle boundaries.

## Examples

Code implementation examples are located in:

- In-process test harnesses and direct endpoint test code: [references/examples.md](references/examples.md)

## Common Mistakes

- Writing to `stdout` (e.g. `console.log`) in a stdio server, which breaks the JSON-RPC wire communication.
- Having multiple Zod versions in the tree, causing deep type instantiation errors (`TS2589`).
- Relying on `instanceof ProtocolError` across bundle boundaries (check `.code` or use `ProtocolError.fromError` instead).
- Attempting to emit protocol errors from tool handlers (use `{ isError: true }` results instead).
