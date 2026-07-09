---
name: mcp
description: Use when starting any MCP SDK v2 task — `/mcp <job>` routes to the matching skill or agent; no argument lists the available jobs.
user-invocable: true
disable-model-invocation: true
argument-hint: '[plan|build|audit|migrate|auth|test|elicit|protocol|publish]'
metadata:
  category: technique
---

# Model Context Protocol (MCP) Router

<!-- Twin of mcp-router (this skill): user-invocable /mcp slash entry. mcp-router is the model-invoked router injected by the SessionStart hook. -->

## Usage

`/mcp [plan | build | audit | migrate | auth | test | elicit | protocol | publish]`

## Sub-Skills

- **`/mcp plan`**: Runs planning workflows (requires [mcp-planning]).
- **`/mcp build`**: Invokes [mcp-server] scaffolding or [mcp-client] setup workflows.
- **`/mcp audit`**: Dispatches the `mcp-auditor` agent to perform a read-only codebase readiness review.
- **`/mcp migrate`**: Dispatches the `mcp-migrator` agent to convert MCP SDK v1 to v2.
- **`/mcp auth`**: Routes to [mcp-auth] for authentication mechanisms.
- **`/mcp test`**: Routes to [mcp-test] or dispatches the `mcp-debugger` agent.
- **`/mcp elicit`**: Routes to [mcp-elicitation] for advanced interaction patterns.
- **`/mcp protocol`**: Routes to [mcp-protocol] for custom transports or low-level messaging.
- **`/mcp publish`**: Routes to [mcp-server] `references/distribution.md`.
