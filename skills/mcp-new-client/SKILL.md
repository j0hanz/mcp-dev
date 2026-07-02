---
name: mcp-new-client
description: User-invoked workflow for building a new MCP client end to end with the TypeScript SDK v2. Routes the agent through the knowledge skills in order — client building, OAuth when the target server is protected, interaction callbacks when the server elicits or samples, and testing before completion.
disable-model-invocation: true
---

# New MCP Client

Build an MCP client using TypeScript SDK v2. **Strict Rule:** Load skills one at a time using the Skill tool exactly when required by the workflow. Do not load skills upfront.

## Workflow

1. **Clarify Scope:** Load `mcp-interview`. Lock target server(s), transport, auth, and callback decisions; obtain the Decision Record before scaffolding.
2. **Scaffold Client:** Load `mcp-client-build`. Setup `Client`, transport, connection, tool calls, and list-changed handling.
3. **Configure Auth:** _(Skip if server is open)_. If protected, load `mcp-auth-oauth` and wire the client-side provider.
4. **Implement Callbacks:** _(Skip if unused)_. If the server elicits input, samples, or reports progress, load `mcp-interaction-patterns` and implement callbacks.
5. **Test Client:** Load `mcp-testing-debugging`. Test against an in-process fake server using `InMemoryTransport`. Run all tests.
6. **Verify Success:** Finish only when tests pass and the client connects, lists, and executes successfully against the real target.

## Strict Rules

- **Never** skip Step 1 (`mcp-interview`) or Step 5. No scaffolding without a Decision Record.
- **Never** reload a skill already active in this session.
- **Never** assume SDK specifics. Rely exclusively on the loaded skills.
