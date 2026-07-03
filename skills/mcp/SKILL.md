---
name: mcp
description: Use when building, auditing, migrating, or testing MCP SDK v2 servers and clients. Also for planning workflows, authentication, and publishing.
user-invocable: true
argument-hint: plan | build | audit | migrate | auth | test | elicit | protocol | publish
metadata:
  category: technique
  triggers: mcp sdk v2, building server, migrating server, auditing mcp, debugging client, mcp workflow
---

# MCP Entry Point

Router for MCP SDK v2 skills when the specific `mcp-*` skill is unclear.

## How It Works

Without arguments, lists jobs. `/mcp <job>` follows Routing. Load sub-skills only when needed (never upfront or twice).

### Routing

- **Plan**: `/mcp-interview` → Build Workflow
- **Build**: [Build Workflow](#build-workflow)
- **Audit**: Dispatch the `mcp-auditor` agent — read-only, see [Audit Workflow](#audit-workflow) for its checklist
- **Migrate**: Dispatch the `mcp-migrator` agent — runs codemod → verify end to end
- **Auth**: `/mcp-auth`
- **Test**: Diagnosing a failure or error code → dispatch the `mcp-debugger` agent. Writing new tests → `/mcp-test`
- **Interactions**: `/mcp-elicitation`
- **Transports**: `/mcp-advanced-protocol`
- **Publish**: `/mcp-server-build` → `references/distribution.md`

Agents handle the read-heavy or multi-step jobs above so their bulk reads don't fill this context. For a narrow, single-file question, load the matching skill directly instead of dispatching an agent.

### Build Workflow

`Clarify` → `Scaffold` → `[Auth]` → `[Interaction]` → `Test` → `[Distribute]` → `Verify` (`[...]` is conditional)

See detailed steps in [workflows.md](references/workflows.md).

### Audit Workflow

`Locate` → `Version` → `Design` → `[Security]` → `[Interactions]` → `Tests` → `Intent` → `Report` (Read-only findings)

See detailed steps in [workflows.md](references/workflows.md).

## Examples & Mistakes

- Server Config: `/mcp-server-build` | Client Connection: `/mcp-client-build`
- **Mistake**: Loading sub-skills upfront/out-of-order.
- **Mistake**: Duplicating SDK rules or code here.
- **Mistake**: Skipping `docs/mcp-decisions.md` before building.
