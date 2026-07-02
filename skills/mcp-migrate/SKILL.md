---
name: mcp-migrate
description: Use when migrating MCP TypeScript SDK v1 code to the v2 packages, or when v1 APIs like SSEServerTransport, McpError, or RequestHandlerExtra stop resolving after an upgrade.
user-invocable: false
metadata:
  category: technique
  triggers: migrating mcp, upgrade sdk, SSEServerTransport, McpError, RequestHandlerExtra, sdk v1 to v2
---

# Migrating MCP SDK v1 to v2

Upgrades a project from `@modelcontextprotocol/sdk` v1 to the split v2 packages (`2.0.0-beta.2`). Requires Node.js ≥ 20. Official reference: https://ts.sdk.modelcontextprotocol.io/v2/

```
codemod -> fix markers -> renames -> removed APIs -> deprecations -> manual follow-ups -> tsc + tests
```

## When to Use

- Migrating MCP TypeScript SDK v1 code to the v2 packages.
- When v1 APIs like `SSEServerTransport`, `McpError`, or `RequestHandlerExtra` stop resolving after an upgrade.

## How It Works

### Step 1: Run the codemod

```sh
npx @modelcontextprotocol/codemod@beta v1-to-v2 .   # run at the package root, not ./src
grep -rn '@mcp-codemod-error' .
tsc --noEmit && <formatter> && <tests>
```

The codemod rewrites imports, renames, and mechanical API shifts. It leaves a `@mcp-codemod-error` marker wherever it couldn't determine the right rewrite — grep for those and fix them by hand.

### Step 2: Check the new package layout and renames

The single v1 package is now 9 scoped packages. See [`references/tables.md`](references/tables.md#package-split) for the full split and [`references/tables.md`](references/tables.md#key-renames) for renamed APIs (`McpError` → `ProtocolError`, `RequestHandlerExtra` → `ServerContext`/`ClientContext`, etc.).

### Step 3: Removed — fix manually

- `SSEServerTransport` moved to `@modelcontextprotocol/server-legacy/sse`; prefer Streamable HTTP for new code.
- OAuth helpers moved to `@modelcontextprotocol/server-legacy/auth`.
- `WebSocketClientTransport` and experimental tasks are gone — no replacement.

### Step 4: Deprecated — migrate within the year

- **Sampling** — call the LLM provider directly instead of routing through the client.
- **Roots** — pass paths as tool arguments instead of relying on client-advertised roots.
- **Logging** — use stderr or OpenTelemetry instead of `sendLoggingMessage`.

### Step 5: Manual follow-ups the codemod can't do

See [`references/tables.md`](references/tables.md#adopting-the-2026-07-28-era) for the full legacy-vs-modern axis comparison.

1. Swap the server entry point: `createMcpHandler` for HTTP, `serveStdio` for stdio.
2. Return `input_required` instead of blocking on `elicitInput` for new mid-call prompts.
3. Persist cross-round data with `requestState`, not ad hoc session storage.
4. Set `versionNegotiation: { mode: 'auto' }` so clients negotiate the era instead of hardcoding one.
5. Replace unsolicited `list_changed` polling with a `subscriptions/listen` stream.
6. CJS→ESM / Node 20 pre-flight — the codemod doesn't convert module systems; do this by hand first.
7. Header reads — `ctx.http?.req?.headers` bracket access becomes `.get()` calls (sending plain-record headers still works unchanged).
8. **Testing & Verification** — Once manual follow-ups are complete, load the `/mcp-test` skill to write tests and diagnose integration or negotiation errors.

## Examples

For full comparison tables, refer to:

- Package split, key renames, and legacy-vs-modern era comparisons: [references/tables.md](references/tables.md)

## Common Mistakes

- Forgetting module module conversion (CJS to ESM) prior to running the codemod.
- Not searching for and resolving all `@mcp-codemod-error` markers left by the codemod.
- Continuing to use deprecated features like sampling, client-advertised roots, or `sendLoggingMessage` (these should be replaced with native alternatives).
