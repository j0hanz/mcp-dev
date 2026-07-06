---
description: >-
  Detailed API reference and Fastify integration patterns for migrating HTTP/SSE servers to MCP v2.
metadata:
  tags: [fastify, server, migration, integration]
  source: internal
---

# Fastify Integration

The `@modelcontextprotocol/fastify` package provides Fastify plugins and hooks to run MCP servers.

## Installation

Install dependencies: `npm install @modelcontextprotocol/server @modelcontextprotocol/fastify @modelcontextprotocol/node fastify`

## Security Options

Fastify app factories enable Host/Origin verification by default on localhost to prevent DNS-rebinding and CSRF attacks.

## API Reference

### `createMcpFastifyApp(options?)`

Initializes a Fastify application with integrated DNS-rebinding protection and Origin validation hooks. Fastify parses JSON bodies by default.

- **Options:**
  - `host` (string): Hostname to bind to. Default is `'127.0.0.1'`.
  - `allowedHosts` (string[]): Allowed hostnames for DNS-rebinding protection.
  - `allowedOrigins` (string[]): Allowed browser origin hostnames.

### Hooks & Utility Middleware

- `hostHeaderValidation(allowedHostnames: string[]): onRequestHook`
- `localhostHostValidation(): onRequestHook` (restricts to localhost hostnames)
- `originValidation(allowedOrigins: string[]): onRequestHook`
- `localhostOriginValidation(): onRequestHook`

---

## Usage Examples

### Stateless Per-Request Integration

```ts
import { createMcpFastifyApp } from '@modelcontextprotocol/fastify';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';

const mcpHandler = createMcpHandler(() => {
  const server = new McpServer({ name: 'fastify-example', version: '1.0.0' });
  server.registerTool(
    'greet',
    { inputSchema: z.object({ name: z.string() }) },
    async ({ name }) => ({
      content: [{ type: 'text', text: `Hello ${name}` }],
    }),
  );
  return server;
});

const app = createMcpFastifyApp();
const nodeHandler = toNodeHandler(mcpHandler);

app.all('/mcp', async (req, reply) => {
  await nodeHandler(req.raw, reply.raw, req.body);
});

app.listen({ port: 3000, host: '127.0.0.1' });
```
