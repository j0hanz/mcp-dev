---
description: >-
  Detailed workflows for building, testing, and auditing Model Context Protocol (MCP) SDK v2 servers and clients.
metadata:
  tags: [workflow, audit, build, process]
  source: internal
---

# MCP Build and Audit Workflows

Detailed step-by-step instructions for building, testing, and auditing Model Context Protocol (MCP) SDK v2 servers and clients.

## Build Workflow

Use this workflow when creating a new MCP server or client.

`Clarify` → `Scaffold` → `[Auth]` → `[Interaction]` → `Test` → `[Distribute]` → `Verify`
_(Note: Steps in brackets `[...]` are conditional)_

1. **Clarify**: Load `/mcp-interview` to determine requirements and output the Decision Record (`docs/mcp-decisions.md`).
2. **Scaffold**: Load `/mcp-server-build` (prefer the high-level `McpServer` class and standard web server handlers) or `/mcp-client-build`.
3. **Auth** _(Conditional)_: Required for HTTP/SSE servers or protected clients. Load `/mcp-auth` to implement OAuth or token validation.
4. **Interaction** _(Conditional)_: Required if tools ask the user for confirmation, report progress, or run for a long time. Load `/mcp-elicitation`.
5. **Test**: Load `/mcp-test` to implement and run test suites.
6. **Distribute** _(Conditional)_: Required for server npm publication. Read `/mcp-server-build`'s `references/distribution.md`.
7. **Verify**: Run end-to-end integration checks. Considered complete only when tests pass and the system runs successfully.

---

## Audit Workflow

Executed automatically by the `mcp-auditor` agent when dispatched. Follow it directly yourself only for a narrow, single-file check that doesn't warrant a full sweep. Do not modify code unless explicitly requested.

`Locate` → `Version` → `Design` → `[Security]` → `[Interactions]` → `Tests` → `Intent` → `Report`

1. **Locate**: Search code for `@modelcontextprotocol/` imports. Document:
   - Server or client type
   - Transport channel (Stdio vs HTTP/SSE)
   - API level (`McpServer` vs low-level `Server`)
   - SDK version (v1 or v2)
2. **Version**: If SDK v1 is used, load `/mcp-migrate`. Migration should be flagged as the top finding.
3. **Design**: Load `/mcp-server-build` (and `/mcp-client-build` if client code is present) to audit structure.
4. **Security** _(Conditional)_: Load `/mcp-auth` for any HTTP code. Missing auth is a Blocker.
5. **Interactions** _(Conditional)_: Load `/mcp-elicitation` for tools with user prompts, progress tracking, or long-running tasks.
6. **Tests**: Load `/mcp-test` to review test coverage and mock setup.
7. **Intent**: Compare code with `docs/mcp-decisions.md`. Flag mismatch/missing decisions file. Flag unnecessary use of low-level `Server` instead of `McpServer` as a Should Fix.

### Reporting Findings

Compile a single ranked list categorized into:

- **Blockers**: Broken/insecure implementations unsafe for production.
- **Should Fix**: Violations of design rules.
- **Nice to Have**: Improvement suggestions.

List all skipped steps (e.g. "Skipped Auth: no HTTP transport"). Format each finding as:
`- [file:line] | [Issue details] | [Skill to fix it]`
