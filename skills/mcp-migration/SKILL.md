---
name: mcp-migration
description: Reference material for MCP SDK v1→v2 migration — load alongside the mcp-migrator agent (which runs the codemod), or when applying codemods/renames manually.
user-invocable: false
metadata:
  category: technique
---

# Migrating MCP SDK v1 to v2

Upgrades from `@modelcontextprotocol/sdk` v1 to split v2 packages on Node ≥ 20. Official docs: https://ts.sdk.modelcontextprotocol.io/v2/

Flow: `scope` ➔ `codemod` ➔ `errors` ➔ `packages` ➔ `deprecations` ➔ `mcpserver` ➔ `tsconfig` ➔ `verify`

> For 2026-07-28 era adoption after migration, see `references/tables.md` → 'Adopting the 2026-07-28 Era'.

## Steps

1. **Confirm Scope**: Ensure the codebase actually contains `@modelcontextprotocol` dependencies or legacy v1 imports.

- [ ]: Codebase confirmed to contain `@modelcontextprotocol` dependencies or legacy v1 imports.

2. **Execute Codemod**: Run the official migrator codemod CLI — see [codemod-reference.md](references/codemod-reference.md) for the `npx` invocation and [tables.md](references/tables.md) for the rename mappings it applies.

- [ ]: Official migrator codemod CLI executed successfully.

3. **Resolve Flags**: Find and manually resolve all `@mcp-codemod-error` inline comments — see [codemod-reference.md](references/codemod-reference.md) for the `grep` command.

- [ ]: All `@mcp-codemod-error` inline comments are found and resolved.

4. **Update Packages**: Convert deprecated `@modelcontextprotocol/sdk` dependencies to appropriate v2 packages from [references/tables.md](references/tables.md). Load `@modelcontextprotocol/server-legacy/sse` (subpath) if using `SSEServerTransport`.

- [ ]: Deprecated `@modelcontextprotocol/sdk` deps converted to split v2 packages; SSE uses `@modelcontextprotocol/server-legacy/sse`.

5. **Modernize State & Flow**:
   - Change `elicitInput` calls to stateless `inputRequired(...)` returns — `elicitInput` survives the rename but is superseded (import `inputRequired` from `@modelcontextprotocol/server`).
   - Employ `requestState` context properties for multi-round communication.
   - Replace legacy `list_changed` events with modern `subscriptions/listen` streams.

- [ ]: `elicitInput`→`inputRequired`, `requestState` wired for multi-round flows, `list_changed`→`subscriptions/listen`.

6. **Adopt McpServer**: Change low-level `Server` implementations to modern `McpServer` where appropriate to automate capability registration, and transition to Standard Schema objects (e.g. `z.object(...)` from zod ≥4.2.0; ArkType as-is; Valibot via `@valibot/to-json-schema`).

- [ ]: Low-level `Server`→`McpServer` where appropriate; Standard Schema objects adopted.

7. **Transition TS Config**: Configure `tsconfig.json` modules to `"NodeNext"`, `"moduleResolution": "NodeNext"` and set `"type": "module"` in `package.json` for ESM (recommended). v2 is ESM-first but ships a CommonJS build too, so CommonJS projects can `require('@modelcontextprotocol/…')` directly — no dynamic `import()` shim required.

- [ ]: The app uses modern ECMAScript Modules (ESM) with a verified `NodeNext` resolution context.

8. **Verify with Tests**: Validate code functionality using [mcp-test] integration and unit assertions.

- [ ]: Tests via [mcp-test] compile and pass against the migrated code.

## Completion Criteria

To consider a migration complete, you must verify:

- [ ] No remaining references to the single legacy `@modelcontextprotocol/sdk` library exist in `package.json` or source files.
- [ ] All instances of `@mcp-codemod-error` comments are resolved and removed from the codebase.
- [ ] Low-level manual capabilities setup is migrated to Zod-backed `McpServer` calls where applicable.
- [ ] Deprecated stateful push APIs (such as older roots sampling or logging mechanisms) are swapped for modern stateless alternatives.
- [ ] The test suite compiled by [mcp-test] executes and passes successfully.

## References

- Express: [framework-express.md](../mcp-server/references/framework-express.md)
- Fastify: [framework-fastify.md](../mcp-server/references/framework-fastify.md)
- Hono: [framework-hono.md](../mcp-server/references/framework-hono.md)
- Codemod: [codemod-reference.md](references/codemod-reference.md)
