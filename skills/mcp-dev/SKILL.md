---
name: mcp-dev
description: Use when building, auditing, migrating, or testing MCP SDK v2 servers and clients. Also for planning workflows, authentication, and publishing.
user-invocable: false
metadata:
  category: technique
  triggers: mcp sdk v2, building server, migrating server, auditing mcp, debugging client, mcp workflow
---

# MCP Dev Router & Workflows

Entry point and canonical workflows for MCP SDK v2. Load sub-skills only when needed (never upfront or twice).

## Routing Map

- **Plan**: [mcp-interview]
- **Build**: [mcp-server-build] (server) or [mcp-client-build] (client)
- **Auth**: [mcp-auth]
- **Interaction**: [mcp-elicitation]
- **Protocol**: [mcp-advanced-protocol]
- **Migrate**: `mcp-migrator` agent (codemods)
- **Test/Debug**: `mcp-debugger` agent or [mcp-test]
- **Audit**: `mcp-auditor` agent (read-only)
- **Publish**: [mcp-server-build] `references/distribution.md`

---

## Workflows

### Build Workflow

```
[Clarify] ---> [Scaffold] ---> [Auth]* ---> [Interact]* ---> [Test] ---> [Distribute]* ---> [Verify]
```

1. **Clarify**: Run [mcp-interview] -> output `docs/mcp-decisions.md`.
2. **Scaffold**: Load [mcp-server-build] or [mcp-client-build] to scaffold.
3. **Auth** (*): HTTP/SSE/OAuth security. Load [mcp-auth].
4. **Interact** (*): Prompts, progress, cancellation. Load [mcp-elicitation].
5. **Test**: Load [mcp-test] to implement tests.
6. **Distribute** (*): Package setup / deployment. See [mcp-server-build] `references/distribution.md`.
7. **Verify**: Ensure all tests pass.

### Audit Workflow

```
[Locate] ---> [Version] ---> [Design] ---> [Security]* ---> [Interact]* ---> [Tests] ---> [Intent] ---> [Report]
```

1. **Locate**: Scan for `@modelcontextprotocol/` imports.
2. **Version**: If SDK v1, load [mcp-migrate] (flag as Blocker).
3. **Design**: Check structure via [mcp-server-build] / [mcp-client-build].
4. **Security** (*): Audit auth (HTTP). Load [mcp-auth].
5. **Interact** (*): Audit prompts/progress. Load [mcp-elicitation].
6. **Tests**: Check test coverage via [mcp-test].
7. **Intent**: Validate code matches `docs/mcp-decisions.md`.
8. **Report**: Rank findings: Blockers, Should Fix, Nice to Have. Formatted as:
   `- [file:line] | [Issue details] | [Skill to fix]`

_(_) denotes conditional steps.*
