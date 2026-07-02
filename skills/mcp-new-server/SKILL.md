---
name: mcp-new-server
description: User-invoked workflow for building a new MCP server end to end with the TypeScript SDK v2. Routes the agent through the knowledge skills in order — server building, auth for HTTP transports, interaction patterns for tools that need user input or progress, and testing before completion.
disable-model-invocation: true
---

# New MCP Server

Build a TypeScript SDK v2 MCP server. Load knowledge skills using the Skill tool _only_ at the exact step they are required. Do not load them upfront.

## Workflow

1. **Clarify:** Load `mcp-interview`. Lock scope, transport, auth, tool surface, and interaction decisions; obtain the Decision Record before scaffolding.
2. **Scaffold:** Load `mcp-server-build`. Set up registrations, schemas, and transport wiring.
3. **HTTP Auth (If HTTP):** Load `mcp-auth`. Secure endpoints before writing handlers. Skip if using stdio.
4. **Complex Tools (If interactive/long):** Load `mcp-elicitation`. Wire user prompts, progress tracking, and cancellation. Skip if not needed.
5. **Test (Mandatory):** Load `mcp-test`. Write and pass `InMemoryTransport` tests covering every tool.
6. **Distribute (If publishing):** Load `mcp-distribute` if the Decision Record calls for npm distribution. Skip if local-only.
7. **Verify:** Complete only when all tests pass and the server starts cleanly.

## Strict Rules

- **Never** skip Step 1 (`mcp-interview`) or Step 5. No scaffolding without a Decision Record.
- **Never** reload an already loaded skill.
- Keep SDK specifics inside the knowledge skills, not in this workflow.
