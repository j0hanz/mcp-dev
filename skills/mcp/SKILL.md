---
name: mcp
description: Use when building, auditing, migrating, or testing MCP SDK v2 servers and clients. Also for planning workflows, authentication, and publishing.
user-invocable: true
disable-model-invocation: true
argument-hint: plan | build | audit | migrate | auth | test | elicit | protocol | publish
metadata:
  category: technique
---

## Usage

`/mcp [plan | build | audit | migrate | auth | test | elicit | protocol | publish]`

## Sub-Skills

- **`/mcp plan`**: Runs planning workflows (requires `/mcp-interview`).
- **`/mcp build`**: Invokes server scaffolding or client setup workflows.
- **`/mcp audit`**: Dispatches the `mcp-auditor` agent to perform a read-only codebase readiness review.
- **`/mcp migrate`**: Dispatches the `mcp-migrator` agent to convert MCP SDK v1 to v2.
- **`/mcp auth`**: Routes to `/mcp-auth` for authentication mechanisms.
- **`/mcp test`**: Routes to `/mcp-test` or dispatches the `mcp-debugger` agent.
- **`/mcp elicit`**: Routes to `/mcp-elicitation` for advanced interaction patterns.
- **`/mcp protocol`**: Routes to `/mcp-advanced-protocol` for custom transports or low-level messaging.
- **`/mcp publish`**: Routes to `/mcp-server-build` and references distribution guidelines.
