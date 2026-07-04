---
name: mcp-migrate
description: Use when migrating an MCP TypeScript codebase from SDK v1 to SDK v2, using codemods, or updating imports and deprecated surfaces.
user-invocable: false
metadata:
  category: technique
  triggers: migrating mcp, upgrade sdk, SSEServerTransport, McpError, RequestHandlerExtra, sdk v1 to v2, McpServer
---

# Migrating MCP SDK v1 to v2

Upgrades from `@modelcontextprotocol/sdk` v1 to split v2 packages on Node ≥ 20. Official docs: https://ts.sdk.modelcontextprotocol.io/v2/

Flow: `codemod` ➔ `errors` ➔ `renames` ➔ `removed` ➔ `deprecations` ➔ `manual` ➔ `verify`

## Steps

1. **Verify**: Ensure the codebase actually contains `@modelcontextprotocol` dependencies or legacy v1 imports.
2. **Execute Codemod**: Run the official migrator codemod tool at the package root:
   ```sh
   npx @modelcontextprotocol/codemod@beta v1-to-v2 .
   ```
3. **Resolve Flags**: Run `grep -rn '@mcp-codemod-error' .` and manually resolve all flagged inline comments in the code.
4. **Update Packages**: Convert deprecated `@modelcontextprotocol/sdk` dependencies to appropriate v2 packages from [references/tables.md](references/tables.md). Load `@modelcontextprotocol/server-legacy` if using `SSEServerTransport`.
5. **Modernize State & Flow**:
   - Change `elicitInput` calls to stateless returning JSON-RPC `input_required` template definitions.
   - Employ `requestState` context properties for multi-round communication.
   - Replace legacy `list_changed` events with modern `subscriptions/listen` streams.
6. **Adopt McpServer**: Change low-level `Server` implementations to modern `McpServer` where appropriate to automate capability registration, and transition to direct Zod schemas.
7. **Transition TS Config**: Configure `tsconfig.json` modules to `"NodeNext"`, `"moduleResolution": "NodeNext"` and set `"type": "module"` in `package.json`.
8. **Verify with Tests**: Validate code functionality using [mcp-test] integration and unit assertions.

## Completion Criteria

To consider a migration complete, you must verify:

- [ ] No remaining references to the single legacy `@modelcontextprotocol/sdk` library exist in `package.json` or source files.
- [ ] All instances of `@mcp-codemod-error` comments are resolved and removed from the codebase.
- [ ] Low-level manual capabilities setup is migrated to Zod-backed `McpServer` calls where applicable.
- [ ] Deprecated stateful push APIs (such as older roots sampling or logging mechanisms) are swapped for modern stateless alternatives.
- [ ] The app uses modern ECMAScript Modules (ESM) with a verified `NodeNext` resolution context.
- [ ] The test suite compiled by [mcp-test] executes and passes successfully.

## References

- Express: [express-reference.md](references/express-reference.md)
- Fastify: [fastify-reference.md](references/fastify-reference.md)
- Hono: [hono-reference.md](references/hono-reference.md)
- Codemod: [codemod-reference.md](references/codemod-reference.md)
