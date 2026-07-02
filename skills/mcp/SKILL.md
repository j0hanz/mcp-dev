---
name: mcp
description: User-invoked entry point for all MCP TypeScript SDK v2 skills. With no argument, lists the available MCP skills and workflows. With a job argument, loads the right knowledge skills in the right order for that job.
disable-model-invocation: true
---

# MCP Skill Index

**Purpose:** Entry point for MCP SDK v2.
**Execution:**

- **No argument:** Display the Catalog.
- **Argument provided:** Match intent to the Routing Table and load required skills sequentially via the Skill tool.

## Catalog

**Workflows (User Slash Commands):**

- `/mcp-new-server`: Build server end-to-end
- `/mcp-new-client`: Build client end-to-end
- `/mcp-audit`: Read-only production readiness audit

**Knowledge Skills:**
`mcp-interview`, `mcp-server-build`, `mcp-client-build`, `mcp-auth`, `mcp-elicitation`, `mcp-test`, `mcp-advanced-protocol`, `mcp-migrate-v1-to-v2`, `mcp-distribute`

## Routing Table

| Intent / Argument        | Required Skill Sequence                                                                                                 |
| :----------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| **Plan / Clarify**       | `mcp-interview` → then route to the matching build workflow                                                             |
| **Build Server**         | `mcp-server-build` → `mcp-auth` (if HTTP) → `mcp-elicitation` (if interactive) → `mcp-test`                             |
| **Build Client**         | `mcp-client-build` → `mcp-auth` (if protected) → `mcp-test`                                                             |
| **Audit / Ship**         | Route to `/mcp-audit` workflow                                                                                          |
| **Migrate v1 to v2**     | `mcp-migrate-v1-to-v2` → `mcp-test`                                                                                     |
| **Auth / Tokens**        | `mcp-auth`                                                                                                              |
| **Test / Debug**         | `mcp-test`                                                                                                              |
| **Interaction Patterns** | `mcp-elicitation`                                                                                                       |
| **Protocol / Transport** | `mcp-advanced-protocol`                                                                                                 |
| **Package / Publish**    | `mcp-distribute`                                                                                                        |

## Strict Rules

1. **Tool Restriction:** Never load Workflows (slash commands) via the Skill tool.
2. **Delegation:** Maintain all SDK implementation details exclusively within the Knowledge Skills.
