---
name: mcp
description: Router for MCP SDK v2 tasks (build, migrate, audit, debug) when the correct sub-skill is unclear.
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
- **Audit**: [Audit Workflow](#audit-workflow)
- **Migrate**: `/mcp-migrate` → `/mcp-test`
- **Auth**: `/mcp-auth`
- **Test**: `/mcp-test`
- **Interactions**: `/mcp-elicitation`
- **Transports**: `/mcp-advanced-protocol`
- **Publish**: `/mcp-server-build` → `references/distribution.md`

### Build Workflow

`Clarify` → `Scaffold` → `[Auth]` → `[Interaction]` → `Test` → `[Distribute]` → `Verify` (`[...]` is conditional)

See detailed steps in [workflows.md](file:///C:/mcp-dev/skills/mcp/references/workflows.md).

### Audit Workflow

`Locate` → `Version` → `Design` → `[Security]` → `[Interactions]` → `Tests` → `Intent` → `Report` (Read-only findings)

See detailed steps in [workflows.md](file:///C:/mcp-dev/skills/mcp/references/workflows.md).

## Examples & Mistakes

- Server Config: `/mcp-server-build` | Client Connection: `/mcp-client-build`
- **Mistake**: Loading sub-skills upfront/out-of-order.
- **Mistake**: Duplicating SDK rules or code here.
- **Mistake**: Skipping `docs/mcp-decisions.md` before building.
