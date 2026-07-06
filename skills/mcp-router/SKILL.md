---
name: mcp-router
description: Use when building, auditing, migrating, or testing MCP SDK v2 servers and clients. Also for planning workflows, authentication, and publishing.
user-invocable: false
metadata:
  category: technique
  triggers: mcp sdk v2, building server, migrating server, auditing mcp, debugging client, mcp workflow
---

# MCP Router & Workflows

Entry point and canonical workflows for MCP SDK v2. Load sub-skills only when needed (never upfront or twice).

## Routing Map

- **Plan**: [mcp-planning]
- **Build**: [mcp-server] (server) or [mcp-client] (client)
- **Auth**: [mcp-auth]
- **Interaction**: [mcp-elicitation]
- **Protocol**: [mcp-protocol]
- **Migrate**: `mcp-migrator` agent (runs codemods) — for reference material load [mcp-migration]
- **Test**: [mcp-test] (Build phase 5)
- **Debug**: `mcp-debugger` agent (on failure)
- **Audit**: `mcp-auditor` agent (read-only)
- **Publish**: [mcp-server] `references/distribution.md`

## Workflows

### Build Workflow

```
[Clarify] ---> [Scaffold] ---> [Auth]* ---> [Interact]* ---> [Test] ---> [Distribute]* ---> [Verify]
```

1. **Clarify**: Run [mcp-planning] -> output `docs/mcp-decisions.md` (includes era/protocol-revision posture — 2026-07-28 modern vs. legacy support).
2. **Scaffold**: Load [mcp-server] or [mcp-client]. Modern split v2 SDK deps, ESM-first (CommonJS also shipped — `require('@modelcontextprotocol/…')` resolves natively).
3. **Auth** (*): HTTP/OAuth (Streamable HTTP) security. Load [mcp-auth].
4. **Interact** (*): Prompts, progress, cancellation. Load [mcp-elicitation].
5. **Test**: Load [mcp-test] to implement tests; they compile and run to completion.
6. **Distribute** (*): Package setup / deployment. See [mcp-server] `references/distribution.md`.
7. **Verify**: All prior phase checks pass.

### Audit Workflow

```
[Locate] ---> [Version] ---> [Design] ---> [Security]* ---> [Interact]* ---> [Tests] ---> [Intent] ---> [Report]
```

1. **Locate**: Scan for `@modelcontextprotocol/sdk` (v1 single-package) imports.
2. **Version**: If SDK v1, load [mcp-migration] (flag as Blocker).
   - **Version (deprecated APIs)**: Grep for SEP-2577-deprecated subsystems (`listRoots`, `sendLoggingMessage`, `createMessage`, `setLoggingLevel`) and the removed variadic `.tool()`/`.prompt()`/`.resource()` registration — flag as Should Fix.
3. **Design**: Check structure via [mcp-server] / [mcp-client].
4. **Security** (*): Audit auth (HTTP). Load [mcp-auth].
5. **Interact** (*): Audit prompts/progress/cancellation. Load [mcp-elicitation].
6. **Tests**: Check test coverage via [mcp-test].
7. **Intent**: Validate code matches `docs/mcp-decisions.md`.
8. **Report**: Rank findings: Blockers, Should Fix, Nice to Have. Formatted as:
   `- [file:line] | [Issue details] | [Skill to fix]`

### Migrate Workflow

```
[Locate] ---> [Codemod] ---> [Errors] ---> [Packages] ---> [Deprecations] ---> [Era] ---> [Verify]
```

1. **Locate**: Scan for `@modelcontextprotocol/sdk` v1 imports.
2. **Codemod**: Run the `mcp-migrator` agent (`npx @modelcontextprotocol/codemod@beta v1-to-v2 .`).
3. **Errors**: Fix renamed error taxonomy (`ErrorCode → ProtocolErrorCode`; `RequestTimeout`/`ConnectionClosed → SdkErrorCode`).
4. **Packages**: Move to split packages (`@modelcontextprotocol/server` / `…/client`); SSE server → `@modelcontextprotocol/server-legacy/sse`.
5. **Deprecations**: Replace SEP-2577-deprecated roots/sampling/logging with elicitation; convert variadic `.tool()`/`.prompt()`/`.resource()` → `registerTool`/`registerPrompt`/`registerResource`.
6. **Era**: Adopt 2026-07-28 era posture (`legacy: 'stateless'|'reject'`) per [mcp-planning].
7. **Verify**: Tests pass; no `@modelcontextprotocol/sdk` v1 imports remain.

### Debug Workflow

```
[Reproduce] ---> [Classify] ---> [Isolate] ---> [Fix]
```

1. **Reproduce**: Capture the failing request/response or error code.
2. **Classify**: Match the error against [mcp-test] `references/error-codes.md` / `tables.md` (`ProtocolErrorCode` / `SdkErrorCode`).
3. **Isolate**: Narrow to transport, protocol, auth, or application layer; reload the matching skill ([mcp-client] / [mcp-protocol] / [mcp-auth] / [mcp-server]).
4. **Fix**: Apply the fix; re-run the reproducer.
