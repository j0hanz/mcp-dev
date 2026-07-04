---
description: >-
  Guide to using the `@modelcontextprotocol/codemod` tool to automate refactoring of MCP TypeScript codebases from v1 to v2.
metadata:
  tags: [codemod, migration, refactoring, v1-to-v2]
  source: internal
---

# Codemod Migration Tool

The `@modelcontextprotocol/codemod` package provides a programmatic API and command-line tool to automate refactoring of MCP TypeScript codebases from v1 to v2.

## CLI Usage

Run the codemod across a directory: `npx @modelcontextprotocol/codemod@beta v1-to-v2 .`

Run on a single file: `npx @modelcontextprotocol/codemod@beta v1-to-v2 src/server.ts`

## Migration Scope & Mappings

The tool automates the following mechanical refactors:

1. **Import Path Rewriting:** Replaces `@modelcontextprotocol/sdk/...` with scoped packages:
   - `@modelcontextprotocol/client`
   - `@modelcontextprotocol/server`
   - `@modelcontextprotocol/core`
   - `@modelcontextprotocol/node` / `express` / `hono` / `fastify`
2. **Symbol Renaming:**
   - `McpError` → `ProtocolError`
   - `JSONRPCError` → `JSONRPCErrorResponse`
   - `StreamableHTTPError` → `SdkHttpError`
   - `ErrorCode` → `ProtocolErrorCode`
3. **Low-level Request Handlers:** Converts schema-based requests:
   - `server.setRequestHandler(CallToolRequestSchema, ...)` → `server.setRequestHandler('tools/call', ...)`
4. **Context Parameter Remapping:** Adapts `extra` parameters to v2 `ctx`:
   - `extra.signal` → `ctx.mcpReq.signal`
   - `extra.requestId` → `ctx.mcpReq.id`
   - `extra.sendRequest(...)` → `ctx.mcpReq.send(...)`
   - `extra.sendNotification(...)` → `ctx.mcpReq.notify(...)`
   - `extra.authInfo` → `ctx.http?.authInfo`
5. **Schema Structuring:**
   - Converts `.tool()` / `.prompt()` / `.resource()` calls to `registerTool` / `registerPrompt` / `registerResource`.
   - Wraps raw input configurations in `z.object()`.

### Code Review Comments

If a safe refactoring rule cannot be determined, the tool injects an inline error comment:

`/* @mcp-codemod-error SSEServerTransport moved to @modelcontextprotocol/server-legacy. */`

Find files with warnings: `grep -rn '@mcp-codemod-error' .`

---

## Programmatic API Reference

Import and trigger migrations using `ts-morph` and the runner API.

### Diagnostic Interfaces

```ts
enum DiagnosticLevel {
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
}

interface Diagnostic {
  level: DiagnosticLevel;
  file: string;
  line: number;
  message: string;
  category?: 'v2-gap';
  advisoryOnly?: boolean;
  tag?: 'zod-injected';
  insertComment?: boolean;
}
```

### Runner Configurations & Results

```ts
interface RunnerOptions {
  targetDir: string;
  dryRun?: boolean;
  verbose?: boolean;
  transforms?: string[];
  ignore?: string[];
}

interface RunnerResult {
  filesChanged: number;
  totalChanges: number;
  diagnostics: Diagnostic[];
  packageJsonChanges?: PackageJsonChange[];
  commentCount: number;
}
```
